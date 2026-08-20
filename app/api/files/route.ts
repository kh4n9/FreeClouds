import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import "@/models/Folder";
import { requireAuth, AuthError, createAuthResponse } from "@/lib/auth";
import {
  getAccessibleFolder,
  getInaccessibleFolderIds,
} from "@/lib/vault";

const querySchema = z.object({
  folderId: z.string().nullable().optional(),
  q: z.string().nullable().optional(),
  favorite: z.string().nullable().optional(),
  view: z.enum(["recent"]).nullable().optional(),
  page: z
    .string()
    .nullable()
    .transform((val) => parseInt(val || "1") || 1)
    .optional(),
  limit: z
    .string()
    .nullable()
    .transform((val) => Math.min(parseInt(val || "50") || 50, 100))
    .optional(),
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
      favorite: searchParams.get("favorite"),
      view: searchParams.get("view"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    };

    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const { folderId, q: search, favorite, view, page = 1, limit = 50 } = validation.data;

    // Recent view: files across all folders sorted by newest first
    if (view === "recent") {
      const files = await File.findRecent(user.id, Math.min(limit, 100));
      // Hide files that live inside locked hidden chains
      const inaccessible = await getInaccessibleFolderIds(request, user.id);
      const visibleFiles = inaccessible.length > 0
        ? files.filter((f) => !f.folder || !inaccessible.includes(f.folder.toString()))
        : files;
      return NextResponse.json(
        { files: visibleFiles, total: visibleFiles.length, page: 1, limit: visibleFiles.length, totalPages: 1 },
        { status: 200 },
      );
    }

    // Validate folderId if provided
    if (
      folderId &&
      folderId !== "null" &&
      !/^[0-9a-fA-F]{24}$/.test(folderId)
    ) {
      return NextResponse.json(
        { error: "Invalid folder ID format" },
        { status: 400 },
      );
    }

    // Get files with pagination
    // For "All Files", don't filter by folder (pass undefined)
    const finalFolderId = folderId
      ? folderId === "null"
        ? null
        : folderId
      : undefined;

    // When browsing a specific folder, that folder must not sit inside a
    // locked hidden chain.
    if (finalFolderId !== undefined && finalFolderId !== null) {
      const folder = await getAccessibleFolder(request, finalFolderId, user.id);
      if (!folder) {
        return NextResponse.json(
          { error: "Folder not found or access denied" },
          { status: 403 },
        );
      }
    }

    // Cross-folder views (All Files, search, favorites) must exclude files
    // in locked hidden chains.
    let excludeFolderIds: string[] | undefined;
    if (finalFolderId === undefined) {
      const inaccessible = await getInaccessibleFolderIds(request, user.id);
      if (inaccessible.length > 0) excludeFolderIds = inaccessible;
    }

    // Build options object conditionally to avoid passing `undefined` for exact optional property types
    const options: {
      page: number;
      limit: number;
      folderId?: string | null;
      search?: string;
      favorite?: boolean;
      excludeFolderIds?: string[];
    } = { page, limit };
    if (finalFolderId !== undefined) {
      options.folderId = finalFolderId;
    }
    if (search !== undefined && search !== null) {
      options.search = search;
    }
    if (favorite !== undefined && favorite !== null) {
      options.favorite = favorite === "true";
    }
    if (excludeFolderIds) {
      options.excludeFolderIds = excludeFolderIds;
    }

    const result = await File.findByOwnerWithCount(user.id, options);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Get files error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    const msg = error instanceof Error ? error.message : String(error);
    console.error("Get files error details:", msg);
    return NextResponse.json({ error: "Failed to get files", details: msg }, { status: 500 });
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
      { status: 405 },
    );
  } catch (error) {
    console.error("Create file metadata error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to create file" },
      { status: 500 },
    );
  }
}

// Method not allowed for other HTTP methods
export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
