import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { File } from "@/models/File";
import { requireAuth, AuthError, createAuthResponse, validateOrigin, createCsrfError } from "@/lib/auth";
import { telegramAPI, TelegramError } from "@/lib/telegram";
import { getSystemSettings } from "@/lib/settings";

export async function handleChunk(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAuth(request);
    await connectToDatabase();

    const startTime = Date.now();

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
    // Strip original extension from chunk name to avoid Telegram blocking
    // The original extension is restored in the complete handler
    const safeName = originalName.replace(/\.[^/.]+$/, "");
    const chunkFileName = `${safeName}.part${chunkIndex + 1}`;

    // Quota check: reject chunks that would push the user over the storage
    // limit before they are uploaded to Telegram (the complete handler
    // performs the authoritative final check).
    const userStats = await File.getStorageUsage(user.id);
    const settings = await getSystemSettings();
    const uploadedForChunkedId = await File.aggregate([
      {
        $match: { owner: user.id, chunkedId, chunkIndex: { $gte: 0 } },
      },
      {
        $group: { _id: null, total: { $sum: "$size" } },
      },
    ]);
    const existingChunkBytes = uploadedForChunkedId[0]?.total || 0;
    if ((userStats.totalSize || 0) + existingChunkBytes + buffer.length > settings.storageLimit) {
      return NextResponse.json(
        { error: "Storage limit exceeded" },
        { status: 413 },
      );
    }

    let telegramResponse;
    try {
      telegramResponse = await telegramAPI.sendDocument(buffer, chunkFileName, originalMime || "application/octet-stream");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const isRateLimit = error instanceof TelegramError && error.errorCode === 429;
      console.error(`Chunk ${chunkIndex + 1}/${totalChunks} Telegram upload failed:`, msg);
      return NextResponse.json({
        error: `Chunk upload failed: ${msg}`,
        retryable: isRateLimit,
      }, { status: isRateLimit ? 429 : 500 });
    }

    const elapsed = Date.now() - startTime;
    console.log(`Chunk ${chunkIndex + 1}/${totalChunks} uploaded in ${elapsed}ms (${buffer.length} bytes)`);

    const folderId = folderIdParam && folderIdParam !== "null" ? folderIdParam : null;

    // Upsert — prevent duplicate chunk records from parallel uploads + retries
    await File.findOneAndUpdate(
      { chunkedId, chunkIndex, owner: user.id },
      {
        name: chunkFileName,
        size: buffer.length,
        mime: originalMime || "application/octet-stream",
        fileId: telegramResponse.document.file_id,
        telegramMessageId: telegramResponse.message_id,
        owner: user.id,
        folder: folderId,
        chunkedId,
        chunkIndex,
        totalChunks,
        deletedAt: null,
        telegramFilePath: null,
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({
      chunkIndex,
      chunkedId,
      success: true,
      elapsed,
    }, { status: 201 });
  } catch (error) {
    console.error("Chunk upload error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Chunk upload failed", details: msg }, { status: 500 });
  }
}
