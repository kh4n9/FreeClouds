import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, AuthError, createAuthResponse } from "@/lib/auth";
import { getStorageLimitInfo } from "@/lib/quota";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const [usage, folderCount, { storageLimit, customStorageLimit }] =
      await Promise.all([
        File.getStorageUsage(user.id),
        Folder.countDocuments({ owner: user.id, deletedAt: null }),
        getStorageLimitInfo(user.id),
      ]);

    return NextResponse.json(
      {
        ...user,
        stats: {
          totalFiles: usage.totalFiles,
          totalSize: usage.totalSize,
          totalFolders: folderCount,
        },
        storageLimit,
        customStorageLimit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to get user information" },
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

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
