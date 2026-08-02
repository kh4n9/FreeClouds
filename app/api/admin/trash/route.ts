import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin, AuthError, createAuthResponse, validateOrigin, createCsrfError } from "@/lib/auth";
import { File, type IFile } from "@/models/File";
import { telegramAPI } from "@/lib/telegram";
import { logAction } from "@/lib/activity-log";
import type { FilterQuery, Types } from "mongoose";

interface TrashFileItem {
  _id: Types.ObjectId;
  name: string;
  displayName?: string;
  size: number;
  mime: string;
  chunkedId?: string | null;
  totalChunks?: number | null;
  deletedAt: Date | null;
  trashExpiresAt?: Date | null;
  owner?: {
    _id?: Types.ObjectId;
    name?: string;
    email?: string;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));

    const query: FilterQuery<IFile> = {
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

    const trashFiles = files.map((f) => {
      const file = f as unknown as TrashFileItem;
      return {
        id: file._id.toString(),
        name: file.name,
        displayName: file.displayName,
        size: file.size,
        mime: file.mime,
        chunked: !!(file.chunkedId && file.totalChunks && file.totalChunks > 1),
        totalChunks:
          file.chunkedId && (file.totalChunks ?? 0) > 1
            ? file.totalChunks
            : 1,
        deletedAt: file.deletedAt,
        trashExpiresAt: file.trashExpiresAt,
        owner: {
          id: file.owner?._id?.toString() || null,
          name: file.owner?.name || "Unknown",
          email: file.owner?.email || null,
        },
      };
    });

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
        if (file.chunkedId && (file.totalChunks ?? 0) > 1) {
          await File.updateMany(
            { chunkedId: file.chunkedId, chunkIndex: { $gte: 0 }, deletedAt: { $ne: null } },
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
        if (file.blobCacheUrl) {
          try {
            const { del } = await import("@vercel/blob");
            await del(file.blobCacheUrl);
          } catch {}
        }
        if (file.telegramMessageId) {
          await telegramAPI.deleteMessage(file.telegramMessageId).catch(() => {});
        }
        if (file.chunkedId && (file.totalChunks ?? 0) > 1) {
          const chunkDocs = await File.find({ chunkedId: file.chunkedId, chunkIndex: { $gte: 0 } });
          for (const c of chunkDocs) {
            if (c.telegramMessageId) {
              await telegramAPI.deleteMessage(c.telegramMessageId).catch(() => {});
            }
          }
          await File.deleteMany({ chunkedId: file.chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
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
