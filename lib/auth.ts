import { NextRequest } from "next/server";
import { connectToDatabase } from "./db";
import { verifyJwt, extractTokenFromRequest } from "./jwt";
import { User } from "@/models/User";
import { env } from "./env";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  avatar?: string | null;
}

export async function getUserFromRequest(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    const token = extractTokenFromRequest(request);
    if (!token) {
      return null;
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(payload.userId).select("-passwordHash");

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: String(user._id),
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerified: Boolean(user.emailVerified),
      avatar: user.avatarFileId
        ? "/api/user/avatar?v=" + (user.avatarUpdatedAt?.getTime() || Date.now())
        : user.avatar || null,
    };
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromRequest(request);

  if (!user) {
    throw new AuthError("Authentication required", 401);
  }

  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function createAuthResponse(error: AuthError) {
  return new Response(
    JSON.stringify({
      error: error.message,
      code: "UNAUTHORIZED",
    }),
    {
      status: error.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow same-origin requests
  if (!origin && !referer) {
    return true;
  }

  // In development, allow any localhost origin
  if (env.NODE_ENV === "development") {
    let checkOrigin = origin;
    if (!checkOrigin && referer) {
      try { checkOrigin = new URL(referer).origin; } catch {}
    }
    if (checkOrigin && (checkOrigin.startsWith("http://localhost:") || checkOrigin.startsWith("http://127.0.0.1:"))) {
      return true;
    }
  }

  const allowedOrigins = [env.ALLOWED_ORIGIN];

  if (origin && allowedOrigins.includes(origin)) {
    return true;
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      return allowedOrigins.includes(refererOrigin);
    } catch {
      return false;
    }
  }

  return false;
}

export function createCsrfError() {
  return new Response(
    JSON.stringify({
      error: "Invalid origin",
      code: "CSRF_ERROR",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

// Helper to check if user owns a resource
export async function verifyOwnership<T extends { owner: { toString(): string } }>(
  userId: string,
  resource: T | null,
): Promise<boolean> {
  if (!resource) {
    return false;
  }

  return resource.owner.toString() === userId;
}

// Rate limiting lives in lib/ratelimit.ts.
//
// This module used to carry a second, independent limiter
// (checkRateLimit/createRateLimitError over its own in-memory Map) alongside
// it. Two implementations meant two behaviours and two error shapes, and only
// one of them was reachable from most routes. getClientIp() below is kept here
// because lib/ratelimit.ts imports it.

export function getClientIp(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const xRealIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }

  if (xRealIp) {
    return xRealIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return "unknown";
}

// Admin-specific authentication functions
export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);

  await connectToDatabase();
  const userDoc = await User.findById(user.id);

  if (!userDoc || userDoc.role !== "admin" || !userDoc.isActive) {
    throw new AuthError("Admin access required", 403);
  }

  return user;
}

export function createForbiddenResponse() {
  return new Response(
    JSON.stringify({
      error: "Insufficient permissions",
      code: "FORBIDDEN",
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

/**
 * Server-component helper: return the dashboard path a logged-in user
 * should be redirected to on the public homepage (`/dashboard` for users,
 * `/admin` for admins), or null when not authenticated.
 */
export async function getLoggedInRedirectPath(
  basePath: string = "",
): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get("token")?.value;
  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload) return null;

  await connectToDatabase();
  const user = await User.findById(payload.userId).select("role isActive");
  if (!user || !user.isActive) return null;

  return user.role === "admin" ? `${basePath}/admin` : `${basePath}/dashboard`;
}
