import { NextRequest, NextResponse } from "next/server";
import { createLogoutCookie } from "@/lib/jwt";
import { validateOrigin, createCsrfError } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return createCsrfError();
    }

    // Create response
    const response = new NextResponse(null, { status: 204 });

    // Clear the authentication cookie
    response.headers.set("Set-Cookie", createLogoutCookie());

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      { error: "Logout failed. Please try again." },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
