import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Folder } from "@/models/Folder";
import { User } from "@/models/User";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse } from "@/lib/auth";
import mongoose from "mongoose";

const querySchema = z.object({
  page: z
    .string()
    .nullable()
    .transform((val) => parseInt(val || "1") || 1)
    .optional(),
  limit: z
    .string()
    .nullable()
    .transform((val) => Math.min(parseInt(val || "20") || 20, 100))
    .optional(),
  search: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  sortBy: z.string().nullable().optional(),
  sortOrder: z.enum(["asc", "desc"]).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Authentication required - admin only
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 },
      );
    }

    // Connect to database
    await connectToDatabase();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      search: searchParams.get("search"),
      userId: searchParams.get("userId"),
      sortBy: searchParams.get("sortBy"),
      sortOrder: searchParams.get("sortOrder"),
    };

    const validation = querySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 },
      );
    }

    const {
      page = 1,
      limit = 20,
      search,
      userId,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = validation.data;

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // Match stage
    const matchStage: any = {};

    // Filter by user if specified
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add owner information
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    });

    pipeline.push({
      $unwind: "$ownerInfo",
    });

    // Add parent folder information with recursive path lookup
    pipeline.push({
      $lookup: {
        from: "folders",
        localField: "parent",
        foreignField: "_id",
        as: "parentInfo",
      },
    });

    // Count files in each folder
    pipeline.push({
      $lookup: {
        from: "files",
        let: { folderId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$folder", "$$folderId"] },
                  { $eq: ["$deletedAt", null] },
                ],
              },
            },
          },
          { $count: "fileCount" },
        ],
        as: "filesCount",
      },
    });

    // Count subfolders
    pipeline.push({
      $lookup: {
        from: "folders",
        let: { folderId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$parent", "$$folderId"] },
            },
          },
          { $count: "folderCount" },
        ],
        as: "subfoldersCount",
      },
    });

    // Project fields
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        parent: 1,
        createdAt: 1,
        owner: "$ownerInfo._id",
        ownerName: "$ownerInfo.name",
        ownerEmail: "$ownerInfo.email",
        fileCount: {
          $ifNull: [{ $arrayElemAt: ["$filesCount.fileCount", 0] }, 0],
        },
        subfolderCount: {
          $ifNull: [{ $arrayElemAt: ["$subfoldersCount.folderCount", 0] }, 0],
        },
        totalItems: {
          $add: [
            { $ifNull: [{ $arrayElemAt: ["$filesCount.fileCount", 0] }, 0] },
            {
              $ifNull: [
                { $arrayElemAt: ["$subfoldersCount.folderCount", 0] },
                0,
              ],
            },
          ],
        },
        parentName: { $arrayElemAt: ["$parentInfo.name", 0] },
        isRootFolder: { $eq: ["$parent", null] },
      },
    });

    // Search functionality
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { ownerName: { $regex: search, $options: "i" } },
            { ownerEmail: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Sort stage
    const sortStage: any = {};
    // Ensure sortBy is a string (zod allows null, so narrow the type here)
    const sortField =
      typeof sortBy === "string" && sortBy ? sortBy : "createdAt";
    sortStage[sortField] = sortOrder === "desc" ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Count total documents
    const countPipeline = [...pipeline, { $count: "total" }];
    const [countResult] = await Folder.aggregate(countPipeline);
    const total = countResult?.total || 0;

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const folders = await Folder.aggregate(pipeline);

    // Transform results with simple parent display
    const transformedFolders = folders.map((folder) => ({
      id: folder._id.toString(),
      name: folder.name,
      parent: folder.parent?.toString() || null,
      parentName: folder.parentName || null,
      isRootFolder: folder.isRootFolder || false,
      owner: folder.owner.toString(),
      ownerName: folder.ownerName,
      ownerEmail: folder.ownerEmail,
      fileCount: folder.fileCount,
      subfolderCount: folder.subfolderCount,
      totalItems: folder.totalItems,
      createdAt: folder.createdAt,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      currentPage: page,
      totalPages,
      totalFolders: total,
      hasNextPage,
      hasPrevPage,
    };

    return NextResponse.json({
      folders: transformedFolders,
      pagination,
    });
  } catch (error) {
    console.error("Admin folders API error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 },
    );
  }
}

// Delete multiple folders (admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Authentication required - admin only
    const user = await requireAuth(request);

    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 },
      );
    }

    // Connect to database
    await connectToDatabase();

    const body = await request.json();
    const { folderIds, recursive = false } = body;

    if (!Array.isArray(folderIds) || folderIds.length === 0) {
      return NextResponse.json(
        { error: "Folder IDs array is required" },
        { status: 400 },
      );
    }

    // Validate folder IDs
    const validFolderIds = folderIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validFolderIds.length === 0) {
      return NextResponse.json(
        { error: "No valid folder IDs provided" },
        { status: 400 },
      );
    }

    let totalFoldersDeleted = 0;
    let totalFilesDeleted = 0;
    const errors: string[] = [];

    for (const folderId of validFolderIds) {
      try {
        const folder = await (Folder as any).findById(folderId);
        if (!folder) {
          errors.push(`Folder with ID ${folderId} not found`);
          continue;
        }

        if (recursive) {
          // Recursive deletion
          const stats = await folder.deleteRecursively();
          totalFoldersDeleted += stats.foldersDeleted;
          totalFilesDeleted += stats.filesDeleted;
          errors.push(...stats.errors);
        } else {
          // Check if folder is empty before deletion
          const fileCount = await File.countDocuments({
            folder: folderId,
            deletedAt: null,
          });
          const subfolderCount = await Folder.countDocuments({
            parent: folderId,
          });

          if (fileCount > 0 || subfolderCount > 0) {
            errors.push(
              `Folder "${folder.name}" is not empty. Use recursive delete to delete non-empty folders.`,
            );
            continue;
          }

          // Delete empty folder
          await (Folder as any).findByIdAndDelete(folderId);
          totalFoldersDeleted += 1;
        }
      } catch (error) {
        const errorMsg = `Failed to delete folder ${folderId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      foldersDeleted: totalFoldersDeleted,
      filesDeleted: totalFilesDeleted,
      errors,
      recursive,
    });
  } catch (error) {
    console.error("Admin delete folders error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to delete folders" },
      { status: 500 },
    );
  }
}
