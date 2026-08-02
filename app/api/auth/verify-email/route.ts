import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { requireAuth, AuthError, createAuthResponse } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import {
  isValidEmail,
  generateVerificationCode,
  sendVerificationEmail,
} from "@/lib/email";
import { User } from "@/models/User";
import VerificationCode from "@/models/VerificationCode";

const sendSchema = z.object({ action: z.literal("send") });
const verifySchema = z.object({
  action: z.literal("verify"),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json().catch(() => ({}));
    const { action } = body;

    if (action === "send") {
      const rateLimitResult = await rateLimit(request, 3, 15 * 60 * 1000);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: "Too many attempts. Please try again later." },
          { status: 429 },
        );
      }

      const userDoc = await User.findById(user.id);
      if (!userDoc) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (!isValidEmail(userDoc.email)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 },
        );
      }
      if (userDoc.emailVerified) {
        return NextResponse.json(
          { error: "Email is already verified" },
          { status: 400 },
        );
      }

      await VerificationCode.invalidateUserCodes(userDoc.email, "email_verification");

      const code = generateVerificationCode();
      const verificationCode = new VerificationCode({
        email: userDoc.email,
        code,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
      await verificationCode.save();

      const emailSent = await sendVerificationEmail(userDoc.email, code);
      if (!emailSent) {
        await VerificationCode.findByIdAndDelete(verificationCode._id);
        return NextResponse.json(
          { error: "Failed to send email. Please try again later." },
          { status: 500 },
        );
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (action === "verify") {
      const validation = verifySchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: "Verification code must be 6 digits" },
          { status: 400 },
        );
      }

      const userDoc = await User.findById(user.id);
      if (!userDoc) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const verificationCode = await VerificationCode.findValidCode(
        userDoc.email,
        validation.data.code,
        "email_verification",
      );
      if (!verificationCode) {
        return NextResponse.json(
          { error: "Invalid or expired verification code" },
          { status: 400 },
        );
      }

      verificationCode.used = true;
      await verificationCode.save();

      userDoc.emailVerified = true;
      await userDoc.save();

      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Verify email error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
