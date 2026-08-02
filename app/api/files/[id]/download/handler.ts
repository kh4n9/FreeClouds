import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  verifyOwnership,
} from "@/lib/auth";
import { buildDownloadResponse } from "@/lib/download-file";

export async function handleDownload(request: NextRequest, paramsPromise: Promise<{ id: string }>) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const { id: fileId } = await paramsPromise;
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

    return buildDownloadResponse(request, file);
  } catch (error) {
    console.error("Download error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
