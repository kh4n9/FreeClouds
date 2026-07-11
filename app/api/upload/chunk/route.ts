import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { handleChunk } = await import("./handler");
    return handleChunk(request);
  } catch (error) {
    console.error("Chunk upload error:", error);
    return NextResponse.json({ error: "Chunk upload failed" }, { status: 500 });
  }
}
