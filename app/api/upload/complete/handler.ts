import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse, validateOrigin, createCsrfError } from "@/lib/auth";
import { telegramAPI, isAllowedFileType, validateFileName, sanitizeFileName } from "@/lib/telegram";

const STORAGE_LIMIT = 1024 * 1024 * 1024 * 1024;

export async function handleComplete(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const { chunkedId, originalName, originalMime, totalSize, folderId: rawFolderId } = body;

    if (!chunkedId || !originalName || !totalSize) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify chunks exist + cache file_paths for faster downloads
    const chunks = await (File as any).find({ chunkedId, chunkIndex: { $gte: 0 } }).sort({ chunkIndex: 1 });
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No chunks found" }, { status: 404 });
    }

    // Fetch and cache Telegram file_paths (skip getFile on future downloads)
    await Promise.all(chunks.map(async (chunk: any) => {
      if (chunk.telegramFilePath) return;
      try {
        const info = await telegramAPI.getFile(chunk.fileId);
        if (info.file_path) {
          await (File as any).updateOne({ _id: chunk._id }, { telegramFilePath: info.file_path });
        }
      } catch {}
    }));

    // Check storage limit
    const userStats = await (File as any).getStorageUsage(user.id);
    if ((userStats.totalSize || 0) + totalSize > STORAGE_LIMIT) {
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
    const existingFile = await (File as any).findOne({
      owner: user.id, folder: folderId, name: fileName, deletedAt: null,
    });
    if (existingFile) {
      const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
      const base = fileName.includes(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
      fileName = `${base}_${Date.now()}${ext}`;
    }

    const parentFile = new (File as any)({
      name: fileName,
      size: totalSize,
      mime: originalMime || "application/octet-stream",
      fileId: `chunked_parent_${chunkedId}`,
      owner: user.id,
      folder: folderId,
      chunkedId,
      chunkIndex: -1,
      totalChunks: chunks.length,
      ...(originalExt ? { originalExt } : {}),
    });
    await parentFile.save();

    return NextResponse.json({
      id: parentFile._id.toString(),
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
