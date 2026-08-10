import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ShareLink } from "@/models/ShareLink";
import { File } from "@/models/File";
import "@/models/User";
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "@/lib/ratelimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const rateLimit = checkRateLimit(request, RATE_LIMITS.API, "shares");
    if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime, rateLimit.maxRequests);

    const { token } = await params;
    if (!token || token.length < 8 || token.length > 128) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 });
    }

    await connectToDatabase();

    const share = await ShareLink.findByToken(token);
    if (!share || !share.isValid()) {
      return NextResponse.json({ error: "Share link not found or expired" }, { status: 404 });
    }

    const file = await File.findById(share.file);
    if (!file || file.deletedAt) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const owner = await share
      .populate("owner", "name")
      .then((s) => s.owner as unknown as { name?: string } | null);

    return NextResponse.json(
      {
        token: share.token,
        name: file.name,
        displayName: file.originalExt
          ? file.name.replace(/\.bin$/i, "") + file.originalExt
          : file.name,
        size: file.size,
        mime: file.mime,
        hasPassword: Boolean(share.passwordHash),
        expiresAt: share.expiresAt,
        downloadCount: share.downloadCount,
        maxDownloads: share.maxDownloads,
        ownerName: owner?.name || "Free Clouds user",
        createdAt: file.createdAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get share error:", error);
    return NextResponse.json({ error: "Failed to load share link" }, { status: 500 });
  }
}
