import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
  verifyOwnership,
} from "@/lib/auth";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/ratelimit";
import {
  telegramAPI,
  isAllowedFileType,
  validateFileName,
  sanitizeFileName,
  TELEGRAM_FILE_SIZE_LIMIT,
} from "@/lib/telegram";

const CHUNK_SIZE = 48 * 1024 * 1024; // 48MB per chunk (safe margin under Telegram's 50MB limit)
const STORAGE_LIMIT = 1024 * 1024 * 1024 * 1024; // 1TB per account
const uploadSchema = z.object({
  folderId: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();

    const rateLimit = checkRateLimit(request, RATE_LIMITS.UPLOAD);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);

    const user = await requireAuth(request);
    await connectToDatabase();

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folderIdParam = formData.get("folderId") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    let folderId: string | null = null;
    if (folderIdParam && folderIdParam !== "null" && folderIdParam !== "") {
      const validation = uploadSchema.safeParse({ folderId: folderIdParam });
      if (!validation.success) return NextResponse.json({ error: "Invalid folder ID" }, { status: 400 });
      folderId = validation.data.folderId || null;
    }

    if (folderId) {
      const folder = await (Folder as any).findById(folderId);
      if (!folder || !(await verifyOwnership(user.id, folder)))
        return NextResponse.json({ error: "Folder not found or access denied" }, { status: 404 });
    }

    if (file.size === 0) return NextResponse.json({ error: "Empty file not allowed" }, { status: 400 });

    // Check storage limit
    const userStats = await (File as any).getStorageUsage(user.id);
    if ((userStats.totalSize || 0) + file.size > STORAGE_LIMIT) {
      return NextResponse.json({ error: "Storage limit exceeded (1TB per account)" }, { status: 413 });
    }

    let fileName = file.name;
    if (!validateFileName(fileName)) fileName = sanitizeFileName(fileName);

    const mimeType = file.type || "application/octet-stream";

    // If file type is blocked, wrap it: change extension to .bin, save the original
    let originalExt: string | null = null;
    if (!isAllowedFileType(mimeType, fileName)) {
      const dot = fileName.lastIndexOf(".");
      if (dot !== -1) {
        originalExt = fileName.substring(dot);
        fileName = fileName.substring(0, dot) + ".bin";
      } else {
        originalExt = "";
        fileName = fileName + ".bin";
      }
    }

    const existingFile = await (File as any).findOne({
      owner: user.id, folder: folderId, name: fileName, deletedAt: null,
    });
    if (existingFile) {
      const ext = fileName.includes(".") ? fileName.substring(fileName.lastIndexOf(".")) : "";
      const base = fileName.includes(".") ? fileName.substring(0, fileName.lastIndexOf(".")) : fileName;
      fileName = `${base}_${Date.now()}${ext}`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const totalSize = file.size;

    // If file fits in one chunk, upload normally
    if (totalSize <= CHUNK_SIZE) {
      let telegramResponse;
      try {
        telegramResponse = await telegramAPI.sendDocument(buffer, fileName, mimeType);
      } catch (error) {
        console.error("Telegram upload failed:", error);
        return NextResponse.json({ error: "File upload failed. Please try again." }, { status: 500 });
      }

      const fileRecord = new (File as any)({
        name: fileName,
        size: totalSize,
        mime: mimeType,
        fileId: telegramResponse.document.file_id,
        owner: user.id,
        folder: folderId,
        ...(originalExt ? { originalExt } : {}),
      });
      await fileRecord.save();

      return NextResponse.json({
        id: fileRecord._id.toString(),
        name: fileRecord.name,
        size: fileRecord.size,
        mime: fileRecord.mime,
        folderId: fileRecord.folder?.toString() || null,
        createdAt: fileRecord.createdAt,
        chunked: false,
      }, { status: 201 });
    }

    // Large file: split into chunks and upload in parallel
    const chunkedId = crypto.randomUUID();
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
    const chunks: Buffer[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalSize);
      chunks.push(buffer.subarray(start, end));
    }

    // Upload chunks sequentially to avoid Telegram rate limiting
    const chunkResults: (Awaited<ReturnType<typeof telegramAPI.sendDocument>> | null)[] = [];
    for (let i = 0; i < chunks.length; i++) {
      try {
        const result = await telegramAPI.sendDocument(chunks[i]!, `${fileName}.part${i + 1}`, mimeType);
        chunkResults.push(result);
      } catch (err) {
        console.error(`Chunk ${i + 1}/${totalChunks} upload failed:`, err);
        chunkResults.push(null);
        break; // stop on first failure
      }
    }

    const failedChunks = chunkResults.some((r) => r === null);
    if (failedChunks) {
      return NextResponse.json({ error: `Failed to upload some chunks. Please try again.` }, { status: 500 });
    }

    // Save all chunk records (results are all non-null here)
    const chunkFileDocs = chunkResults.map((result, i) => ({
      name: `${fileName}.part${i + 1}`,
      size: (chunks[i] as Buffer).length,
      mime: mimeType,
      fileId: (result as NonNullable<typeof result>).document.file_id,
      owner: user.id,
      folder: folderId,
      chunkedId,
      chunkIndex: i,
      totalChunks,
      ...(originalExt ? { originalExt } : {}),
    }));

    try {
      await (File as any).insertMany(chunkFileDocs);
    } catch (err) {
      console.error("Failed to save chunk records:", err);
      return NextResponse.json({ error: "Failed to save file chunks. Please try again." }, { status: 500 });
    }

    // Save parent file record (what users see) with a synthetic fileId to avoid unique constraint conflict
    let parentFile;
    try {
      parentFile = new (File as any)({
        name: fileName,
        size: totalSize,
        mime: mimeType,
        fileId: `chunked_parent_${chunkedId}`,
        owner: user.id,
        folder: folderId,
        chunkedId,
        chunkIndex: -1,
        totalChunks,
        ...(originalExt ? { originalExt } : {}),
      });
      await parentFile.save();
    } catch (err) {
      // If parent save fails, clean up the chunks that were just inserted
      console.error("Failed to save parent record, cleaning up chunks:", err);
      await (File as any).deleteMany({ chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
      return NextResponse.json({ error: "Failed to finalize file upload. Please try again." }, { status: 500 });
    }

    return NextResponse.json({
      id: parentFile._id.toString(),
      name: parentFile.name,
      size: parentFile.size,
      mime: parentFile.mime,
      folderId: parentFile.folder?.toString() || null,
      createdAt: parentFile.createdAt,
      chunked: true,
      totalChunks,
    }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ error: "Invalid file data", details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
