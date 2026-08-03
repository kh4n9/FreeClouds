import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { env } from "@/lib/env";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  verifyOwnership,
} from "@/lib/auth";

const SIGNED_URL_TTL = "10m";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId } = await params;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    const file = await File.findById(fileId);
    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Short-lived token scoped to this file, so external viewers
    // (e.g. Google Docs Viewer) can fetch the download without cookies.
    const token = jwt.sign({ fid: fileId }, env.JWT_SECRET, {
      expiresIn: SIGNED_URL_TTL,
      algorithm: "HS256",
    });

    return NextResponse.json({
      url: `/api/files/${fileId}/download?token=${token}`,
    });
  } catch (error) {
    console.error("Signed download error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to create download link" }, { status: 500 });
  }
}
