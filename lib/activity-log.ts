import { connectToDatabase } from "./db";
import { ActivityLog } from "@/models/ActivityLog";
import { getClientIp } from "./auth";
import type { NextRequest } from "next/server";

export interface LogContext {
  userId?: string | null;
  email?: string | null;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}

/**
 * Fire-and-forget activity logging. Never throws — failures are swallowed
 * so logging can never break a request.
 */
export async function logAction(action: string, ctx: LogContext = {}): Promise<void> {
  try {
    await connectToDatabase();
    await ActivityLog.create({
      userId: ctx.userId ?? null,
      email: ctx.email ?? null,
      action,
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      metadata: ctx.metadata ?? null,
      ip: ctx.request ? getClientIp(ctx.request) : null,
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
}
