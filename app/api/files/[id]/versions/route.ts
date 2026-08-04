import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { FileVersion } from "@/models/FileVersion";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
  verifyOwnership,
} from "@/lib/auth";
import {
  telegramAPI,
  isAllowedFileType,
  validateFileName,
  sanitizeFileName,
} from "@/lib/telegram";
import { getEffectiveStorageLimit } from "@/lib/quota";
import { logAction } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const CHUNKED_PARENT_PREFIX = "chunked_parent_";

/**
 * Creates a FileVersion record from the current state of a File document.
 * Caller is responsible for saving the file afterwards.
 */
async function snapshotCurrentFile(file: InstanceType<typeof File>) {
  if (file.fileId && !file.fileId.startsWith(CHUNKED_PARENT_PREFIX)) {
    const version = new FileVersion({
      file: file._id,
      owner: file.owner,
      version: file.currentVersion || 1,
      fileId: file.fileId,
      telegramFilePath: file.telegramFilePath || null,
      telegramMessageId: file.telegramMessageId || null,
      size: file.size,
      mime: file.mime,
      originalExt: file.originalExt || null,
    });
    await version.save().catch((err) => {
      // Skip if this exact file_id already exists as a version (e.g. restore loops)
      if (
        err instanceof Error &&
        (err.message.includes("E11000") || err.message.includes("duplicate key"))
      ) {
        return;
      }
      throw err;
    });
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId } = await params;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    const file = await File.findById(fileId);
    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const versions = await FileVersion.find({ file: file._id })
      .sort({ version: -1 })
      .lean();

    return NextResponse.json(
      {
        currentVersion: file.currentVersion || 1,
        versions: versions.map((v) => ({
          id: v._id.toString(),
          version: v.version,
          size: v.size,
          mime: v.mime,
          createdAt: v.createdAt,
          name: file.displayName || file.name,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("List versions error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to load versions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId } = await params;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const note = (formData.get("note") as string | null)?.trim() || null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file not allowed" }, { status: 400 });
    }

    const existing = await File.findById(fileId);
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, existing))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Quota: only the delta (new size - old size) counts toward the limit
    const userStats = await File.getStorageUsage(user.id);
    const storageLimit = await getEffectiveStorageLimit(user.id);
    const delta = file.size - (existing.size || 0);
    if ((userStats.totalSize || 0) + delta > storageLimit) {
      return NextResponse.json({ error: "Storage limit exceeded" }, { status: 413 });
    }

    let fileName = file.name;
    if (!validateFileName(fileName)) fileName = sanitizeFileName(fileName);

    const mimeType = file.type || "application/octet-stream";

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

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let telegramResponse;
    try {
      telegramResponse = await telegramAPI.sendDocument(buffer, fileName, mimeType);
    } catch (error) {
      console.error("Version upload to Telegram failed:", error);
      return NextResponse.json(
        { error: "File upload failed. Please try again." },
        { status: 500 },
      );
    }

    let telegramFilePath: string | null = null;
    try {
      const fileInfo = await telegramAPI.getFile(telegramResponse.document.file_id);
      telegramFilePath = fileInfo.file_path || null;
    } catch {
      // optional
    }

    // Snapshot the current content as an older version, then swap
    await snapshotCurrentFile(existing);
    existing.fileId = telegramResponse.document.file_id;
    existing.telegramFilePath = telegramFilePath;
    existing.telegramMessageId = String(telegramResponse.message_id);
    existing.size = file.size;
    existing.mime = mimeType;
    existing.originalExt = originalExt || null;
    existing.currentVersion = (existing.currentVersion || 1) + 1;
    await existing.save();

    await logAction("file.version", {
      userId: user.id,
      email: user.email,
      entityType: "file",
      entityId: fileId,
      metadata: {
        name: existing.name,
        size: file.size,
        version: existing.currentVersion,
        note,
      },
      request,
    });

    return NextResponse.json(
      {
        id: existing._id.toString(),
        currentVersion: existing.currentVersion,
        name: existing.displayName || existing.name,
        size: existing.size,
        mime: existing.mime,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Upload version error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to save new version" }, { status: 500 });
  }
}
