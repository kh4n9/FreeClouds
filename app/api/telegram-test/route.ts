import { NextRequest, NextResponse } from "next/server";
import { telegramAPI } from "@/lib/telegram";
import { requireAuth, AuthError, createAuthResponse } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const tests = [];

    // Test 1: Verify bot token
    try {
      const botValid = await telegramAPI.verifyBotToken();
      tests.push({
        test: "Bot Token Verification",
        status: botValid ? "✅ PASS" : "❌ FAIL",
        details: botValid ? "Bot token is valid" : "Bot token is invalid or network issue"
      });
    } catch (error) {
      tests.push({
        test: "Bot Token Verification",
        status: "❌ ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 2: Test chat access
    try {
      const chatValid = await telegramAPI.testChatAccess();
      tests.push({
        test: "Chat Access Test",
        status: chatValid ? "✅ PASS" : "❌ FAIL",
        details: chatValid ? "Bot has access to the specified chat" : "Chat not found or bot doesn't have access"
      });
    } catch (error) {
      tests.push({
        test: "Chat Access Test",
        status: "❌ ERROR",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }

    // Test 3: Environment variables check
    const envVars = {
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN ? "Set" : "Missing",
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID ? "Set" : "Missing",
      TELEGRAM_API_BASE: process.env.TELEGRAM_API_BASE ? "Set" : "Missing (using default)"
    };

    tests.push({
      test: "Environment Variables",
      status: Object.values(envVars).every(v => v === "Set" || v.includes("default")) ? "✅ PASS" : "❌ FAIL",
      details: envVars
    });

    return NextResponse.json({
      success: true,
      message: "Telegram configuration test completed",
      tests,
      recommendations: [
        "If bot token fails: Check TELEGRAM_BOT_TOKEN in .env.local",
        "If chat access fails: Ensure bot is added to the chat/channel with appropriate permissions",
        "For private chats: Start a conversation with the bot first",
        "For groups/channels: Add bot as admin with 'Send Messages' permission",
        "Get your chat ID by messaging @userinfobot or @get_id_bot"
      ]
    });

  } catch (error) {
    console.error("Telegram test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to run Telegram tests",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
