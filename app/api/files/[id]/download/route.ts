import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { handleDownload } = await import("./handler");
    return handleDownload(request, params);
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
