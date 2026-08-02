import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { ShareLink } from "@/models/ShareLink";
import { File } from "@/models/File";
import { buildDownloadResponse } from "@/lib/download-file";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "@/lib/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const rateLimit = checkRateLimit(request, RATE_LIMITS.DOWNLOAD);
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);

    const { token } = await params;
    if (!token || token.length < 8 || token.length > 128) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    await connectToDatabase();

    const share = await ShareLink.findByToken(token);
    if (!share || !share.isValid()) {
      return NextResponse.json(
        { error: "Share link not found or expired", code: "SHARE_UNAVAILABLE" },
        { status: 404 },
      );
    }

    const file = await File.findById(share.file);
    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Password-protected share: require the password in the x-share-password header
    if (share.passwordHash) {
      const password = request.headers.get("x-share-password") || "";
      if (!password) {
        return NextResponse.json(
          { error: "This share is password protected", code: "SHARE_PASSWORD_REQUIRED" },
          { status: 401 },
        );
      }
      const valid = await bcrypt.compare(password, share.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Incorrect password", code: "SHARE_PASSWORD_INCORRECT" },
          { status: 401 },
        );
      }
    }

    // Increment download count (fire-and-forget; best-effort)
    ShareLink.updateOne({ _id: share._id }, { $inc: { downloadCount: 1 } }).catch(() => {});

    return buildDownloadResponse(request, file);
  } catch (error) {
    console.error("Share download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
