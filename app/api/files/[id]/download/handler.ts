import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import { env } from "@/lib/env";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  verifyOwnership,
} from "@/lib/auth";
import { isFolderUnlocked } from "@/lib/vault";
import { buildDownloadResponse } from "@/lib/download-file";

async function validateFileAccess(request: NextRequest, file: { folder: unknown }) {
  // Files inside hidden chains are only downloadable when the chain is unlocked.
  if (file.folder) {
    const folder = await Folder.findById(file.folder).catch(() => null);
    if (folder && !(await isFolderUnlocked(request, folder))) {
      return false;
    }
  }
  return true;
}

export async function handleDownload(request: NextRequest, paramsPromise: Promise<{ id: string }>) {
  try {
    const { id: fileId } = await paramsPromise;
    if (!fileId || fileId.length !== 24) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Signed short-lived token (minted by /signed-download) allows
    // cookie-less access for external viewers such as Google Docs Viewer.
    const token = new URL(request.url).searchParams.get("token");
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET, {
          algorithms: ["HS256"],
        }) as { fid?: unknown };
        if (decoded.fid === fileId) {
          await connectToDatabase();
          const file = await File.findById(fileId);
          if (!file || file.deletedAt) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
          }
          return buildDownloadResponse(request, file);
        }
      } catch {
        // Invalid/expired token — fall through to normal auth
      }
    }

    const user = await requireAuth(request);
    await connectToDatabase();

    const file = await File.findById(fileId);
    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (!(await verifyOwnership(user.id, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    if (!(await validateFileAccess(request, file))) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return buildDownloadResponse(request, file);
  } catch (error) {
    console.error("Download error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
