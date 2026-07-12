import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { z } from "zod";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
  verifyOwnership,
} from "@/lib/auth";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Validate file ID
    const { id: fileId } = await params;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Find file
    const file = await File.findById(fileId).populate("folder", "name");

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Return file metadata
    const response = {
      id: (file._id as any).toString(),
      name: file.name,
      size: file.size,
      mime: file.mime,
      folderId:
        file.folder && file.folder._id
          ? (file.folder._id as any).toString()
          : null,
      folderName: (file.folder as any)?.name || null,
      createdAt: file.createdAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Get file metadata error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to get file information" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return createCsrfError();
    }

    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Validate file ID
    const { id: fileId } = await params;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Find file
    const file = await File.findById(fileId);

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Soft delete the file (moves to trash, auto-expires in 30 days)
    await file.softDelete();

    // If file is chunked parent, also soft-delete all chunks with same expiry
    if (file.chunkedId && file.totalChunks && file.totalChunks > 1) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await File.updateMany(
        { chunkedId: file.chunkedId, chunkIndex: { $gte: 0 }, deletedAt: null },
        { deletedAt: new Date(), trashExpiresAt: expiresAt },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete file error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 },
    );
  }
}

// Method not allowed for other HTTP methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

const renameSchema = z.object({
  name: z.string().min(1, "File name is required").max(255, "File name too long").trim(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();
    const { id: fileId } = await params;
    const body = await request.json();
    const action = body.action;

    if (action === "rename") {
      const validation = renameSchema.safeParse(body);
      if (!validation.success) {
        const firstError = validation.error?.errors?.[0];
        return NextResponse.json({ error: firstError?.message || "Invalid name" }, { status: 400 });
      }
      const file = await File.findById(fileId);
      if (!file || file.deletedAt) return NextResponse.json({ error: "File not found" }, { status: 404 });
      if (!(await verifyOwnership(user.id, file))) return NextResponse.json({ error: "Access denied" }, { status: 403 });
      const ext = file.name.includes(".") ? file.name.substring(file.name.lastIndexOf(".")) : "";
      const baseName = validation.data.name.endsWith(ext) ? validation.data.name : validation.data.name + ext;
      file.name = baseName;
      await file.save();
      return NextResponse.json({ id: file._id.toString(), name: file.name }, { status: 200 });
    }

    if (action === "restore") {
      const file = await File.findById(fileId);
      if (!file || !file.deletedAt) return NextResponse.json({ error: "File not found in trash" }, { status: 404 });
      if (!(await verifyOwnership(user.id, file))) return NextResponse.json({ error: "Access denied" }, { status: 403 });
      await file.restore();
      // Also restore chunks if chunked parent
      if (file.chunkedId && file.totalChunks && file.totalChunks > 1) {
        await File.updateMany(
          { chunkedId: file.chunkedId, chunkIndex: { $gte: 0 }, deletedAt: { $ne: null } },
          { deletedAt: null, trashExpiresAt: null },
        );
      }
      return NextResponse.json({ id: file._id.toString(), restored: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Patch file error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 });
  }
}
