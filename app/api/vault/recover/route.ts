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
import {
  isValidPin,
  hashPin,
  addVaultFolder,
} from "@/lib/vault";

const recoverSchema = z.object({
  folderId: z.string().length(24),
  code: z.string().length(6),
  newPin: z.string().min(4).max(8).regex(/^\d+$/, "PIN must be digits only"),
});

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();

    if (
      !checkRateLimit(
        `vault-recover:${getClientIp(request)}`,
        5,
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
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }

    const { folderId, code, newPin } = validation.data;
    if (!isValidPin(newPin)) {
      return NextResponse.json(
        { error: "PIN must be 4-8 digits" },
        { status: 400 },
      );
    }

    const folder = await Folder.findOne({ _id: folderId, owner: user.id });
    if (!folder || !folder.isHidden) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Verify the emailed code
    const validCode = await VerificationCode.findValidCode(
      user.email,
      code,
      "vault_pin_reset",
    );
    if (!validCode) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    // Invalidate all codes for this user + type
    await VerificationCode.invalidateUserCodes(user.email, "vault_pin_reset");

    // Set the new PIN and unlock the folder in the same response
    folder.pinHash = await hashPin(newPin);
    await folder.save();

    const response = new NextResponse(
      JSON.stringify({
        id: folder._id.toString(),
        name: folder.name,
        parent: folder.parent?.toString() || null,
        unlocked: true,
      }),
      { status: 200 },
    );
    response.headers.set("Set-Cookie", addVaultFolder(request, folderId));

    return response;
  } catch (error) {
    console.error("Vault recover error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to recover PIN" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}