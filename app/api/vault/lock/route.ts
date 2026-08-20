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
} from "@/lib/auth";
import {
  removeVaultFolder,
} from "@/lib/vault";

const lockSchema = z.object({
  folderId: z.string().length(24),
});

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();

    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const validation = lockSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { folderId } = validation.data;

    const folder = await Folder.findOne({ _id: folderId, owner: user.id });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Locking an unlocked hidden chain re-locks everything beneath it by
    // removing the hidden root from the vault cookie.
    const response = new NextResponse(
      JSON.stringify({ id: folderId, locked: true }),
      { status: 200 },
    );
    response.headers.set(
      "Set-Cookie",
      removeVaultFolder(request, folderId),
    );

    return response;
  } catch (error) {
    console.error("Vault lock error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to lock folder" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}