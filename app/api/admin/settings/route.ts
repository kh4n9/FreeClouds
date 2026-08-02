import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, createAuthResponse, validateOrigin, createCsrfError } from "@/lib/auth";
import { getSystemSettings, updateSystemSettings } from "@/lib/settings";
import { logAction } from "@/lib/activity-log";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    const settings = await getSystemSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Get settings error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();
    const user = await requireAdmin(request);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const patch: any = {};
    if (typeof body.allowRegistration === "boolean") {
      patch.allowRegistration = body.allowRegistration;
    }
    if (body.storageLimit !== undefined) {
      const limit = Number(body.storageLimit);
      if (!Number.isFinite(limit) || limit <= 0) {
        return NextResponse.json({ error: "Invalid storage limit" }, { status: 400 });
      }
      patch.storageLimit = Math.floor(limit);
    }
    if (typeof body.siteName === "string") {
      patch.siteName = body.siteName;
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid settings provided" }, { status: 400 });
    }

    const settings = await updateSystemSettings(patch);

    await logAction("admin.settings.update", {
      userId: user.id,
      email: user.email,
      metadata: { patch: Object.keys(patch) },
      request,
    });

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error("Update settings error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
