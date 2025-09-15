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

const registerSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password too long"),
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
    const validation = registerSchema.safeParse(body);

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

    const { email, name, password } = validation.data;

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      email,
      name,
      passwordHash,
    });

    await user.save();

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

    const response = NextResponse.json(userData, { status: 201 });

    // Set HTTP-only cookie
    response.headers.set("Set-Cookie", createAuthCookie(token));

    return response;
  } catch (error) {
    console.error("Registration error:", error);

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (
        error.message.includes("E11000") ||
        error.message.includes("duplicate key")
      ) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 },
        );
      }

      if (error.name === "ValidationError") {
        return NextResponse.json(
          { error: "Invalid user data", details: error.message },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Registration failed. Please try again." },
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
