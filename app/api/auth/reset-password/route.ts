import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import bcrypt from 'bcryptjs';
import { User } from '@/models/User';
import VerificationCode from '@/models/VerificationCode';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 10, 15 * 60 * 1000); // 10 requests per 15 minutes
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many attempts. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, code, newPassword } = body;

    // Validate input
    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, verification code, and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: "Invalid verification code format" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Find and validate verification code
    const verificationCode = await VerificationCode.findValidCode(
      email,
      code,
      'password_reset'
    );

    if (!verificationCode) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    user.passwordHash = hashedPassword;
    await user.save();

    // Mark verification code as used
    verificationCode.used = true;
    await verificationCode.save();

    // Invalidate all other password reset codes for this user
    await VerificationCode.invalidateUserCodes(email, 'password_reset');

    console.log(`Password successfully reset for user: ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset successfully. You can now log in with your new password."
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
