import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import { getUserFromRequest } from "@/lib/auth";
import { User } from "@/models/User";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import { FileVersion } from "@/models/FileVersion";
import VerificationCode from "@/models/VerificationCode";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 5, 60 * 60 * 1000, "confirm-deletion"); // 5 requests per hour
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many deletion attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 },
      );
    }

    // Verify authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = user.id;
    const userEmail = user.email;

    const body = await request.json();
    const { code } = body;

    // Validate input
    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 },
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 },
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find and validate verification code
    const verificationCode = await VerificationCode.findValidCode(
      userEmail,
      code,
      "account_deletion",
    );

    if (!verificationCode) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 },
      );
    }

    // Find user
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Collect parent file documents BEFORE the rows are removed so their
    // Telegram documents and cached Blobs can be reclaimed afterwards.
    // Only top-level rows: purgeStoredResources sweeps chunk parts itself.
    const ownedFiles = await File.find({
      owner: userId,
      $or: [{ chunkedId: null }, { chunkIndex: -1 }],
    });

    // Start transaction for account deletion
    const session = await User.startSession();

    try {
      await session.withTransaction(async () => {
        // NOTE: the field is `owner`, not `userId`. This used to filter on
        // `userId`, which is not a path on either schema — Mongoose passes the
        // unknown key through and it matched ZERO documents, so the transaction
        // deleted the User and committed while every file, folder, version and
        // Telegram document survived, unreachable by any UI.
        await File.deleteMany({ owner: userId }, { session });
        await Folder.deleteMany({ owner: userId }, { session });
        await FileVersion.deleteMany({ owner: userId }, { session });

        // Delete all verification codes for this user
        await VerificationCode.deleteMany(
          { email: userEmail.toLowerCase() },
          { session },
        );

        // Finally, delete the user account
        await User.findByIdAndDelete(userId, { session });

        console.log(`Account deletion completed for user: ${userEmail}`);
      });

      // Reclaim storage only after the transaction committed: a failure here
      // leaves an orphaned document to sweep, never a row pointing at bytes
      // that no longer exist.
      for (const file of ownedFiles) {
        await File.purgeStoredResources(file);
      }

      // Mark verification code as used (if transaction succeeded)
      verificationCode.used = true;
      await verificationCode.save();
    } catch (transactionError) {
      console.error(
        "Transaction failed during account deletion:",
        transactionError,
      );
      throw transactionError;
    } finally {
      await session.endSession();
    }

    // Clear the authentication cookie
    const response = NextResponse.json(
      {
        success: true,
        message:
          "Your account has been permanently deleted. We're sorry to see you go.",
      },
      { status: 200 },
    );

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Confirm deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error. Account deletion failed." },
      { status: 500 },
    );
  }
}
