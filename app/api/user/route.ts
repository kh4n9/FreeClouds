import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import { getStorageLimitInfo } from "@/lib/quota";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";
import { telegramAPI } from "@/lib/telegram";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/ratelimit";

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

const updateAvatarSchema = z.object({
  avatar: z
    .string()
    .min(1, "Avatar is required")
    .max(5 * 1024 * 1024, "Avatar too large")
    .refine(
      (v) => /^data:image\/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$/.test(v),
      "Invalid avatar data",
    ),
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
    const { storageLimit, customStorageLimit } = await getStorageLimitInfo(
      user.id,
    );

    return NextResponse.json(
      {
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        emailVerified: Boolean(userDoc.emailVerified),
        avatar: userDoc.avatarFileId
          ? `/api/user/avatar?v=${
              userDoc.avatarUpdatedAt?.getTime() || Date.now()
            }`
          : userDoc.avatar || null,
        createdAt: userDoc.createdAt,
        updatedAt: userDoc.updatedAt,
        stats: {
          totalFiles: storageStats.totalFiles,
          totalSize: storageStats.totalSize,
          totalFolders: folderCount,
        },
        storageLimit,
        customStorageLimit,
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
      // Changing the email resets verification status until re-verified
      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        { name, email, emailVerified: false },
        { new: true, runValidators: true },
      ).select("-password");

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          message: "Profile updated successfully",
          user: {
            id: updatedUser._id.toString(),
            name: updatedUser.name,
            email: updatedUser.email,
            emailVerified: Boolean(updatedUser.emailVerified),
            avatar: updatedUser.avatar || null,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
          },
        },
        { status: 200 },
      );
    } else if (action === "update-avatar") {
      const rateLimit = checkRateLimit(request, RATE_LIMITS.UPLOAD, "upload");
      if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime, rateLimit.maxRequests);
      }

      const validation = updateAvatarSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Invalid avatar image" },
          { status: 400 },
        );
      }

      const avatarMatch = String(validation.data.avatar).match(
        /^data:image\/(png|jpeg|webp);base64,(.+)$/,
      );
      if (!avatarMatch) {
        return NextResponse.json(
          { error: "Invalid avatar image" },
          { status: 400 },
        );
      }

      const mimeType = `image/${avatarMatch[1]}`;
      const imageBuffer = Buffer.from(avatarMatch[2]!, "base64");

      let telegramResponse;
      try {
        telegramResponse = await telegramAPI.sendDocument(
          imageBuffer,
          `avatar_${user.id}.${avatarMatch[1]}`,
          mimeType,
        );
      } catch (error) {
        console.error("Telegram avatar upload failed:", error);
        return NextResponse.json(
          { error: "Avatar upload failed. Please try again." },
          { status: 500 },
        );
      }

      let avatarFilePath: string | null = null;
      try {
        const fileInfo = await telegramAPI.getFile(
          telegramResponse.document.file_id,
        );
        avatarFilePath = fileInfo.file_path || null;
      } catch {
        // File path is optional; avatar still streams via getFile fallback
      }

      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        {
          avatar: null,
          avatarFileId: telegramResponse.document.file_id,
          avatarFilePath,
          avatarMime: mimeType,
          avatarUpdatedAt: new Date(),
        },
        { new: true, runValidators: true },
      );

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          message: "Avatar updated successfully",
          avatar: `/api/user/avatar?v=${
            updatedUser.avatarUpdatedAt?.getTime() || Date.now()
          }`,
        },
        { status: 200 },
      );
    } else if (action === "remove-avatar") {
      const updatedUser = await User.findByIdAndUpdate(
        user.id,
        {
          avatar: null,
          avatarFileId: null,
          avatarFilePath: null,
          avatarMime: null,
          avatarUpdatedAt: null,
        },
        { new: true },
      );

      if (!updatedUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json(
        {
          message: "Avatar removed",
          avatar: null,
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
      const passwordHash = (userDoc as { passwordHash?: string }).passwordHash;
      if (!passwordHash) {
        return NextResponse.json(
          { error: "Password not set for this account" },
          { status: 400 },
        );
      }
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        passwordHash,
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
        passwordHash: hashedNewPassword,
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
