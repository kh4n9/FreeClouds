import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";
import { z } from "zod";

const deleteSchema = z.object({
  fileIds: z.array(z.string().length(24)).min(1).max(200),
});

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const body = await request.json();
    const validation = deleteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid file IDs" }, { status: 400 });
    }

    const { fileIds } = validation.data;

    const files = await File.find({
      _id: { $in: fileIds },
      owner: user.id,
      deletedAt: null,
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "No files found" }, { status: 404 });
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    let deleted = 0;
    for (const file of files) {
      await file.softDelete();
      // Also soft-delete chunks if this is a chunked parent
      if (file.chunkedId && file.totalChunks && file.totalChunks > 1) {
        await File.updateMany(
          { chunkedId: file.chunkedId, chunkIndex: { $gte: 0 }, deletedAt: null },
          { deletedAt: new Date(), trashExpiresAt: expiresAt },
        );
      }
      deleted++;
    }

    return NextResponse.json({ deleted }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to delete files" }, { status: 500 });
  }
}
