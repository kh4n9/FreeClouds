import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { User } from "@/models/User";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    const { id } = params;

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
    const recentFiles = await (File as any)
      .find({
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
    if (fileStats && fileStats.length > 0 && fileStats[0]?.fileTypes) {
      fileStats[0].fileTypes.forEach((file: any) => {
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
      recentFiles: recentFiles.map((file: any) => ({
        ...file,
        id: file._id.toString(),
        _id: undefined,
      })),
    };

    return NextResponse.json(userWithStats, { status: 200 });
  } catch (error) {
    console.error("Admin user GET error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verify admin authentication
    const adminUser = await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    const { id } = params;
    const body = await request.json();
    const { name, email, role, isActive, password } = body;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-demotion from admin
    if ((user._id as any).toString() === adminUser.id && role === "user") {
      return NextResponse.json(
        { error: "Cannot demote yourself from admin role" },
        { status: 400 },
      );
    }

    // Prevent self-deactivation
    if ((user._id as any).toString() === adminUser.id && isActive === false) {
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
        _id: { $ne: user._id as any },
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

    // Return updated user without password hash
    const userResponse = (user as any).toSafeObject();

    return NextResponse.json(
      {
        message: "User updated successfully",
        user: userResponse,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin user PUT error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Verify admin authentication
    const adminUser = await requireAdmin(request);

    // Connect to database
    await connectToDatabase();

    const { id } = params;

    // Find user
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if ((user._id as any).toString() === adminUser.id) {
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
        const userFiles = await (File as any).find({ owner: id });
        const fileCount = userFiles.length;

        if (fileCount > 0) {
          await (File as any).deleteMany({ owner: id }, { session });
          console.log(`Deleted ${fileCount} files for user ${user.email}`);
        }

        // Delete all user's folders
        const userFolders = await (Folder as any).find({ owner: id });
        const folderCount = userFolders.length;

        if (folderCount > 0) {
          await (Folder as any).deleteMany({ owner: id }, { session });
          console.log(`Deleted ${folderCount} folders for user ${user.email}`);
        }

        // Delete the user account
        await User.findByIdAndDelete(id, { session });

        console.log(`Admin deletion completed for user: ${user.email}`);
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

    return NextResponse.json(
      {
        message: "User and all associated data deleted successfully",
        deletedUser: {
          id: (user._id as any).toString(),
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Admin user DELETE error:", error);

    if (
      error instanceof Error &&
      error.message.includes("Admin access required")
    ) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
