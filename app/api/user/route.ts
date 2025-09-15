import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").trim(),
  email: z.string().email("Invalid email address").trim().toLowerCase(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function GET(request: NextRequest) {
  try {
    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Get user details
    const userDoc = await User.findById(user.id).select("-password");

    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get storage statistics
    const storageStats = await File.getStorageUsage(user.id);
    const folderCount = await Folder.countDocuments({ owner: user.id });

    return NextResponse.json(
      {
        id: (userDoc._id as any).toString(),
        name: userDoc.name,
        email: userDoc.email,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
        stats: {
          totalFiles: storageStats.totalFiles,
          totalSize: storageStats.totalSize,
          totalFolders: folderCount,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get user profile error:", error);

    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }

    return NextResponse.json(
      { error: "Failed to get user profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return createCsrfError();
    }

    // Authentication required
    const user = await requireAuth(request);

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { action } = body;

    if (action === "update-profile") {
      // Validate profile data
      const validation = updateProfileSchema.safeParse(body);
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

      const { name, email } = validation.data;

      // Check if email is already taken by another user
      const existingUser = await User.findOne({
        email,
        _id: { $ne: user.id },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email is already taken" },
          { status: 409 },
        );
      }

      // Update user profile
      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        { name, email },
        { new: true, runValidators: true },
      ).select("-password");

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          message: "Profile updated successfully",
          user: {
            id: (updatedUser._id as any).toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
        { status: 200 },
      );
    } else if (action === "change-password") {
      // Validate password data
      const validation = changePasswordSchema.safeParse(body);
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

      const { currentPassword, newPassword } = validation.data;

      // Get user with password
      const userDoc = await User.findById(user.id);
      if (!userDoc) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        (userDoc as any).password,
      );
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 },
        );
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await User.findByIdAndUpdate(user.id, {
        password: hashedNewPassword,
      });

      return NextResponse.json(
        {
          message: "Password changed successfully",
        },
        { status: 200 },
      );
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Update user profile error:", error);

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
          { error: "Email is already taken" },
          { status: 409 },
        );
      }

      if (error.name === "ValidationError") {
        return NextResponse.json(
          { error: "Invalid user data", details: error.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update user profile" },
      { status: 500 },
    );
  }
}

// Method not allowed for other HTTP methods
export async function POST() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
