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

async function* chunkStreamGenerator(results: { stream: ReadableStream<Uint8Array> }[]) {
  for (const s of results) {
    const reader = s.stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }
}

function iterableToStream(iterable: AsyncIterable<Uint8Array>): ReadableStream<Uint8Array> {
  const iterator = iterable[Symbol.asyncIterator]();
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();
        if (done) controller.close();
        else controller.enqueue(value);
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      iterator.return?.();
    },
  });
}

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

    // For chunked files: try Vercel Blob cache, fall back to direct streaming
    if (isChunked) {
      const chunks = await File.find({
        chunkedId: file.chunkedId,
        chunkIndex: { $gte: 0 },
        owner: file.owner,
        deletedAt: null,
      }).sort({ chunkIndex: 1 });

      if (!chunks.length || chunks.length !== file.totalChunks) {
        return NextResponse.json({ error: "File chunks not found" }, { status: 404 });
      }

      // If blobCacheUrl exists, redirect to cached blob
      if ((file as any).blobCacheUrl) {
        const redirectHeaders = new Headers();
        redirectHeaders.set("Location", (file as any).blobCacheUrl);
        redirectHeaders.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
        return new Response(null, { status: 302, headers: redirectHeaders });
      }

      // Download all chunks and assemble into buffer
      let assembled: Buffer;
      try {
        const chunkBuffers: Buffer[] = await Promise.all(
          chunks.map(async (c) => {
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
            return Buffer.concat(parts);
          }),
        );
        assembled = Buffer.concat(chunkBuffers);
      } catch (error) {
        console.error("Failed to assemble chunks:", error);
        return NextResponse.json({ error: "File temporarily unavailable" }, { status: 503 });
      }

      // Try to upload to Vercel Blob (with 5s timeout). On success, redirect.
      try {
        const { put } = await import("@vercel/blob");
        const blobResult = await Promise.race([
          put(`downloads/${file.chunkedId}`, assembled, {
            access: "public",
            addRandomSuffix: true,
            contentType: file.mime || "application/octet-stream",
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Blob upload timeout")), 5000)),
        ]);
        (File as any).updateOne({ _id: file._id }, { blobCacheUrl: blobResult.url }).catch(() => {});

        const redirectHeaders = new Headers();
        redirectHeaders.set("Location", blobResult.url);
        redirectHeaders.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
        return new Response(null, { status: 302, headers: redirectHeaders });
      } catch {
        // Blob upload failed or timed out → stream the assembled buffer directly
        const headers = new Headers();
        headers.set("Content-Type", file.mime || "application/octet-stream");
        headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);
        headers.set("Cache-Control", "private, max-age=3600");
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Frame-Options", "DENY");

        const stream = bufferToStream(assembled);
        return new Response(stream, { status: 200, headers });
      }
    }

    // Non-chunked file: stream directly from Telegram
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

    // For non-chunked files ≤15MB, set Content-Length for better UX
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
  } catch (error) {
    console.error("Download error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
