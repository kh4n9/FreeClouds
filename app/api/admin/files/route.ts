import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { User } from "@/models/User";
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
  includeDeleted: z
    .string()
    .nullable()
    .transform((val) => val === "true")
    .optional(),
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
      includeDeleted: searchParams.get("includeDeleted"),
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
      includeDeleted = false,
    } = validation.data;

    // Build aggregation pipeline
    const pipeline: any[] = [];

    // Match stage
    const matchStage: any = {};

    // Filter by user if specified
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    // Filter by deletion status
    if (!includeDeleted) {
      matchStage.deletedAt = null;
    }

    // Search functionality
    if (search) {
      matchStage.name = { $regex: search, $options: "i" };
    }

    pipeline.push({ $match: matchStage });

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

    // Add folder information
    pipeline.push({
      $lookup: {
        from: "folders",
        localField: "folder",
        foreignField: "_id",
        as: "folderInfo",
      },
    });

    // Project fields
    pipeline.push({
      $project: {
        _id: 1,
        name: 1,
        size: 1,
        mime: 1,
        fileId: 1,
        folder: 1,
        deletedAt: 1,
        createdAt: 1,
        owner: "$ownerInfo._id",
        ownerName: "$ownerInfo.name",
        ownerEmail: "$ownerInfo.email",
        folderName: { $arrayElemAt: ["$folderInfo.name", 0] },
        folderPath: { $arrayElemAt: ["$folderInfo.path", 0] },
        formattedSize: {
          $switch: {
            branches: [
              {
                case: { $lt: ["$size", 1024] },
                then: { $concat: [{ $toString: "$size" }, " B"] },
              },
              {
                case: { $lt: ["$size", 1048576] },
                then: {
                  $concat: [
                    {
                      $toString: { $round: [{ $divide: ["$size", 1024] }, 2] },
                    },
                    " KB",
                  ],
                },
              },
              {
                case: { $lt: ["$size", 1073741824] },
                then: {
                  $concat: [
                    {
                      $toString: {
                        $round: [{ $divide: ["$size", 1048576] }, 2],
                      },
                    },
                    " MB",
                  ],
                },
              },
            ],
            default: {
              $concat: [
                {
                  $toString: {
                    $round: [{ $divide: ["$size", 1073741824] }, 2],
                  },
                },
                " GB",
              ],
            },
          },
        },
        // Extension will be calculated on frontend
      },
    });

    // Sort stage
    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === "desc" ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Count total documents
    const countPipeline = [...pipeline, { $count: "total" }];
    const [countResult] = await File.aggregate(countPipeline);
    const total = countResult?.total || 0;

    // Add pagination
    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Execute aggregation
    const files = await File.aggregate(pipeline);

    // Transform results
    const transformedFiles = files.map((file) => ({
      id: file._id.toString(),
      name: file.name,
      size: file.size,
      formattedSize: file.formattedSize,
      mime: file.mime,
      extension: file.name.includes(".")
        ? file.name.split(".").pop() || ""
        : "",
      fileId: file.fileId,
      folder: file.folder?.toString() || null,
      folderName: file.folderName || null,
      folderPath: file.folderPath || "/",
      owner: file.owner.toString(),
      ownerName: file.ownerName,
      ownerEmail: file.ownerEmail,
      deletedAt: file.deletedAt,
      createdAt: file.createdAt,
      isDeleted: !!file.deletedAt,
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const pagination = {
      currentPage: page,
      totalPages,
      totalFiles: total,
      hasNextPage,
      hasPrevPage,
    };

    return NextResponse.json({
      files: transformedFiles,
      pagination,
    });
  } catch (error) {
    console.error("Admin files API error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 },
    );
  }
}

// Delete multiple files (admin only)
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
    const { fileIds, permanent = false } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: "File IDs array is required" },
        { status: 400 },
      );
    }

    // Validate file IDs
    const validFileIds = fileIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validFileIds.length === 0) {
      return NextResponse.json(
        { error: "No valid file IDs provided" },
        { status: 400 },
      );
    }

    let result: any;
    if (permanent) {
      // Permanent deletion
      result = await File.deleteMany({
        _id: { $in: validFileIds.map((id) => new mongoose.Types.ObjectId(id)) },
      });
    } else {
      // Soft deletion
      result = await File.updateMany(
        {
          _id: {
            $in: validFileIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
          deletedAt: null,
        },
        {
          deletedAt: new Date(),
        },
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: result?.deletedCount || result?.modifiedCount || 0,
      permanent,
    });
  } catch (error) {
    console.error("Admin delete files error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to delete files" },
      { status: 500 },
    );
  }
}

// Restore multiple files (admin only)
export async function PATCH(request: NextRequest) {
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
    const { fileIds, action } = body;

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: "File IDs array is required" },
        { status: 400 },
      );
    }

    if (!action || !["restore"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action is required (restore)" },
        { status: 400 },
      );
    }

    // Validate file IDs
    const validFileIds = fileIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    if (validFileIds.length === 0) {
      return NextResponse.json(
        { error: "No valid file IDs provided" },
        { status: 400 },
      );
    }

    let result: any;
    if (action === "restore") {
      // Restore files
      result = await File.updateMany(
        {
          _id: {
            $in: validFileIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
          deletedAt: { $ne: null },
        },
        {
          deletedAt: null,
        },
      );
    }

    return NextResponse.json({
      success: true,
      modifiedCount: result?.modifiedCount || 0,
      action,
    });
  } catch (error) {
    console.error("Admin restore files error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to restore files" },
      { status: 500 },
    );
  }
}
