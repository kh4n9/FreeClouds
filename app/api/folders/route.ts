import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
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
  filterVisibleFolders,
  getAccessibleFolder,
  isInsideUnlockedVault,
  isValidPin,
  hashPin,
} from "@/lib/vault";

const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name too long")
    .trim(),
  parent: z.string().optional().nullable(),
  isHidden: z.boolean().optional(),
  pin: z
    .string()
    .min(4, "PIN must be 4-8 digits")
    .max(8, "PIN must be 4-8 digits")
    .regex(/^\d+$/, "PIN must be digits only")
    .optional()
    .nullable(),
});

const querySchema = z.object({
  parent: z.string().optional().nullable(),
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
      parent: searchParams.get("parent"),
    };

    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters" },
        { status: 400 },
      );
    }

    const { parent } = validation.data;

    // Verify parent folder ownership + vault access if parent is specified
    if (parent && parent !== "null") {
      const parentFolder = await getAccessibleFolder(request, parent, user.id);
      if (!parentFolder) {
        return NextResponse.json(
          { error: "Parent folder not found or access denied" },
          { status: 404 },
        );
      }
    }

    // Get folders by owner and parent
    // If no parent specified, return all folders for tree building
    const hasParentParam = searchParams.has("parent");
    const finalParentValue = hasParentParam
      ? parent === "null"
        ? null
        : parent
      : undefined;

    const folders = await Folder.findByOwner(
      user.id,
      finalParentValue,
    );

    // Filter out locked hidden folders (and hidden folders without an
    // unlocked ancestor)
    const visibleFolders = await filterVisibleFolders(request, folders);

    return NextResponse.json(visibleFolders, { status: 200 });
  } catch (error) {
    console.error("Get folders error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to get folders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return createCsrfError();
    }

    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Parse and validate request body
    const body = await request.json();
    const validation = createFolderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    const { name, parent, isHidden = false, pin = null } = validation.data;

    // Verify parent folder ownership if parent is specified
    if (parent) {
      const parentFolder = await Folder.findById(parent).catch(() => null);
      if (
        !parentFolder ||
        !(await verifyOwnership(user.id, parentFolder))
      ) {
        return NextResponse.json(
          { error: "Parent folder not found or access denied" },
          { status: 404 },
        );
      }
      // Hidden folders may only be placed where the requester can currently
      // reach (root or inside an unlocked hidden chain), otherwise they would
      // become unreachable.
      if (isHidden) {
        if (!(await isInsideUnlockedVault(request, parentFolder))) {
          return NextResponse.json(
            { error: "Cannot create a hidden folder here" },
            { status: 403 },
          );
        }
      }
    }

    if (isHidden && pin !== null && !isValidPin(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4-8 digits" },
        { status: 400 },
      );
    }

    // Check for duplicate folder name in the same parent
    const existingFolder = await Folder.findOne({
      owner: user.id,
      parent: parent || null,
      name: name,
    });

    if (existingFolder) {
      return NextResponse.json(
        {
          error:
            "A folder with this name already exists in the specified location",
        },
        { status: 409 },
      );
    }

    const folder = new Folder({
      name,
      owner: user.id,
      parent: parent || null,
      ...(isHidden ? { isHidden: true } : {}),
      ...(isHidden && pin
        ? { pinHash: await hashPin(pin) }
        : {}),
    });

    await folder.save();

    // Return created folder
    const response = {
      id: folder._id.toString(),
      name: folder.name,
      parent: folder.parent?.toString() || null,
      createdAt: folder.createdAt,
      ...(folder.isHidden ? { isHidden: true, hasPin: !!folder.pinHash } : {}),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Create folder error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (
        error.message.includes("E11000") ||
        error.message.includes("duplicate key")
      ) {
        return NextResponse.json(
          { error: "A folder with this name already exists" },
          { status: 409 },
        );
      }

      if (error.name === "ValidationError") {
        return NextResponse.json(
          { error: "Invalid folder data", details: error.message },
          { status: 400 },
        );
      }

      if (error.message.includes("Circular folder reference")) {
        return NextResponse.json(
          { error: "Cannot create folder: circular reference detected" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create folder" },
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
