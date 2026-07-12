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
import { put as blobPut } from "@vercel/blob";

function bufferToStream(buf: Buffer): ReadableStream<Uint8Array> {
  let offset = 0;
  const CHUNK_SIZE = 65536;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= buf.length) {
        controller.close();
        return;
      }
      const end = Math.min(offset + CHUNK_SIZE, buf.length);
      controller.enqueue(new Uint8Array(buf.subarray(offset, end)));
      offset = end;
    },
  });
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
        const cachedPath = (file as any).telegramFilePath;
        const result = await telegramAPI.getFileStream(file.fileId, cachedPath || undefined);
        if (!cachedPath && result.filePath) {
          (File as any).updateOne({ _id: file._id }, { telegramFilePath: result.filePath }).catch(() => {});
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
      headers.set("ETag", `"${(file._id as any).toString()}-${file.createdAt.getTime()}"`);
      headers.set("X-Content-Type-Options", "nosniff");
      headers.set("X-Frame-Options", "DENY");

      if (file.size && file.size <= 15 * 1024 * 1024) {
        headers.set("Content-Length", file.size.toString());
      }

      const range = request.headers.get("range");
      if (range && file.size) {
        const match = range.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const [, startStr, endStr] = match;
          const start = parseInt(startStr!, 10);
          const end = endStr ? parseInt(endStr, 10) : file.size - 1;
          if (start < file.size && end < file.size && start <= end) {
            headers.set("Content-Range", `bytes ${start}-${end}/${file.size}`);
            headers.set("Content-Length", (end - start + 1).toString());
            headers.set("Accept-Ranges", "bytes");
            return new Response(fileStream, { status: 206, headers });
          }
        }
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

    if (!chunks.length || chunks.length !== file.totalChunks) {
      return NextResponse.json({ error: "File chunks not found" }, { status: 404 });
    }

    // Already cached in Blob — redirect immediately
    if ((file as any).blobCacheUrl) {
      const redirectHeaders = new Headers();
      redirectHeaders.set("Location", (file as any).blobCacheUrl);
      redirectHeaders.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
      return new Response(null, { status: 302, headers: redirectHeaders });
    }

    // Download all chunks and assemble into buffer
    let assembled: Buffer;
    let elapsed = 0;
    let fileSizeMB = "0";
    const chunkTimings: number[] = [];
    try {
      const chunkBuffers: Buffer[] = await Promise.all(
        chunks.map(async (c) => {
          const t0 = Date.now();
          const cachedPath = (c as any).telegramFilePath;
          const result = await telegramAPI.getFileStream(c.fileId, cachedPath || undefined);
          if (!cachedPath && result.filePath) {
            (File as any).updateOne({ _id: c._id }, { telegramFilePath: result.filePath }).catch(() => {});
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
          const mb = (c as any).size / 1024 / 1024 || 0;
          chunkTimings.push(t1 - t0);
          console.log(`[download] Chunk ${(c as any).chunkIndex + 1}/${chunks.length}: ${mb.toFixed(1)}MB in ${t1 - t0}ms`);
          return Buffer.concat(parts);
        }),
      );
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

    // Try to cache in Vercel Blob (must complete within function timeout)
    const blobBudget = Math.max(1000, 9500 - elapsed);
    let blobUrl: string | null = null;

    try {
      const token = (process as any).env?.BLOB_READ_WRITE_TOKEN;
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
    } catch (err: any) {
      console.error(`[download] Blob failed: ${err?.message || err}`);
    }

    if (blobUrl) {
      (File as any).updateOne({ _id: file._id }, { blobCacheUrl: blobUrl }).catch(() => {});
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
