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
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const groups = await File.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(user.id),
          deletedAt: null,
          $or: [{ chunkedId: null }, { chunkIndex: -1 }],
        },
      },
      {
        $group: {
          _id: { name: "$name", size: "$size" },
          files: {
            $push: {
              _id: "$_id",
              name: "$name",
              displayName: {
                $cond: [
                  { $ifNull: ["$originalExt", false] },
                  {
                    $concat: [
                      { $substrCP: ["$name", 0, { $subtract: [{ $strLenCP: "$name" }, 4] }] },
                      "$originalExt",
                    ],
                  },
                  "$name",
                ],
              },
              size: "$size",
              mime: "$mime",
              folderId: "$folder",
              folderName: null,
              createdAt: "$createdAt",
              originalExt: "$originalExt",
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
      {
        $sort: { "_id.size": -1 },
      },
    ]);

    return NextResponse.json({ groups }, { status: 200 });
  } catch (error) {
    console.error("Duplicates list error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to find duplicates" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { keepFileIds } = body as { keepFileIds?: string[] };

    // Files to keep must be provided (the newest in each duplicate group).
    // Anything else sharing name+size with a kept file is deleted.
    if (!Array.isArray(keepFileIds) || keepFileIds.length === 0) {
      return NextResponse.json({ error: "No files to keep specified" }, { status: 400 });
    }

    const keepIds = keepFileIds.map((id) => new mongoose.Types.ObjectId(id));

    const keptFiles = await File.find({ _id: { $in: keepIds }, owner: user.id, deletedAt: null });
    if (keptFiles.length !== keepIds.length) {
      return NextResponse.json({ error: "Some files to keep were not found" }, { status: 400 });
    }

    const keys = new Map<string, mongoose.Types.ObjectId[]>();
    for (const f of keptFiles) {
      if (f.chunkedId && f.chunkIndex !== -1) continue;
      const key = `${f.name}\u0000${f.size}`;
      const list = keys.get(key) || [];
      list.push(f._id as mongoose.Types.ObjectId);
      keys.set(key, list);
    }

    let deleted = 0;
    for (const [key, keep] of Array.from(keys.entries())) {
      const [name, size] = key.split("\u0000");
      if (!name || !size) continue;
      const dupes = await File.find({
        owner: user.id,
        deletedAt: null,
        name,
        size: parseInt(size, 10),
        _id: { $nin: keep },
        $or: [{ chunkedId: null }, { chunkIndex: -1 }],
      });
      for (const d of dupes) {
        if (d.telegramMessageId) {
          await telegramAPI.deleteMessage(d.telegramMessageId).catch(() => {});
        }
        await File.findByIdAndDelete(d._id).catch(() => {});
        deleted++;
      }
    }

    await logAction("files.duplicates.cleanup", {
      userId: user.id,
      email: user.email,
      metadata: { deleted },
      request,
    });

    return NextResponse.json({ deleted }, { status: 200 });
  } catch (error) {
    console.error("Duplicates cleanup error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to clean up duplicates" }, { status: 500 });
  }
}
