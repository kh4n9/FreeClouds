import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { telegramAPI } from "@/lib/telegram";
import { logAction } from "@/lib/activity-log";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const trashedFiles = await File.find({
      owner: user.id,
      deletedAt: { $ne: null },
      $or: [
        { chunkedId: null },
        { chunkIndex: -1 },
      ],
    });

    let deleted = 0;
    for (const file of trashedFiles) {
      // Delete cached blob if exists
      if (file.blobCacheUrl) {
        try {
          const { del } = await import("@vercel/blob");
          await del(file.blobCacheUrl);
        } catch {}
      }

      // Delete the actual file from Telegram (best-effort)
      if (file.telegramMessageId) {
        await telegramAPI.deleteMessage(file.telegramMessageId).catch(() => {});
      }

      if (file.chunkedId && file.totalChunks! > 1) {
        const chunkDocs = await File.find({ chunkedId: file.chunkedId, chunkIndex: { $gte: 0 } });
        for (const c of chunkDocs) {
          if (c.telegramMessageId) {
            await telegramAPI.deleteMessage(c.telegramMessageId).catch(() => {});
          }
        }
        await File.deleteMany({ chunkedId: file.chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
      }
      await File.findByIdAndDelete(file._id).catch(() => {});
      deleted++;
    }

    await logAction("trash.empty", {
      userId: user.id,
      email: user.email,
      metadata: { deleted },
      request,
    });

    return NextResponse.json({ deleted }, { status: 200 });
  } catch (error) {
    console.error("Empty trash error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to empty trash" }, { status: 500 });
  }
}
