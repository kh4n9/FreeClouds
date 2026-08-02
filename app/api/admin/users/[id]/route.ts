import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin, AuthError, createAuthResponse } from "@/lib/auth";
import { User } from "@/models/User";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import { logAction } from "@/lib/activity-log";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

interface FileTypeAgg {
  type: string;
  size: number;
}

interface FileStatsAgg {
  totalFiles: number;
  totalSize: number;
  fileTypes: FileTypeAgg[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    const { id } = await params;

    // Find user with detailed stats
    const user = await User.findById(id).select("-passwordHash").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's file statistics
    const fileStats = await File.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(user._id.toString()),
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: "$size" },
          fileTypes: {
            $push: {
              type: { $arrayElemAt: [{ $split: ["$mime", "/"] }, -1] },
              size: "$size",
            },
          },
        },
      },
    ]);

    // Get user's folder count
    const folderCount = await Folder.countDocuments({
      owner: user._id.toString(),
    });

    // Get recent files
    const recentFiles = await File.find({
      owner: user._id.toString(),
      deletedAt: null,
    })
      .select("name mime size createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate file type distribution
    const typeDistribution: { [key: string]: { count: number; size: number } } =
      {};
    const fileStatsResult = fileStats[0] as FileStatsAgg | undefined;
    if (fileStats && fileStats.length > 0 && fileStatsResult?.fileTypes) {
      fileStatsResult.fileTypes.forEach((file) => {
        const fileType = file.type || "unknown";
        if (!typeDistribution[fileType]) {
          typeDistribution[fileType] = { count: 0, size: 0 };
        }
        typeDistribution[fileType].count++;
        typeDistribution[fileType].size += file.size || 0;
      });
    }

    const userWithStats = {
      ...user,
      id: user._id.toString(),
      _id: undefined,
      stats: {
        totalFiles: (fileStats && fileStats[0]?.totalFiles) || 0,
        totalSize: (fileStats && fileStats[0]?.totalSize) || 0,
        totalFolders: folderCount,
        typeDistribution,
      },
      recentFiles: recentFiles.map((file) => ({
        ...file,
        id: file._id.toString(),
        type: file.mime,
        _id: undefined,
      })),
    };

    return NextResponse.json(userWithStats, { status: 200 });
  } catch (error) {
    console.error("Admin user GET error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify admin authentication
    const adminUser = await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    const { id } = await params;
    const body = await request.json();
    const { name, email, role, isActive, password } = body;
    const updatedFields = { name, email, role, isActive, password };

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-demotion from admin
    if (user._id.toString() === adminUser.id && role === "user") {
      return NextResponse.json(
        { error: "Cannot demote yourself from admin role" },
        { status: 400 },
      );
    }

    // Prevent self-deactivation
    if (user._id.toString() === adminUser.id && isActive === false) {
      return NextResponse.json(
        { error: "Cannot deactivate your own account" },
        { status: 400 },
      );
    }

    // Update fields
    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 },
        );
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 },
        );
      }

      const emailLower = email.toLowerCase().trim();

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email: emailLower,
        _id: { $ne: user._id },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already taken by another user" },
          { status: 409 },
        );
      }

      user.email = emailLower;
    }

    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be 'user' or 'admin'" },
          { status: 400 },
        );
      }
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = Boolean(isActive);
    }

    if (password !== undefined) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 },
        );
      }

      const saltRounds = 12;
      user.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await user.save();

    await logAction("admin.user.update", {
      userId: adminUser.id,
      email: adminUser.email,
      entityType: "user",
      entityId: user._id.toString(),
      metadata: {
        fields: Object.keys(updatedFields).filter(
          (k) => (updatedFields as Record<string, unknown>)[k] !== undefined,
        ),
      },
      request,
    });

    // Return updated user without password hash
    const userResponse = user.toSafeObject();

    return NextResponse.json(
      {
        message: "User updated successfully",
        user: userResponse,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin user PUT error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Verify admin authentication
    const adminUser = await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    const { id } = await params;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if (user._id.toString() === adminUser.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 },
      );
    }

    // Start transaction for user deletion
    const session = await User.startSession();

    try {
      await session.withTransaction(async () => {
        // Delete all user's files
        const userFiles = await File.find({ owner: id });
        const fileCount = userFiles.length;

        if (fileCount > 0) {
          await File.deleteMany({ owner: id }, { session });
        }

        // Delete all user's folders
        const userFolders = await Folder.find({ owner: id });
        const folderCount = userFolders.length;

        if (folderCount > 0) {
          await Folder.deleteMany({ owner: id }, { session });
        }

        // Delete the user account
        await User.findByIdAndDelete(id, { session });
      });
    } catch (transactionError) {
      console.error(
        "Transaction failed during admin user deletion:",
        transactionError,
      );
      throw transactionError;
    } finally {
      await session.endSession();
    }

    await logAction("admin.user.delete", {
      userId: adminUser.id,
      email: adminUser.email,
      entityType: "user",
      entityId: user._id.toString(),
      metadata: { deletedEmail: user.email },
      request,
    });

    return NextResponse.json(
      {
        message: "User and all associated data deleted successfully",
        deletedUser: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin user DELETE error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
