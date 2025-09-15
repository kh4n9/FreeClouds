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

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Validate file ID
    const fileId = params.id;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Find file
    const file = await File.findById(fileId);

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get file stream from Telegram
    let fileStream;
    try {
      const result = await telegramAPI.getFileStream(file.fileId);
      fileStream = result.stream;
    } catch (error) {
      console.error("Failed to get file from Telegram:", error);

      if (error instanceof TelegramError) {
        return NextResponse.json(
          { error: "File temporarily unavailable" },
          { status: 503 },
        );
      }

      return NextResponse.json(
        { error: "Failed to download file" },
        { status: 500 },
      );
    }

    // Create response with proper headers
    const headers = new Headers();

    // Set content type
    headers.set("Content-Type", file.mime || "application/octet-stream");

    // Set content disposition for download
    const encodedFileName = encodeURIComponent(file.name);
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedFileName}`,
    );

    // Set content length if available
    if (file.size) {
      headers.set("Content-Length", file.size.toString());
    }

    // Set cache headers
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set(
      "ETag",
      `"${(file._id as any).toString()}-${file.createdAt.getTime()}"`,
    );

    // Security headers
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");

    // Check if client supports range requests
    const range = request.headers.get("range");
    if (range && file.size) {
      // Parse range header (basic implementation)
      const match = range.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const [, startStr, endStr] = match;
        const start = parseInt(startStr!, 10);
        const end = endStr ? parseInt(endStr, 10) : file.size - 1;

        if (start < file.size && end < file.size && start <= end) {
          headers.set("Content-Range", `bytes ${start}-${end}/${file.size}`);
          headers.set("Content-Length", (end - start + 1).toString());
          headers.set("Accept-Ranges", "bytes");

          return new Response(fileStream, {
            status: 206,
            headers,
          });
        }
      }
    }

    // Return the file stream
    return new Response(fileStream, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Download file error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 },
    );
  }
}

// Method not allowed for other HTTP methods
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
