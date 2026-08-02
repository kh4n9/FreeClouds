import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse, validateOrigin, createCsrfError } from "@/lib/auth";
import { telegramAPI, isAllowedFileType, validateFileName, sanitizeFileName } from "@/lib/telegram";
import { getSystemSettings } from "@/lib/settings";
import { logAction } from "@/lib/activity-log";

export async function handleComplete(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const { chunkedId, originalName, originalMime, totalSize, folderId: rawFolderId, totalChunks: clientTotalChunks } = body;

    if (!chunkedId || !originalName || !totalSize) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const totalChunks = Number(clientTotalChunks);
    if (!Number.isInteger(totalChunks) || totalChunks <= 0) {
      return NextResponse.json({ error: "Invalid totalChunks" }, { status: 400 });
    }

    // Verify chunks exist + cache file_paths for faster downloads
    const chunks = await File.find({ chunkedId, chunkIndex: { $gte: 0 }, owner: user.id })
      .sort({ chunkIndex: 1 });
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No chunks found" }, { status: 404 });
    }

    // Verify all chunks present and contiguous (0..n-1)
    if (chunks.length !== totalChunks) {
      return NextResponse.json(
        { error: `Incomplete chunks: expected ${totalChunks}, found ${chunks.length}. Vui lòng tải lại file.` },
        { status: 400 },
      );
    }
    const contiguous = chunks.every((chunk, i) => chunk.chunkIndex === i);
    if (!contiguous) {
      const missing = Array.from({ length: totalChunks }, (_, i) => i)
        .filter((i) => !chunks.some((c) => c.chunkIndex === i));
      return NextResponse.json(
        { error: `Missing chunks: [${missing.join(", ")}]. Vui lòng tải lại file.` },
        { status: 400 },
      );
    }
    const chunkSum = chunks.reduce((sum: number, c) => sum + (c.size || 0), 0);
    if (chunkSum !== Number(totalSize)) {
      return NextResponse.json(
        { error: "Chunk size mismatch. Vui lòng tải lại file." },
        { status: 400 },
      );
    }

    // Fetch and cache Telegram file_paths (skip getFile on future downloads)
    await Promise.all(chunks.map(async (chunk) => {
      if (chunk.telegramFilePath) return;
      try {
        const info = await telegramAPI.getFile(chunk.fileId);
        if (info.file_path) {
          await File.updateOne({ _id: chunk._id }, { telegramFilePath: info.file_path });
        }
      } catch {}
    }));

    // Check storage limit
    const userStats = await File.getStorageUsage(user.id);
    const settings = await getSystemSettings();
    if ((userStats.totalSize || 0) + totalSize > settings.storageLimit) {
      // Clean up orphaned chunks so they don't count against the user
      Promise.all(
        chunks.map((chunk) => {
          if (chunk.telegramMessageId) {
            telegramAPI.deleteMessage(chunk.telegramMessageId).catch(() => {});
          }
          return File.deleteOne({ _id: chunk._id }).catch(() => {});
        }),
      ).catch(() => {});
      return NextResponse.json({ error: "Storage limit exceeded" }, { status: 413 });
    }

    let fileName = originalName;
    if (!validateFileName(fileName)) fileName = sanitizeFileName(fileName);

    let originalExt: string | null = null;
    if (!isAllowedFileType(originalMime || "application/octet-stream", fileName)) {
      const dot = fileName.lastIndexOf(".");
      if (dot !== -1) {
        originalExt = fileName.substring(dot);
        fileName = fileName.substring(0, dot) + ".bin";
      } else {
        originalExt = "";
        fileName = fileName + ".bin";
      }
    }

    const folderId = rawFolderId && rawFolderId !== "null" && rawFolderId !== "" ? rawFolderId : null;

    // Handle duplicate name
    const existingFile = await File.findOne({
      owner: user.id as unknown as Types.ObjectId,
      folder: folderId as unknown as Types.ObjectId | null,
      name: fileName,
      deletedAt: null,
    });
    if (existingFile) {
      const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
      const base = fileName.includes(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
      fileName = `${base}_${Date.now()}${ext}`;
    }

    const parentFile = new File({
      name: fileName,
      size: totalSize,
      mime: originalMime || "application/octet-stream",
      fileId: `chunked_parent_${chunkedId}`,
      owner: user.id as unknown as Types.ObjectId,
      folder: folderId as unknown as Types.ObjectId | null,
      chunkedId,
      chunkIndex: -1,
      totalChunks: chunks.length,
      ...(originalExt ? { originalExt } : {}),
    });
    await parentFile.save();

    await logAction("file.upload", {
      userId: user.id,
      email: user.email,
      entityType: "file",
      entityId: (parentFile._id as Types.ObjectId).toString(),
      metadata: { name: parentFile.name, size: parentFile.size, chunked: true },
      request,
    });

    return NextResponse.json({
      id: (parentFile._id as Types.ObjectId).toString(),
      name: parentFile.name,
      size: parentFile.size,
      mime: parentFile.mime,
      folderId: parentFile.folder?.toString() || null,
      createdAt: parentFile.createdAt,
      chunked: true,
      totalChunks: chunks.length,
    }, { status: 201 });
  } catch (error) {
    console.error("Complete error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 });
  }
}
