import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin, AuthError, createAuthResponse, validateOrigin, createCsrfError } from "@/lib/auth";
import { File } from "@/models/File";
import { telegramAPI } from "@/lib/telegram";
import { logAction } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    const query: any = {
      deletedAt: { $ne: null },
      $or: [
        { chunkedId: null },
        { chunkIndex: -1 },
      ],
    };

    const [files, total] = await Promise.all([
      File.find(query)
        .sort({ deletedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("owner", "name email"),
      File.countDocuments(query),
    ]);

    const trashFiles = files.map((f: any) => ({
      id: f._id.toString(),
      name: f.name,
      displayName: f.displayName,
      size: f.size,
      mime: f.mime,
      chunked: !!(f.chunkedId && f.totalChunks && f.totalChunks > 1),
      totalChunks: f.chunkedId && f.totalChunks > 1 ? f.totalChunks : 1,
      deletedAt: f.deletedAt,
      trashExpiresAt: f.trashExpiresAt,
      owner: {
        id: f.owner?._id?.toString() || null,
        name: f.owner?.name || "Unknown",
        email: f.owner?.email || null,
      },
    }));

    return NextResponse.json({
      files: trashFiles,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }, { status: 200 });
  } catch (error) {
    console.error("Admin trash list error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to load trash" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const admin = await requireAdmin(request);
    await connectToDatabase();

    const { fileIds, action } = await request.json();
    if (!Array.isArray(fileIds) || !fileIds.length) {
      return NextResponse.json({ error: "fileIds required" }, { status: 400 });
    }

    const files = await File.find({
      _id: { $in: fileIds },
      deletedAt: { $ne: null },
      $or: [
        { chunkedId: null },
        { chunkIndex: -1 },
      ],
    });

    let count = 0;

    if (action === "restore") {
      for (const file of files) {
        await file.restore();
        if ((file as any).chunkedId && (file as any).totalChunks > 1) {
          await File.updateMany(
            { chunkedId: (file as any).chunkedId, chunkIndex: { $gte: 0 }, deletedAt: { $ne: null } },
            { deletedAt: null, trashExpiresAt: null },
          );
        }
        count++;
      }
      await logAction("admin.trash.restore", {
        userId: admin.id,
        email: admin.email,
        metadata: { fileIds: fileIds.map(String), count },
        request,
      });
    } else if (action === "delete") {
      for (const file of files) {
        if ((file as any).blobCacheUrl) {
          try {
            const { del } = await import("@vercel/blob");
            await del((file as any).blobCacheUrl);
          } catch {}
        }
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
        count++;
      }
      await logAction("admin.trash.delete", {
        userId: admin.id,
        email: admin.email,
        metadata: { fileIds: fileIds.map(String), count },
        request,
      });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ affected: count }, { status: 200 });
  } catch (error) {
    console.error("Admin trash action error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to process trash action" }, { status: 500 });
  }
}
