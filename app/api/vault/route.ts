import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { Folder } from "@/models/Folder";
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
  getVaultEntries,
  verifyPin,
  addVaultFolder,
} from "@/lib/vault";

const unlockSchema = z.object({
  folderId: z.string().length(24),
  pin: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const entries = await getVaultEntries(request, user.id);
    return NextResponse.json(entries, { status: 200 });
  } catch (error) {
    console.error("Get vault error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to get vault" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();

    if (
      !checkRateLimit(
        `vault-unlock:${getClientIp(request)}`,
        20,
        60 * 1000,
      )
    ) {
      return createRateLimitError();
    }

    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const validation = unlockSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { folderId, pin = "" } = validation.data;

    const folder = await Folder.findOne({ _id: folderId, owner: user.id });
    if (!folder || !folder.isHidden) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Hidden folders without a PIN unlock instantly; with a PIN the PIN
    // must match.
    if (folder.pinHash) {
      if (!pin) {
        return NextResponse.json(
          { error: "PIN required" },
          { status: 400 },
        );
      }
      if (!(await verifyPin(pin, folder.pinHash))) {
        return NextResponse.json(
          { error: "Incorrect PIN" },
          { status: 403 },
        );
      }
    }

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
    console.error("Vault unlock error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to unlock folder" }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}