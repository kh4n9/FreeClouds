import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { verifyToken } from '@/lib/auth';
import { generateVerificationCode, sendAccountDeletionEmail } from '@/lib/email';
import { User } from '@/models/User';
import VerificationCode from '@/models/VerificationCode';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 3, 60 * 60 * 1000); // 3 requests per hour
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many deletion requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      );
    }

    // Verify authentication
    const authResult = await verifyToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = authResult.user.id;
    const userEmail = authResult.user.email;

    // Connect to database
    await connectToDatabase();

    // Verify user still exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Invalidate any existing account deletion codes for this user
    await VerificationCode.invalidateUserCodes(userEmail, 'account_deletion');

    // Generate new verification code
    const code = generateVerificationCode();

    // Save verification code to database
    const verificationCode = new VerificationCode({
      email: userEmail.toLowerCase(),
      code,
      type: 'account_deletion',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    });

    await verificationCode.save();

    // Send confirmation email
    const emailSent = await sendAccountDeletionEmail(userEmail, code);

    if (!emailSent) {
      // If email fails, clean up the verification code
      await VerificationCode.findByIdAndDelete(verificationCode._id);

      return NextResponse.json(
        { error: "Failed to send confirmation email. Please try again later." },
        { status: 500 }
      );
    }

    // Log for debugging (remove in production)
    console.log(`Account deletion code sent to ${userEmail}: ${code}`);

    return NextResponse.json(
      {
        success: true,
        message: "A confirmation code has been sent to your email. Please check your inbox to proceed with account deletion.",
        // For development only - remove in production
        ...(process.env.NODE_ENV === 'development' && { code })
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Request deletion error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
