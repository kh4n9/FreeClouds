import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { telegramAPI } from "@/lib/telegram";
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
      if ((file as any).blobCacheUrl) {
        try {
          const { del } = await import("@vercel/blob");
          await del((file as any).blobCacheUrl);
        } catch {}
      }

      // Delete the actual file from Telegram (best-effort)
      if ((file as any).telegramMessageId) {
        await telegramAPI.deleteMessage((file as any).telegramMessageId).catch(() => {});
      }

      if ((file as any).chunkedId && (file as any).totalChunks > 1) {
        const chunkDocs = await File.find({ chunkedId: (file as any).chunkedId, chunkIndex: { $gte: 0 } });
        for (const c of chunkDocs) {
          if ((c as any).telegramMessageId) {
            await telegramAPI.deleteMessage((c as any).telegramMessageId).catch(() => {});
          }
        }
        await File.deleteMany({ chunkedId: (file as any).chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
      }
      await File.findByIdAndDelete(file._id).catch(() => {});
      deleted++;
    }

    return NextResponse.json({ deleted }, { status: 200 });
  } catch (error) {
    console.error("Empty trash error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to empty trash" }, { status: 500 });
  }
}
