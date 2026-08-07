import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFileVersion extends Document {
  _id: Types.ObjectId;
  file: Types.ObjectId; // parent File
  owner: Types.ObjectId;
  version: number; // 1-based; the live file holds currentVersion
  fileId: string; // Telegram file_id
  telegramFilePath?: string | null;
  telegramMessageId?: string | null;
  size: number;
  mime: string;
  originalExt?: string | null;
  note?: string | null;
  createdAt: Date;
}

export type IFileVersionModel = mongoose.Model<IFileVersion>;

const fileVersionSchema = new Schema<IFileVersion>({
  file: {
    type: Schema.Types.ObjectId,
    ref: "File",
    required: [true, "Parent file is required"],
    index: true,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner is required"],
    index: true,
  },
  version: {
    type: Number,
    required: [true, "Version number is required"],
    min: 1,
  },
  fileId: {
    type: String,
    required: [true, "Telegram file ID is required"],
    unique: true,
    index: true,
  },
  telegramFilePath: {
    type: String,
    default: null,
  },
  telegramMessageId: {
    type: String,
    default: null,
  },
  size: {
    type: Number,
    required: [true, "File size is required"],
    min: 0,
  },
  mime: {
    type: String,
    required: [true, "MIME type is required"],
    trim: true,
    lowercase: true,
  },
  originalExt: {
    type: String,
    default: null,
  },
  note: {
    type: String,
    default: null,
    maxlength: [500, "Note must be less than 500 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

fileVersionSchema.index({ file: 1, version: -1 });
fileVersionSchema.index({ owner: 1, createdAt: -1 });

fileVersionSchema.virtual("id").get(function (this: IFileVersion) {
  return (this._id as Types.ObjectId).toHexString();
});

fileVersionSchema.set("toJSON", {
  virtuals: true,
  transform: function (_doc: unknown, ret) {
    const json = ret as unknown as Record<string, unknown>;
    delete json._id;
    delete json.__v;
    return json;
  },
});

export const FileVersion =
  (mongoose.models.FileVersion as unknown as IFileVersionModel) ||
  (mongoose.model<IFileVersion, IFileVersionModel>(
    "FileVersion",
    fileVersionSchema,
  ) as IFileVersionModel);
