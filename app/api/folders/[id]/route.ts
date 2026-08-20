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
  isFolderUnlocked,
  isInsideUnlockedVault,
  isValidPin,
  hashPin,
  verifyPin,
} from "@/lib/vault";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Folder name too long")
    .trim(),
});

const moveFolderSchema = z.object({
  action: z.literal("move"),
  targetFolderId: z.string().length(24).nullable(),
});

const vaultActionSchema = z.object({
  action: z.enum(["hide", "unhide", "set-pin", "remove-pin"]),
  pin: z
    .string()
    .min(4, "PIN must be 4-8 digits")
    .max(8, "PIN must be 4-8 digits")
    .regex(/^\d+$/, "PIN must be digits only")
    .optional()
    .nullable(),
  currentPin: z.string().optional().nullable(),
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
    const { id: folderId } = await params;
    if (!folderId || folderId.length !== 24) {
      return NextResponse.json({ error: "Invalid folder ID" }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();

    // Find folder
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, folder))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Vault actions: hide / unhide / set-pin / remove-pin
    if (body.action === "hide" || body.action === "unhide" || body.action === "set-pin" || body.action === "remove-pin") {
      const vaultValidation = vaultActionSchema.safeParse(body);
      if (!vaultValidation.success) {
        return NextResponse.json(
          { error: "Invalid vault action", details: vaultValidation.error.message },
          { status: 400 },
        );
      }

      const { action, pin = null, currentPin = null } = vaultValidation.data;

      // Unhiding a folder needs its chain unlocked (so the folder can be
      // seen in normal listings afterwards).
      if (action === "unhide") {
        if (!(await isFolderUnlocked(request, folder))) {
          return NextResponse.json(
            { error: "Unlock the folder before unhiding it" },
            { status: 403 },
          );
        }
        folder.isHidden = false;
        folder.pinHash = null;
        await folder.save();
        return NextResponse.json(
          { id: folder._id.toString(), isHidden: false },
          { status: 200 },
        );
      }

      if (action === "hide") {
        if (pin !== null && pin !== undefined && !isValidPin(pin)) {
          return NextResponse.json(
            { error: "PIN must be 4-8 digits" },
            { status: 400 },
          );
        }
        folder.isHidden = true;
        if (pin) {
          folder.pinHash = await hashPin(pin);
        }
        await folder.save();
        return NextResponse.json(
          {
            id: folder._id.toString(),
            isHidden: true,
            hasPin: !!folder.pinHash,
          },
          { status: 200 },
        );
      }

      if (action === "set-pin") {
        if (!pin || !isValidPin(pin)) {
          return NextResponse.json(
            { error: "PIN must be 4-8 digits" },
            { status: 400 },
          );
        }
        // Changing an existing PIN requires the current one; setting a first
        // PIN requires the folder to be unlocked.
        if (folder.pinHash) {
          if (!currentPin) {
            return NextResponse.json(
              { error: "Current PIN required" },
              { status: 400 },
            );
          }
          if (!(await verifyPin(currentPin, folder.pinHash))) {
            return NextResponse.json(
              { error: "Incorrect current PIN" },
              { status: 403 },
            );
          }
        } else if (!(await isFolderUnlocked(request, folder))) {
          return NextResponse.json(
            { error: "Folder is not accessible" },
            { status: 403 },
          );
        }
        folder.pinHash = await hashPin(pin);
        await folder.save();
        return NextResponse.json(
          { id: folder._id.toString(), hasPin: true },
          { status: 200 },
        );
      }

      // remove-pin
      if (folder.pinHash) {
        if (!currentPin) {
          return NextResponse.json(
            { error: "Current PIN required" },
            { status: 400 },
          );
        }
        if (!(await verifyPin(currentPin, folder.pinHash))) {
          return NextResponse.json(
            { error: "Incorrect current PIN" },
            { status: 403 },
          );
        }
      }
      folder.pinHash = null;
      await folder.save();
      return NextResponse.json(
        { id: folder._id.toString(), hasPin: false },
        { status: 200 },
      );
    }

    // Move action: relocate this folder under another folder (or root)
    if (body.action === "move") {
      // Moving a hidden folder requires its chain to be unlocked.
      if (!(await isFolderUnlocked(request, folder))) {
        return NextResponse.json(
          { error: "Unlock the folder before moving it" },
          { status: 403 },
        );
      }

      const moveValidation = moveFolderSchema.safeParse(body);
      if (!moveValidation.success) {
        return NextResponse.json(
          { error: "Invalid move request" },
          { status: 400 },
        );
      }

      const { targetFolderId } = moveValidation.data;

      let target: typeof folder | null = null;
      if (targetFolderId) {
        target = await Folder.findOne({
          _id: targetFolderId,
          owner: user.id,
        });
        if (!target) {
          return NextResponse.json(
            { error: "Target folder not found" },
            { status: 404 },
          );
        }
        // Target inside a locked hidden chain is off-limits.
        if (!(await isFolderUnlocked(request, target))) {
          return NextResponse.json(
            { error: "Target folder is locked" },
            { status: 403 },
          );
        }
        // Moving an existing hidden folder into a non-hidden chain would make
        // it unreachable from the vault section — require it to stay inside
        // an unlocked vault chain (root included).
        if (folder.isHidden && !(await isInsideUnlockedVault(request, target))) {
          return NextResponse.json(
            { error: "Hidden folders must stay inside the vault" },
            { status: 403 },
          );
        }
        // Moving into itself or its own descendant is a cycle — reject early
        let cursor: typeof folder | null = target;
        const visited = new Set<string>();
        while (cursor) {
          if (cursor._id.toString() === folderId) {
            return NextResponse.json(
              { error: "Cannot move a folder into itself or its sub-folder" },
              { status: 400 },
            );
          }
          if (visited.has(cursor._id.toString())) break;
          visited.add(cursor._id.toString());
          cursor = cursor.parent ? await Folder.findById(cursor.parent) : null;
        }
      }

      if ((target?._id.toString() ?? null) === folder.parent?.toString()) {
        return NextResponse.json(
          { error: "Folder is already in this location" },
          { status: 400 },
        );
      }

      // Check for duplicate folder name in the destination
      const existingFolder = await Folder.findOne({
        _id: { $ne: folderId },
        owner: user.id,
        parent: targetFolderId,
        name: folder.name,
      });
      if (existingFolder) {
        return NextResponse.json(
          {
            error: "A folder with this name already exists in the destination",
          },
          { status: 409 },
        );
      }

      folder.parent = target ? target._id : null;
      try {
        await folder.save();
      } catch (saveError) {
        if (
          saveError instanceof Error &&
          (saveError.message.includes("E11000") ||
            saveError.message.includes("duplicate key"))
        ) {
          return NextResponse.json(
            {
              error: "A folder with this name already exists in the destination",
            },
            { status: 409 },
          );
        }
        throw saveError;
      }

      return NextResponse.json(
        {
          id: folder._id.toString(),
          name: folder.name,
          parent: folder.parent?.toString() || null,
          moved: true,
        },
        { status: 200 },
      );
    }

    // Rename action (default)
    const validation = updateFolderSchema.safeParse(body);

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

    const { name } = validation.data;

    // Renaming a hidden folder requires the chain to be unlocked.
    if (folder.isHidden && !(await isFolderUnlocked(request, folder))) {
      return NextResponse.json(
        { error: "Unlock the folder before renaming it" },
        { status: 403 },
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
        {
          error: "A folder with this name already exists in the same location",
        },
        { status: 409 },
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
    }

    return NextResponse.json(
      { error: "Failed to update folder" },
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

    // Validate folder ID
    const { id: folderId } = await params;
    if (!folderId || folderId.length !== 24) {
      return NextResponse.json({ error: "Invalid folder ID" }, { status: 400 });
    }

    // Find folder
    const folder = await Folder.findById(folderId);

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Verify ownership
    if (!(await verifyOwnership(user.id, folder))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Deleting a hidden folder requires the chain to be unlocked.
    if (folder.isHidden && !(await isFolderUnlocked(request, folder))) {
      return NextResponse.json(
        { error: "Unlock the folder before deleting it" },
        { status: 403 },
      );
    }

    // Recursively delete the folder and all its contents
    const deletionStats = await folder.deleteRecursively();

    console.log(
      `Folder "${folder.name}" deletion completed: ${deletionStats.foldersDeleted} folders, ${deletionStats.filesDeleted} files deleted`,
    );

    if (deletionStats.errors.length > 0) {
      console.warn(`Deletion warnings:`, deletionStats.errors);
    }

    // Return deletion statistics
    return NextResponse.json(
      {
        message: "Folder deleted successfully",
        stats: {
          foldersDeleted: deletionStats.foldersDeleted,
          filesDeleted: deletionStats.filesDeleted,
          errors:
            deletionStats.errors.length > 0 ? deletionStats.errors : undefined,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Delete folder error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to delete folder" },
      { status: 500 },
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
