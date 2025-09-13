import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse } from "@/lib/auth";

const querySchema = z.object({
  folderId: z.string().nullable().optional(),
  q: z.string().nullable().optional(),
  page: z.string().nullable().transform(val => parseInt(val || "1") || 1).optional(),
  limit: z.string().nullable().transform(val => Math.min(parseInt(val || "50") || 50, 100)).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      folderId: searchParams.get("folderId"),
      q: searchParams.get("q"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    };

    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { folderId, q: search, page = 1, limit = 50 } = validation.data;

    // Validate folderId if provided
    if (folderId && folderId !== "null" && !/^[0-9a-fA-F]{24}$/.test(folderId)) {
      return NextResponse.json(
        { error: "Invalid folder ID format" },
        { status: 400 }
      );
    }

    // Get files with pagination
    // For "All Files", don't filter by folder (pass undefined)
    const finalFolderId = folderId ? (folderId === "null" ? null : folderId) : undefined;

    const result = await File.findByOwnerWithCount(user.id, {
      folderId: finalFolderId,
      search,
      page,
      limit,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get files error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to get files" },
      { status: 500 }
    );
  }
}

// Optional: Create file metadata without upload
export async function POST(request: NextRequest) {
  try {
    // Authentication required
    await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // This endpoint is reserved for future use
    // Currently, files are created through the upload endpoint
    return NextResponse.json(
      { error: "Use /api/upload to create files" },
      { status: 405 }
    );
  } catch (error) {
    console.error("Create file metadata error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
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
