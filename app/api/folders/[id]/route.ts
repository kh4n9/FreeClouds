import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Folder } from "@/models/Folder";
import { requireAuth, AuthError, createAuthResponse, validateOrigin, createCsrfError, verifyOwnership } from "@/lib/auth";

interface RouteParams {
  params: {
    id: string;
  };
}

const updateFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100, "Folder name too long").trim(),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return createCsrfError();
    }

    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Validate folder ID
    const folderId = params.id;
    if (!folderId || folderId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Find folder
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, folder))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check for duplicate folder name in the same parent
    const existingFolder = await Folder.findOne({
      _id: { $ne: folderId },
      owner: user.id,
      parent: folder.parent,
      name: name,
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: "A folder with this name already exists in the same location" },
        { status: 409 }
      );
    }

    // Update folder name
    folder.name = name;
    await folder.save();

    // Return updated folder
    const response = {
      id: folder._id.toString(),
      name: folder.name,
      parent: folder.parent?.toString() || null,
      createdAt: folder.createdAt,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Update folder error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes("E11000") || error.message.includes("duplicate key")) {
        return NextResponse.json(
          { error: "A folder with this name already exists" },
          { status: 409 }
        );
      }

      if (error.name === "ValidationError") {
        return NextResponse.json(
          { error: "Invalid folder data", details: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update folder" },
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

    // Validate folder ID
    const folderId = params.id;
    if (!folderId || folderId.length !== 24) {
      return NextResponse.json(
        { error: "Invalid folder ID" },
        { status: 400 }
      );
    }

    // Find folder
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, folder))) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Recursively delete the folder and all its contents
    const deletionStats = await folder.deleteRecursively();

    console.log(`Folder "${folder.name}" deletion completed: ${deletionStats.foldersDeleted} folders, ${deletionStats.filesDeleted} files deleted`);

    if (deletionStats.errors.length > 0) {
      console.warn(`Deletion warnings:`, deletionStats.errors);
    }

    // Return deletion statistics
    return NextResponse.json({
      message: "Folder deleted successfully",
      stats: {
        foldersDeleted: deletionStats.foldersDeleted,
        filesDeleted: deletionStats.filesDeleted,
        errors: deletionStats.errors.length > 0 ? deletionStats.errors : undefined
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Delete folder error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

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
