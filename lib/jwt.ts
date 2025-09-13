import jwt from "jsonwebtoken";
import { env } from "./env";

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function signJwt(payload: Omit<JwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      console.warn("Invalid JWT token:", error.message);
    } else if (error instanceof jwt.TokenExpiredError) {
      console.warn("JWT token expired:", error.message);
    } else {
      console.error("JWT verification error:", error);
    }
    return null;
  }
}

export function extractTokenFromRequest(request: Request): string | null {
  // Try to get token from cookie first
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = parseCookies(cookieHeader);
    if (cookies.token) {
      return cookies.token;
    }
  }

  // Fallback to Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return null;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach(cookie => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name && rest.length > 0) {
      cookies[name] = rest.join("=");
    }
  });

  return cookies;
}

export function createAuthCookie(token: string): string {
  const secure = env.NODE_ENV === "production";
  const sameSite = "lax";
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds

  return [
    `token=${token}`,
    `Max-Age=${maxAge}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=${sameSite}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function createLogoutCookie(): string {
  return [
    `token=`,
    `Max-Age=0`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=lax`,
  ].join("; ");
}
