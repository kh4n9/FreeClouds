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

import stream from "stream";

/**
 * POST /api/files/bulk-download
 *
 * Request body:
 * {
 *   fileIds: string[]
 * }
 *
 * Response:
 * - 200: application/zip stream (attachment)
 * - 4xx/5xx: JSON error
 *
 * Notes:
 * - Verifies authentication and ownership of each file.
 * - Streams each file from Telegram into a zip archive using `archiver`.
 * - If a particular file cannot be fetched from Telegram, a small text file
 *   describing the error will be included in the archive instead of failing
 *   the entire response.
 */

export async function POST(request: NextRequest) {
  try {
    // Require authenticated user
    const user = await requireAuth(request);

    // Connect to DB
    await connectToDatabase();

    // Parse body
    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const fileIds = Array.isArray(body?.fileIds) ? body.fileIds : null;

    if (!fileIds || fileIds.length === 0) {
      return NextResponse.json(
        { error: "No file IDs provided" },
        { status: 400 },
      );
    }

    if (fileIds.length > 200) {
      // Reasonable guard to avoid extremely large archives
      return NextResponse.json(
        { error: "Too many files requested (max 200)" },
        { status: 400 },
      );
    }

    // Basic ID validation (24 hex chars for Mongo ObjectId)
    const invalidId = fileIds.find(
      (id: any) => typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id),
    );
    if (invalidId) {
      return NextResponse.json(
        { error: "Invalid file ID in request" },
        { status: 400 },
      );
    }

    // Fetch files from DB
    const files = await (File as any)
      .find({
        _id: { $in: fileIds },
        deletedAt: null,
      })
      .lean();

    // Map by id to preserve requested order (and to detect missing)
    const filesById: Record<string, any> = {};
    files.forEach((f: any) => {
      filesById[f._id.toString()] = f;
    });

    const orderedFiles = fileIds
      .map((id: string) => filesById[id])
      .filter(Boolean);

    if (orderedFiles.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 404 });
    }

    // Verify ownership
    for (const f of orderedFiles) {
      if (!(await verifyOwnership(user.id, f))) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Prepare the zip archive (archiver)
    // Load archiver dynamically to avoid missing-module diagnostics at build time
    let archiverModule: any;
    try {
      // dynamic import; prefer default export if present
      const mod = await import("archiver").catch((e) => {
        throw e;
      });
      archiverModule = mod && (mod as any).default ? (mod as any).default : mod;
    } catch (err) {
      console.error("Archiver module not available:", err);
      // Gracefully return an error response indicating optional dependency missing
      return NextResponse.json(
        {
          error:
            "Server missing optional dependency 'archiver'. Bulk download not available.",
        },
        { status: 500 },
      );
    }
    const archive = archiverModule("zip", { zlib: { level: 9 } });

    archive.on("warning", (err: any) => {
      // Log and continue for non-critical warnings
      console.warn("Archiver warning:", err);
    });

    archive.on("error", (err: any) => {
      console.error("Archiver error:", err);
    });

    // Build filename
    const filename = `files-${new Date().toISOString().split("T")[0]}.zip`;

    // Response headers
    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    headers.set("Cache-Control", "private, max-age=3600");

    // Kick off an async task to append streams to the archive.
    // archiver works with Node streams, while telegramAPI.getFileStream returns a web ReadableStream.
    (async () => {
      try {
        for (const f of orderedFiles) {
          try {
            const result = await telegramAPI.getFileStream(f.fileId);
            const webStream = result.stream as ReadableStream<Uint8Array>;
            const size = result.size;

            // Convert web ReadableStream to Node Readable (Node >= 17 provides fromWeb)
            let nodeStream: stream.Readable;
            if (
              (stream as any).Readable &&
              typeof (stream as any).Readable.fromWeb === "function"
            ) {
              nodeStream = (stream as any).Readable.fromWeb(webStream);
            } else {
              // Fallback: manually pipe chunks (should rarely be needed on supported Node versions)
              const reader = webStream.getReader();
              const pass = new stream.PassThrough();
              (async () => {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (value) pass.write(Buffer.from(value));
                  }
                } catch (e) {
                  console.error("Error while reading web stream fallback:", e);
                } finally {
                  pass.end();
                }
              })();
              nodeStream = pass;
            }

            // Append to archive with provided filename (preserve original name)
            archive.append(nodeStream, {
              name: f.name,
              ...(size ? { size } : {}),
            });
          } catch (err) {
            // If retrieving the file failed, include a small text file describing the error
            const errMsg = err instanceof Error ? err.message : String(err);
            console.error(`Failed to include file ${f._id}:`, err);
            const content = `Failed to include file "${f.name}" (id: ${f._id}).\nError: ${errMsg}\n`;
            archive.append(Buffer.from(content, "utf-8"), {
              name: `error-${f._id}.txt`,
            });
          }
        }

        // Finalize archive (this returns a promise-like but archiver emits events)
        await archive.finalize();
      } catch (err) {
        console.error("Error while creating archive:", err);
        try {
          archive.emit("error", err);
        } catch (_) {
          // ignore
        }
      }
    })();

    // archiver returns a Node Readable stream. Convert to web ReadableStream for Next Response.
    const nodeStream = archive as unknown as stream.Readable;
    let webReadable: ReadableStream<Uint8Array>;

    if (
      (stream as any).Readable &&
      typeof (stream as any).Readable.toWeb === "function"
    ) {
      webReadable = (stream as any).Readable.toWeb(nodeStream);
    } else if ((nodeStream as any).toWeb) {
      webReadable = (nodeStream as any).toWeb();
    } else {
      // As a last resort, create a simple passthrough that errors (very unlikely on supported runtimes)
      const pass = new stream.PassThrough();
      nodeStream.pipe(pass);
      webReadable = (stream as any).Readable.toWeb
        ? (stream as any).Readable.toWeb(pass)
        : (pass as any).toWeb();
    }

    return new Response(webReadable, { headers });
  } catch (error) {
    console.error("Bulk download error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to create archive" },
      { status: 500 },
    );
  }
}

// Other methods not allowed
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
