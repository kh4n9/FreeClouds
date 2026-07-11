import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File, IFile } from "@/models/File";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  verifyOwnership,
} from "@/lib/auth";
import { telegramAPI, TelegramError } from "@/lib/telegram";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

async function streamFromTelegram(fileId: string): Promise<ReadableStream<Uint8Array>> {
  const result = await telegramAPI.getFileStream(fileId);
  return result.stream;
}

async function* chunkStreamGenerator(chunks: IFile[]) {
  const streams = await Promise.all(
    chunks.map(c => telegramAPI.getFileStream(c.fileId)),
  );
  for (const s of streams) {
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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId } = await params;
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

    const headers = new Headers();
    headers.set("Content-Type", file.mime || "application/octet-stream");

    // Restore original extension if file was wrapped
    const displayName = file.originalExt
      ? file.name.replace(/\.bin$/i, "") + file.originalExt
      : file.name;
    const encodedFileName = encodeURIComponent(displayName);
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodedFileName}`);

    if (file.size) headers.set("Content-Length", file.size.toString());
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("ETag", `"${(file._id as any).toString()}-${file.createdAt.getTime()}"`);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");

    // Check if this is a chunked file (parent record)
    const isChunked = file.chunkedId && file.totalChunks && file.totalChunks > 1;

    if (isChunked) {
      // Fetch all chunks ordered by index
      const chunks = await File.find({
        chunkedId: file.chunkedId,
        chunkIndex: { $gte: 0 },
        owner: file.owner,
        deletedAt: null,
      }).sort({ chunkIndex: 1 });

      if (!chunks.length || chunks.length !== file.totalChunks) {
        return NextResponse.json({ error: "File chunks not found" }, { status: 404 });
      }

      const stream = iterableToStream(chunkStreamGenerator(chunks));
      return new Response(stream, { status: 200, headers });
    }

    // Normal file: single stream
    let fileStream: ReadableStream<Uint8Array>;
    try {
      const result = await telegramAPI.getFileStream(file.fileId);
      fileStream = result.stream;
    } catch (error) {
      console.error("Failed to get file from Telegram:", error);
      if (error instanceof TelegramError) {
        return NextResponse.json({ error: "File temporarily unavailable" }, { status: 503 });
      }
      return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
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
    console.error("Download file error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
