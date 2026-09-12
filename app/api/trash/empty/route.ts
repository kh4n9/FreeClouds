import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import { logAction } from "@/lib/activity-log";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const trashedFiles = await File.find({
      owner: user.id,
      deletedAt: { $ne: null },
      $or: [
        { chunkedId: null },
        { chunkIndex: -1 },
      ],
    });

    let deleted = 0;
    for (const file of trashedFiles) {
      // Single purge primitive: Telegram message, Blob cache, chunk parts,
      // version rows and their messages, then the row itself.
      const result = await File.deletePermanently(file._id);
      if (result.ok) deleted++;
    }

    // Trashed folders whose contents are now gone (this is a user-initiated
    // "empty trash", so they don't get to linger until their retention date).
    await Folder.deleteMany({
      owner: user.id,
      deletedAt: { $ne: null },
    });

    await logAction("trash.empty", {
      userId: user.id,
      email: user.email,
      metadata: { deleted },
      request,
    });

    return NextResponse.json({ deleted }, { status: 200 });
  } catch (error) {
    console.error("Empty trash error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to empty trash" }, { status: 500 });
  }
}
