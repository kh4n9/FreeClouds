import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { telegramAPI, TelegramError } from "@/lib/telegram";
import { requireAuth, AuthError, createAuthResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    await connectToDatabase();
    const userDoc = await User.findById(user.id);

    if (!userDoc || !userDoc.avatarFileId) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const result = await telegramAPI.getFileStream(
      userDoc.avatarFileId,
      userDoc.avatarFilePath || undefined,
    );

    if (result.filePath && !userDoc.avatarFilePath) {
      User.updateOne(
        { _id: userDoc._id },
        { avatarFilePath: result.filePath },
      ).catch(() => {});
    }

    const headers = new Headers();
    headers.set("Content-Type", userDoc.avatarMime || "image/png");
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set(
      "ETag",
      `"avatar-${userDoc._id.toString()}-${
        userDoc.avatarUpdatedAt?.getTime() || 0
      }"`,
    );
    headers.set("X-Content-Type-Options", "nosniff");

    return new Response(result.stream, { status: 200, headers });
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthResponse(error);
    }
    console.error("Avatar fetch error:", error);
    if (error instanceof TelegramError) {
      return NextResponse.json(
        { error: "Avatar temporarily unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Failed to load avatar" }, { status: 500 });
  }
}
