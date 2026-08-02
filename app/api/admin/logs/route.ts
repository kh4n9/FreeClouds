import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin, AuthError, createAuthResponse } from "@/lib/auth";
import { ActivityLog } from "@/models/ActivityLog";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10) || 30));
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search") || undefined;

    const result = await (ActivityLog as any).listLogs({ page, limit, action, search });

    const logs = result.logs.map((log: any) => ({
      id: log._id.toString(),
      userId: log.userId,
      email: log.email,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: log.metadata,
      ip: log.ip,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      logs,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    }, { status: 200 });
  } catch (error) {
    console.error("Activity logs error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json({ error: "Failed to load activity logs" }, { status: 500 });
  }
}
