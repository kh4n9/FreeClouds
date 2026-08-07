import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/ratelimit";
import { logAction } from "@/lib/activity-log";
import { getRequestBaseUrl } from "@/lib/url";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    await connectToDatabase();

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        enabled: Boolean(userDoc.webdavTokenHash),
        createdAt: userDoc.webdavTokenCreatedAt || null,
        webdavUrl: `${getRequestBaseUrl(request)}/webdav`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Get WebDAV status error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to get WebDAV status" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);

    const limit = await checkRateLimit(request, RATE_LIMITS.AUTH);
    if (!limit.allowed) return createRateLimitResponse(limit.remaining, limit.resetTime);

    await connectToDatabase();

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a strong random token (once; never shown again afterwards).
    // bcrypt cost is lower than for passwords: the token is a 192-bit random
    // secret, so it cannot be brute-forced; cost 7 keeps creation snappy.
    const token = crypto.randomBytes(24).toString("base64url");
    userDoc.webdavTokenHash = await bcrypt.hash(token, 7);
    userDoc.webdavTokenCreatedAt = new Date();
    await userDoc.save();

    await logAction("webdav.token.create", {
      userId: user.id,
      email: user.email,
      metadata: {},
      request,
    });

    return NextResponse.json({ token, webdavUrl: `${getRequestBaseUrl(request)}/webdav` }, { status: 201 });
  } catch (error) {
    console.error("Create WebDAV token error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to create WebDAV token" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const userDoc = await User.findById(user.id);
    if (!userDoc) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    userDoc.webdavTokenHash = null;
    userDoc.webdavTokenCreatedAt = null;
    await userDoc.save();

    await logAction("webdav.token.revoke", {
      userId: user.id,
      email: user.email,
      metadata: {},
      request,
    });

    return NextResponse.json({ revoked: true }, { status: 200 });
  } catch (error) {
    console.error("Revoke WebDAV token error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to revoke WebDAV token" }, { status: 500 });
  }
}
