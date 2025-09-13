import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Get all files count (including deleted)
    const totalFiles = await File.countDocuments({
      owner: user.id,
    });

    // Get active files count
    const activeFiles = await File.countDocuments({
      owner: user.id,
      deletedAt: null,
    });

    // Get files by folder distribution
    const filesByFolder = await File.aggregate([
      {
        $match: {
          owner: user.id,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: "$folder",
          count: { $sum: 1 },
          files: { $push: { name: "$name", size: "$size" } },
        },
      },
    ]);

    // Get all files (simulating All Files view)
    const allFiles = await File.findByOwnerWithCount(user.id, {
      folderId: undefined, // This should return ALL files
      page: 1,
      limit: 100,
    });

    // Get root files only (folder = null)
    const rootFiles = await File.findByOwnerWithCount(user.id, {
      folderId: null, // This should return only root files
      page: 1,
      limit: 100,
    });

    const response = {
      userId: user.id,
      counts: {
        totalFiles,
        activeFiles,
        allFilesQuery: allFiles.total,
        rootFilesQuery: rootFiles.total,
      },
      distribution: filesByFolder.map(item => ({
        folderId: item._id ? item._id.toString() : null,
        folderName: item._id ? "In Folder" : "Root",
        count: item.count,
        files: item.files,
      })),
      queries: {
        allFiles: {
          count: allFiles.files.length,
          total: allFiles.total,
          files: allFiles.files.map(f => ({
            name: f.name,
            folder: f.folder?.toString() || null,
          })),
        },
        rootFiles: {
          count: rootFiles.files.length,
          total: rootFiles.total,
          files: rootFiles.files.map(f => ({
            name: f.name,
            folder: f.folder?.toString() || null,
          })),
        },
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Debug files error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to get debug info" },
      { status: 500 }
    );
  }
}
