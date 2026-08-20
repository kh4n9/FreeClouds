import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { ShareLink } from "@/models/ShareLink";
import { File } from "@/models/File";
import { Folder } from "@/models/Folder";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  verifyOwnership,
} from "@/lib/auth";
import { isFolderUnlocked } from "@/lib/vault";

const createSchema = z.object({
  password: z.string().min(1).max(200).nullable().optional(),
  expiresAt: z
    .string()
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || !isNaN(Date.parse(v)), {
      message: "Invalid expiration date",
    }),
  maxDownloads: z.number().int().min(1).max(100000).nullable().optional(),
});

export async function POST(
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

    // Files inside a locked hidden chain must not be shared publicly.
    if (file.folder) {
      const folder = await Folder.findById(file.folder).catch(() => null);
      if (folder && !(await isFolderUnlocked(request, folder))) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const body = await request.json().catch(() => ({}));
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const { password, expiresAt, maxDownloads } = validation.data;

    let share = await ShareLink.findOne({ file: fileId, owner: user.id, isActive: true });

    if (!share) {
      share = new ShareLink({
        token: crypto.randomBytes(9).toString("base64url"),
        file: fileId,
        owner: user.id,
      });
    }

    if (password !== undefined) {
      share.passwordHash = password ? await bcrypt.hash(password, 10) : null;
    }
    if (expiresAt !== undefined) {
      share.expiresAt = expiresAt ? new Date(expiresAt) : null;
    }
    if (maxDownloads !== undefined) {
      share.maxDownloads = maxDownloads;
    }
    share.downloadCount = share.downloadCount || 0;
    share.isActive = true;

    await share.save();

    return NextResponse.json(
      {
        token: share.token,
        url: `/s/${share.token}`,
        hasPassword: Boolean(share.passwordHash),
        expiresAt: share.expiresAt,
        maxDownloads: share.maxDownloads,
        downloadCount: share.downloadCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Create share error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
  }
}

export async function DELETE(
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

    const share = await ShareLink.findOne({ file: fileId, owner: user.id, isActive: true });
    if (!share) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    share.isActive = false;
    await share.save();

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Delete share error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to revoke share link" }, { status: 500 });
  }
}
