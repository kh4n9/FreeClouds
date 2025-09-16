import { NextRequest } from "next/server";
import { connectToDatabase } from "./db";
import { verifyJwt, extractTokenFromRequest, JwtPayload } from "./jwt";
import { User } from "@/models/User";
import { env } from "./env";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
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

    if (!user) {
      return null;
    }

    return {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
      role: user.role,
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
export async function verifyOwnership<T extends { owner: any }>(
  userId: string,
  resource: T | null,
): Promise<boolean> {
  if (!resource) {
    return false;
  }

  return resource.owner.toString() === userId;
}

// Rate limiting helpers
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export function createRateLimitError() {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      code: "RATE_LIMIT_EXCEEDED",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "300",
      },
    },
  );
}

export function getClientIp(request: NextRequest): string {
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
  console.log("requireAdmin: Starting admin check...");
  const user = await requireAuth(request);
  console.log("requireAdmin: User from requireAuth:", user);

  // Check if user is admin
  await connectToDatabase();
  console.log("requireAdmin: Connected to database, checking user role...");
  const userDoc = await User.findById(user.id);
  console.log(
    "requireAdmin: User document:",
    userDoc
      ? { id: userDoc._id, role: userDoc.role, isActive: userDoc.isActive }
      : null,
  );

  if (!userDoc || userDoc.role !== "admin") {
    console.log("requireAdmin: Access denied - not admin");
    throw new AuthError("Admin access required", 403);
  }

  console.log("requireAdmin: Admin access granted");
  return user;
}

export async function isAdmin(request: NextRequest): Promise<boolean> {
  try {
    console.log("isAdmin: Checking if user is admin...");
    const user = await getUserFromRequest(request);
    if (!user) {
      console.log("isAdmin: No user found");
      return false;
    }

    await connectToDatabase();
    const userDoc = await User.findById(user.id);
    console.log(
      "isAdmin: User document:",
      userDoc
        ? { id: userDoc._id, role: userDoc.role, isActive: userDoc.isActive }
        : null,
    );

    const result = userDoc?.role === "admin" && userDoc?.isActive === true;
    console.log("isAdmin: Result:", result);
    return result;
  } catch (error) {
    console.error("isAdmin: Error:", error);
    return false;
  }
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
