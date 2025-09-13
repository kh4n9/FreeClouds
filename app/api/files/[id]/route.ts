import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse, validateOrigin, createCsrfError, verifyOwnership } from "@/lib/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Validate file ID
    const fileId = params.id;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    // Find file
    const file = await File.findById(fileId).populate("folder", "name");

    if (!file || file.deletedAt) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Return file metadata
    const response = {
      id: file._id.toString(),
      name: file.name,
      size: file.size,
      mime: file.mime,
      folderId: file.folder?._id?.toString() || null,
      folderName: file.folder?.name || null,
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
      { status: 500 }
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
    const fileId = params.id;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    // Find file
    const file = await File.findById(fileId);

    if (!file || file.deletedAt) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Soft delete the file
    await file.softDelete();

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete file error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
