import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Folder } from "@/models/Folder";
import VerificationCode from "@/models/VerificationCode";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
  checkRateLimit,
  createRateLimitError,
  getClientIp,
} from "@/lib/auth";
import { generateVerificationCode, sendVaultPinResetEmail } from "@/lib/email";

const recoverSchema = z.object({
  folderId: z.string().length(24),
});

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();

    if (
      !checkRateLimit(
        `vault-recover:${getClientIp(request)}`,
        3,
        15 * 60 * 1000,
      )
    ) {
      return createRateLimitError();
    }

    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const validation = recoverSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { folderId } = validation.data;

    const folder = await Folder.findOne({ _id: folderId, owner: user.id });
    if (!folder || !folder.isHidden || !folder.pinHash) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Invalidate any existing vault PIN reset codes for this email
    await VerificationCode.invalidateUserCodes(user.email, "vault_pin_reset");

    // Generate and persist a new code
    const code = generateVerificationCode();
    const verificationCode = new VerificationCode({
      email: user.email,
      code,
      type: "vault_pin_reset",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    });
    await verificationCode.save();

    const emailSent = await sendVaultPinResetEmail(
      user.email,
      code,
      folder.name,
    );

    if (!emailSent) {
      await VerificationCode.findByIdAndDelete(verificationCode._id);
      return NextResponse.json(
        { error: "Failed to send email. Please try again later." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "A recovery code has been sent to your email.",
        ...(process.env.NODE_ENV === "development" ? { code } : {}),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Vault recover request error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to request PIN recovery" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}