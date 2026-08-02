import mongoose, { Document, Schema, Model } from "mongoose";

export interface IActivityLog extends Document {
  userId: string | null;
  email: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  createdAt: Date;
}

export interface IActivityLogModel extends Model<IActivityLog> {
  listLogs(options: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
  }): Promise<{ logs: IActivityLog[]; total: number; page: number; totalPages: number }>;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: String,
      default: null,
      index: true,
    },
    email: {
      type: String,
      default: null,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      default: null,
    },
    entityId: {
      type: String,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ createdAt: -1 });
// Auto-clean logs after 30 days
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

activityLogSchema.statics.listLogs = async function (
  options: {
    page?: number;
    limit?: number;
    action?: string;
    search?: string;
  } = {},
) {
  const { page = 1, limit = 30, action, search } = options;

  const query: any = {};
  if (action) query.action = action;
  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { action: { $regex: search, $options: "i" } },
    ];
  }

  const [logs, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    this.countDocuments(query),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const ActivityLog = (mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog, IActivityLogModel>(
    "ActivityLog",
    activityLogSchema,
  )) as IActivityLogModel;
