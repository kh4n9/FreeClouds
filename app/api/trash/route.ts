import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";

// Guard so expired-trash cleanup (incl. Telegram message deletion) runs at most once per hour per instance
let lastCleanupRun = 0;

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    // Opportunistic cleanup of expired trash + Telegram messages
    if (Date.now() - lastCleanupRun > 60 * 60 * 1000) {
      lastCleanupRun = Date.now();
      File.cleanupExpiredTrash().catch(() => {});
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);

    const result = await File.findTrashByOwnerWithCount(user.id, page, 50);

    const files = result.files.map((f) => ({
      id: f._id.toString(),
      name: f.name,
      displayName: f.displayName,
      size: f.size,
      mime: f.mime,
      deletedAt: f.deletedAt,
      trashExpiresAt: f.trashExpiresAt,
    }));

    return NextResponse.json({ files, total: result.total, page: result.page, totalPages: result.totalPages }, { status: 200 });
  } catch (error) {
    console.error("Trash list error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to load trash" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const { fileIds, action } = await request.json();

    if (action === "restore" && Array.isArray(fileIds)) {
      const files = await File.find({
        _id: { $in: fileIds },
        owner: user.id,
        deletedAt: { $ne: null },
      });
      for (const file of files) {
        await file.restore();
        if (file.chunkedId && file.totalChunks! > 1) {
          await File.updateMany(
            { chunkedId: file.chunkedId, chunkIndex: { $gte: 0 }, deletedAt: { $ne: null } },
            { deletedAt: null, trashExpiresAt: null },
          );
        }
      }
      return NextResponse.json({ restored: files.length }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Trash action error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to process trash action" }, { status: 500 });
  }
}
