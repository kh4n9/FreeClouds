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
import { telegramAPI } from "@/lib/telegram";
import { logAction } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{
    id: string;
    versionId: string;
  }>;
}

function getDisplayName(file: InstanceType<typeof File>, version: InstanceType<typeof FileVersion>): string {
  const name = file.originalExt
    ? file.name.replace(/\.bin$/i, "") + file.originalExt
    : file.name;
  const ext = version.originalExt
    ? version.originalExt
    : name.includes(".")
      ? name.substring(name.lastIndexOf("."))
      : "";
  const base = ext
    ? name.substring(0, name.lastIndexOf(".")) || name
    : name;
  return `v${version.version}_${base}${ext}`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId, versionId } = await params;
    if (fileId.length !== 24 || versionId.length !== 24) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [file, version] = await Promise.all([
      File.findById(fileId),
      FileVersion.findById(versionId),
    ]);
    if (!file || !version || version.file.toString() !== fileId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    let stream;
    try {
      const result = await telegramAPI.getFileStream(
        version.fileId,
        version.telegramFilePath || undefined,
      );
      if (!version.telegramFilePath && result.filePath) {
        FileVersion.updateOne(
          { _id: version._id },
          { telegramFilePath: result.filePath },
        ).catch(() => {});
      }
      stream = result.stream;
    } catch (error) {
      console.error("Failed to stream version from Telegram:", error);
      return NextResponse.json(
        { error: "File temporarily unavailable" },
        { status: 503 },
      );
    }

    const displayName = getDisplayName(file, version);
    const headers = new Headers();
    headers.set("Content-Type", version.mime || "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(displayName)}`,
    );
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    if (version.size && version.size <= 15 * 1024 * 1024) {
      headers.set("Content-Length", version.size.toString());
    }

    return new Response(stream, { status: 200, headers });
  } catch (error) {
    console.error("Download version error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to download version" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId, versionId } = await params;
    if (fileId.length !== 24 || versionId.length !== 24) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [file, version] = await Promise.all([
      File.findById(fileId),
      FileVersion.findById(versionId),
    ]);
    if (!file || !version || version.file.toString() !== fileId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Snapshot the current live state as a version before restoring the old one
    if (file.fileId && !file.fileId.startsWith("chunked_parent_")) {
      const snapshot = new FileVersion({
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
      await snapshot.save().catch((err) => {
        if (
          err instanceof Error &&
          (err.message.includes("E11000") || err.message.includes("duplicate key"))
        ) {
          return;
        }
        throw err;
      });
    }

    file.fileId = version.fileId;
    file.telegramFilePath = version.telegramFilePath || null;
    file.telegramMessageId = version.telegramMessageId || null;
    file.size = version.size;
    file.mime = version.mime;
    file.originalExt = version.originalExt || null;
    file.currentVersion = (file.currentVersion || 1) + 1;
    await file.save();

    // The restored content is now the live file — remove the version record
    await FileVersion.findByIdAndDelete(version._id);

    await logAction("file.version.restore", {
      userId: user.id,
      email: user.email,
      entityType: "file",
      entityId: fileId,
      metadata: { name: file.name, size: file.size, version: file.currentVersion },
      request,
    });

    return NextResponse.json(
      {
        id: file._id.toString(),
        currentVersion: file.currentVersion,
        name: file.displayName || file.name,
        size: file.size,
        restored: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Restore version error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to restore version" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId, versionId } = await params;
    if (fileId.length !== 24 || versionId.length !== 24) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const [file, version] = await Promise.all([
      File.findById(fileId),
      FileVersion.findById(versionId),
    ]);
    if (!file || !version || version.file.toString() !== fileId) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (version.telegramMessageId) {
      await telegramAPI.deleteMessage(version.telegramMessageId).catch(() => {});
    }
    await FileVersion.findByIdAndDelete(version._id);

    await logAction("file.version.delete", {
      userId: user.id,
      email: user.email,
      entityType: "file",
      entityId: fileId,
      metadata: { name: file.name, version: version.version },
      request,
    });

    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (error) {
    console.error("Delete version error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to delete version" }, { status: 500 });
  }
}
