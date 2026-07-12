import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse, validateOrigin, createCsrfError } from "@/lib/auth";
import { telegramAPI } from "@/lib/telegram";

export async function handleChunk(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const formData = await request.formData();
    const chunkData = formData.get("chunk") as File | null;
    const chunkedId = formData.get("chunkedId") as string | null;
    const chunkIndexStr = formData.get("chunkIndex") as string | null;
    const totalChunksStr = formData.get("totalChunks") as string | null;
    const originalName = formData.get("originalName") as string | null;
    const originalMime = formData.get("originalMime") as string | null;
    const folderIdParam = formData.get("folderId") as string | null;

    if (!chunkData || !chunkedId || !chunkIndexStr || !totalChunksStr || !originalName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const chunkIndex = parseInt(chunkIndexStr);
    const totalChunks = parseInt(totalChunksStr);
    if (isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ error: "Invalid chunk index or total" }, { status: 400 });
    }

    const buffer = Buffer.from(await chunkData.arrayBuffer());
    const chunkFileName = `${originalName}.part${chunkIndex + 1}`;

    let telegramResponse;
    try {
      telegramResponse = await telegramAPI.sendDocument(buffer, chunkFileName, originalMime || "application/octet-stream");
    } catch (error) {
      console.error("Chunk Telegram upload failed:", error);
      return NextResponse.json({ error: "Chunk upload failed" }, { status: 500 });
    }

    const folderId = folderIdParam && folderIdParam !== "null" ? folderIdParam : null;

    const chunkRecord = new (File as any)({
      name: chunkFileName,
      size: buffer.length,
      mime: originalMime || "application/octet-stream",
      fileId: telegramResponse.document.file_id,
      owner: user.id,
      folder: folderId,
      chunkedId,
      chunkIndex,
      totalChunks,
    });
    await chunkRecord.save();

    return NextResponse.json({
      chunkIndex,
      chunkedId,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Chunk upload error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Chunk upload failed", details: msg }, { status: 500 });
  }
}
