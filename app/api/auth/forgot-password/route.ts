import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { isValidEmail, generateVerificationCode, sendPasswordResetEmail } from '@/lib/email';
import { User } from '@/models/User';
import VerificationCode from '@/models/VerificationCode';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 5, 15 * 60 * 1000); // 5 requests per 15 minutes
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
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // For security, don't reveal if email exists or not
      return NextResponse.json(
        {
          success: true,
          message: "If this email is registered, you will receive a password reset code shortly."
        },
        { status: 200 }
      );
    }

    // Invalidate any existing password reset codes for this user
    await VerificationCode.invalidateUserCodes(email, 'password_reset');

    // Generate new verification code
    const code = generateVerificationCode();

    // Save verification code to database
    const verificationCode = new VerificationCode({
      email: email.toLowerCase(),
      code,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await verificationCode.save();

    // Send email
    const emailSent = await sendPasswordResetEmail(email, code);

    if (!emailSent) {
      // If email fails, clean up the verification code
      await VerificationCode.findByIdAndDelete(verificationCode._id);

      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 }
      );
    }

    // Log for debugging (remove in production)
    console.log(`Password reset code sent to ${email}: ${code}`);

    return NextResponse.json(
      {
        success: true,
        message: "If this email is registered, you will receive a password reset code shortly.",
        // For development only - remove in production
        ...(process.env.NODE_ENV === 'development' && { code })
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
