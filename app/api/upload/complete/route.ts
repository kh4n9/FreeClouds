import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { handleComplete } = await import("./handler");
    return handleComplete(request);
  } catch (error) {
    console.error("Complete upload error:", error);
    return NextResponse.json({ error: "Failed to complete upload" }, { status: 500 });
  }
}
