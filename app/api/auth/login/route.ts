import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { signJwt, createAuthCookie } from "@/lib/jwt";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/ratelimit";
import { validateOrigin, createCsrfError } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return createCsrfError();
    }

    // Rate limiting
    const rateLimit = checkRateLimit(request, RATE_LIMITS.AUTH);
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit.remaining, rateLimit.resetTime);
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    const { email, password } = validation.data;

    // Connect to database
    await connectToDatabase();

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Generate JWT token
    const token = signJwt({
      userId: (user._id as any).toString(),
      email: user.email,
    });

    // Create response with user data
    const userData = {
      id: (user._id as any).toString(),
      email: user.email,
      name: user.name,
    };

    const response = NextResponse.json(userData, { status: 200 });

    // Set HTTP-only cookie
    response.headers.set("Set-Cookie", createAuthCookie(token));

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 },
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
