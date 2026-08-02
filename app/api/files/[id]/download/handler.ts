import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  verifyOwnership,
} from "@/lib/auth";
import { telegramAPI, TelegramError } from "@/lib/telegram";
import { bufferToStream } from "@/lib/download-utils";
import { put as blobPut } from "@vercel/blob";

// Limit concurrent Telegram connections to avoid connect timeouts when
// assembling chunked files (Telegram throttles many parallel downloads).
const DOWNLOAD_CONCURRENCY = 8;

async function downloadChunkWithLimit<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<Buffer>,
): Promise<Buffer[]> {
  const results: Buffer[] = new Array(items.length);
  let nextIndex = 0;

  async function pump() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]!, index);
    }
  }

  const workers = Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, items.length) }, pump);
  await Promise.all(workers);
  return results;
}

export async function handleDownload(request: NextRequest, paramsPromise: Promise<{ id: string }>) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId } = await paramsPromise;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    const file = await File.findById(fileId);
    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const isChunked = file.chunkedId && file.totalChunks && file.totalChunks > 1;

    const displayName = file.originalExt
      ? file.name.replace(/\.bin$/i, "") + file.originalExt
      : file.name;
    const encodedFileName = encodeURIComponent(displayName);

    // Non-chunked file: stream directly from Telegram
    if (!isChunked) {
      let fileStream: ReadableStream<Uint8Array>;
      try {
        const cachedPath = file.telegramFilePath;
        const result = await telegramAPI.getFileStream(file.fileId, cachedPath || undefined);
        if (!cachedPath && result.filePath) {
          File.updateOne({ _id: file._id }, { telegramFilePath: result.filePath }).catch(() => {});
        }
        fileStream = result.stream;
      } catch (error) {
        console.error("Failed to get file from Telegram:", error);
        if (error instanceof TelegramError) {
          return NextResponse.json({ error: "File temporarily unavailable" }, { status: 503 });
        }
        return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
      }

      const headers = new Headers();
      headers.set("Content-Type", file.mime || "application/octet-stream");
      headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
      headers.set("Cache-Control", "private, max-age=3600");
      headers.set("ETag", `"${file._id.toString()}-${file.createdAt.getTime()}"`);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");
      headers.set("Accept-Ranges", "none");

      if (file.size && file.size <= 15 * 1024 * 1024) {
        headers.set("Content-Length", file.size.toString());
      }

      return new Response(fileStream, { status: 200, headers });
    }

    // Chunked file
    const startTime = Date.now();

    const chunks = await File.find({
      chunkedId: file.chunkedId,
      chunkIndex: { $gte: 0 },
      owner: file.owner,
      deletedAt: null,
    }).sort({ chunkIndex: 1 });

    const foundIndices = chunks.map((c) => c.chunkIndex);
    console.log(`[download] Chunked file ${file.chunkedId}: totalChunks=${file.totalChunks}, found=${chunks.length}, indices=[${foundIndices.join(",")}]`);

    if (!chunks.length || chunks.length !== file.totalChunks) {
      console.error(`[download] Chunk mismatch: expected ${file.totalChunks} chunks, found ${chunks.length}`);
      return NextResponse.json({ error: "File chunks not found" }, { status: 404 });
    }

    // Reject non-contiguous chunks instead of silently producing a corrupted file
    const contiguous = chunks.every((c, i) => c.chunkIndex === i);
    if (!contiguous) {
      const missing = Array.from({ length: file.totalChunks }, (_, i) => i)
        .filter((i) => !chunks.some((c) => c.chunkIndex === i));
      console.error(`[download] Non-contiguous chunks: missing=[${missing.join(",")}]`);
      return NextResponse.json({ error: "File chunks are incomplete" }, { status: 404 });
    }

    // Already cached in Blob — redirect immediately (non-range requests only)
    if (file.blobCacheUrl && !request.headers.get("range")) {
      const redirectHeaders = new Headers();
      redirectHeaders.set("Location", file.blobCacheUrl);
      redirectHeaders.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
      return new Response(null, { status: 302, headers: redirectHeaders });
    }

    // Download all chunks and assemble into buffer
    let assembled: Buffer;
    let elapsed = 0;
    let fileSizeMB = "0";
    const chunkTimings: number[] = [];
    try {
      const chunkBuffers: Buffer[] = await downloadChunkWithLimit(chunks, async (c) => {
        const t0 = Date.now();
        const cachedPath = c.telegramFilePath;
        const result = await telegramAPI.getFileStream(c.fileId, cachedPath || undefined);
        if (!cachedPath && result.filePath) {
          File.updateOne({ _id: c._id }, { telegramFilePath: result.filePath }).catch(() => {});
        }
        const reader = result.stream.getReader();
        const parts: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
        }
        reader.releaseLock();
        const t1 = Date.now();
        const mb = c.size / 1024 / 1024 || 0;
        chunkTimings.push(t1 - t0);
        console.log(`[download] Chunk ${c.chunkIndex! + 1}/${chunks.length}: ${mb.toFixed(1)}MB in ${t1 - t0}ms`);
        return Buffer.concat(parts);
      });
      assembled = Buffer.concat(chunkBuffers);

      elapsed = Date.now() - startTime;
      fileSizeMB = (assembled.length / 1024 / 1024).toFixed(1);
      const avgChunk = (chunkTimings.reduce((a, b) => a + b, 0) / chunkTimings.length).toFixed(0);
      const minChunk = Math.min(...chunkTimings);
      const maxChunk = Math.max(...chunkTimings);
      console.log(`[download] Assembled ${fileSizeMB}MB in ${elapsed}ms | chunks avg=${avgChunk}ms min=${minChunk}ms max=${maxChunk}ms`);
    } catch (error) {
      console.error("Failed to download/assemble chunks:", error);
      return NextResponse.json({ error: "File temporarily unavailable" }, { status: 503 });
    }

    // Support range requests on the assembled buffer (video seek, etc.)
    const range = request.headers.get("range");
    if (range && assembled.length > 0) {
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const [, startStr, endStr] = match;
        const start = parseInt(startStr!, 10);
        const end = endStr ? parseInt(endStr, 10) : assembled.length - 1;
        if (start < assembled.length && end < assembled.length && start <= end) {
          const sliced = Buffer.from(assembled.subarray(start, end + 1));
          const rangeHeaders = new Headers();
          rangeHeaders.set("Content-Type", file.mime || "application/octet-stream");
          rangeHeaders.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
          rangeHeaders.set("Content-Range", `bytes ${start}-${end}/${assembled.length}`);
          rangeHeaders.set("Content-Length", sliced.length.toString());
          rangeHeaders.set("Accept-Ranges", "bytes");
          rangeHeaders.set("Cache-Control", "private, max-age=3600");
          rangeHeaders.set("X-Content-Type-Options", "nosniff");
          rangeHeaders.set("X-Frame-Options", "DENY");
          return new Response(bufferToStream(sliced), { status: 206, headers: rangeHeaders });
        }
      }
    }

    // Try to cache in Vercel Blob (must complete within function timeout)
    const blobBudget = Math.max(1000, 9500 - elapsed);
    let blobUrl: string | null = null;

    try {
      const token = process.env?.BLOB_READ_WRITE_TOKEN;
      console.log(`[download] BLOB_READ_WRITE_TOKEN exists: ${!!token}, blob budget: ${blobBudget}ms`);

      if (!token) {
        throw new Error("BLOB_READ_WRITE_TOKEN not set in environment");
      }

      const result = await Promise.race([
        blobPut(`downloads/${file.chunkedId}`, assembled, {
          access: "public",
          addRandomSuffix: true,
          contentType: file.mime || "application/octet-stream",
          token,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Blob timeout ${blobBudget}ms`)), blobBudget)),
      ]);
      blobUrl = result.url;
      console.log(`[download] Blob success: ${blobUrl}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[download] Blob failed: ${msg}`);
    }

    if (blobUrl) {
      File.updateOne({ _id: file._id }, { blobCacheUrl: blobUrl }).catch(() => {});
      const redirectHeaders = new Headers();
      redirectHeaders.set("Location", blobUrl);
      redirectHeaders.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
      return new Response(null, { status: 302, headers: redirectHeaders });
    }

    // Fallback: stream the assembled buffer (chunked, no Content-Length)
    console.log(`[download] Streaming ${fileSizeMB}MB directly`);
    const headers = new Headers();
    headers.set("Content-Type", file.mime || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
    headers.set("Content-Length", assembled.length.toString());
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");

    const stream = bufferToStream(assembled);
    return new Response(stream, { status: 200, headers });
  } catch (error) {
    console.error("Download error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
