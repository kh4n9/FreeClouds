import { NextRequest, NextResponse } from "next/server";
import { File, type IFile } from "@/models/File";
import { telegramAPI, TelegramError } from "@/lib/telegram";
import { bufferToStream } from "@/lib/download-utils";
import { put as blobPut } from "@vercel/blob";

// Limit concurrent Telegram connections to avoid connect timeouts when
// assembling chunked files (Telegram throttles many parallel downloads).
const DOWNLOAD_CONCURRENCY = 8;

// Parallel-range download: split a single Telegram file into N ranged
// requests fetched concurrently (IDM-style), then emit in order. Telegram
// honors Range headers, so throughput ~= N × per-connection speed.
const RANGE_MAX_PARTS = 8;
const RANGE_MIN_SIZE = 4 * 1024 * 1024; // below this, one connection is fine
const RANGE_MAX_SIZE = 256 * 1024 * 1024; // stay inside serverless memory

/** Parse `bytes=a-b` / `bytes=a-` against a known size; null when invalid. */
function parseRangeHeader(
  header: string,
  size: number,
): { start: number; end: number } | null {
  const match = header.match(/bytes=(\d+)-(\d*)/);
  if (!match || size <= 0) return null;
  const start = parseInt(match[1]!, 10);
  const end = match[2] ? parseInt(match[2], 10) : size - 1;
  if (start >= size || start > end) return null;
  return { start, end: Math.min(end, size - 1) };
}

/**
 * Download a Telegram file via 8 concurrent ranged requests and assemble it
 * in order. If Telegram ignores Range (200 instead of 206), the first
 * response already contains the whole body — reuse it and drop the rest.
 */
async function downloadFileInParallel(
  fileId: string,
  filePath: string,
  size: number,
): Promise<ReadableStream<Uint8Array>> {
  const numParts = Math.min(RANGE_MAX_PARTS, Math.max(1, Math.ceil(size / RANGE_MIN_SIZE)));
  const partSize = Math.ceil(size / numParts);

  const responses = await Promise.all(
    Array.from({ length: numParts }, (_, i) => {
      const start = i * partSize;
      const end = Math.min(start + partSize - 1, size - 1);
      return telegramAPI.downloadFileRange(filePath, start, end);
    }),
  );

  // Range unsupported: first response carries the full body.
  if (responses.some((r) => !r.isPartial)) {
    for (let i = 1; i < responses.length; i++) {
      responses[i]!.stream.getReader().cancel().catch(() => {});
    }
    return responses[0]!.stream;
  }

  const buffers: Buffer[] = new Array(numParts);
  await Promise.all(
    responses.map(async (response, i) => {
      const reader = response.stream.getReader();
      try {
        const buf: Uint8Array[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) buf.push(value);
        }
        buffers[i] = Buffer.concat(buf);
      } finally {
        reader.releaseLock();
      }
    }),
  );

  return bufferToStream(Buffer.concat(buffers));
}

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

function getDisplayName(file: IFile): string {
  return file.originalExt
    ? file.name.replace(/\.bin$/i, "") + file.originalExt
    : file.name;
}

/**
 * Builds a download Response for a file (streamed from Telegram, or
 * assembled from chunks for chunked files). No auth checks here — callers
 * are responsible for access control before calling this.
 */
export async function buildDownloadResponse(
  request: NextRequest,
  file: IFile,
): Promise<Response> {
  const isChunked = file.chunkedId && file.totalChunks && file.totalChunks > 1;

  const displayName = getDisplayName(file);
  const encodedFileName = encodeURIComponent(displayName);

  // Non-chunked file: stream directly from Telegram
  if (!isChunked) {
    const size = file.size || 0;
    const clientRangeHeader = request.headers.get("range");
    const parsedRange = clientRangeHeader ? parseRangeHeader(clientRangeHeader, size) : null;

    if (clientRangeHeader && !parsedRange) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    // Keep the request's own range requests single-connection (one Telegram
    // fetch); use parallel ranges only for full-file downloads.
    const canParallel =
      !clientRangeHeader && size >= RANGE_MIN_SIZE && size <= RANGE_MAX_SIZE;

    let fileStream: ReadableStream<Uint8Array>;
    let rangeFetch: { start: number; end: number } | null = parsedRange;
    try {
      if (canParallel) {
        let filePath = file.telegramFilePath || null;
        if (!filePath) {
          const info = await telegramAPI.getFile(file.fileId);
          filePath = info.file_path || null;
        }
        if (!filePath) throw new TelegramError("File path not available");
        if (filePath !== file.telegramFilePath) {
          File.updateOne({ _id: file._id }, { telegramFilePath: filePath }).catch(() => {});
        }
        fileStream = await downloadFileInParallel(file.fileId, filePath, size);
      } else if (parsedRange) {
        const cachedPath = file.telegramFilePath;
        const result = await telegramAPI.getFileStream(
          file.fileId,
          cachedPath || undefined,
          parsedRange,
        );
        if (result.filePath !== cachedPath) {
          File.updateOne({ _id: file._id }, { telegramFilePath: result.filePath }).catch(() => {});
        }
        fileStream = result.stream;
      } else {
        const cachedPath = file.telegramFilePath;
        const result = await telegramAPI.getFileStream(file.fileId, cachedPath || undefined);
        if (result.filePath !== cachedPath) {
          File.updateOne({ _id: file._id }, { telegramFilePath: result.filePath }).catch(() => {});
        }
        fileStream = result.stream;
      }
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
    headers.set("Accept-Ranges", "bytes");

    if (rangeFetch) {
      headers.set("Content-Range", `bytes ${rangeFetch.start}-${rangeFetch.end}/${size}`);
      headers.set("Content-Length", (rangeFetch.end - rangeFetch.start + 1).toString());
      return new Response(fileStream, { status: 206, headers });
    }

    if (size > 0) {
      headers.set("Content-Length", size.toString());
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
      if (result.filePath !== cachedPath) {
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
}
