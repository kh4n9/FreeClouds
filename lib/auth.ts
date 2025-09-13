import { NextRequest } from "next/server";
import { connectToDatabase } from "./db";
import { verifyJwt, extractTokenFromRequest, JwtPayload } from "./jwt";
import { User } from "@/models/User";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthUser | null> {
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
      id: user._id.toString(),
      email: user.email,
      name: user.name,
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
    public statusCode: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function createAuthResponse(error: AuthError) {
  return new Response(
    JSON.stringify({
      error: error.message,
      code: "UNAUTHORIZED"
    }),
    {
      status: error.statusCode,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow same-origin requests
  if (!origin && !referer) {
    return true;
  }

  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN || "http://localhost:3000",
  ];

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
      code: "CSRF_ERROR"
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

// Helper to check if user owns a resource
export async function verifyOwnership<T extends { owner: any }>(
  userId: string,
  resource: T | null
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
  windowMs: number
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
      code: "RATE_LIMIT_EXCEEDED"
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "300",
      },
    }
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
