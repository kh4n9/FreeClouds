import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IShareLink extends Document {
  _id: Types.ObjectId;
  token: string;
  file: Types.ObjectId;
  owner: Types.ObjectId;
  passwordHash: string | null;
  expiresAt: Date | null;
  maxDownloads: number | null;
  downloadCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  isExpired(): boolean;
  isMaxedOut(): boolean;
  isValid(): boolean;
}

export interface IShareLinkModel extends Model<IShareLink> {
  findByToken(token: string): Promise<IShareLink | null>;
  findByFileAndOwner(
    fileId: string,
    ownerId: string,
  ): Promise<IShareLink | null>;
}

const shareLinkSchema = new Schema<IShareLink>(
  {
    token: {
      type: String,
      required: [true, "Token is required"],
      unique: true,
      index: true,
    },
    file: {
      type: Schema.Types.ObjectId,
      ref: "File",
      required: [true, "File is required"],
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      index: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    maxDownloads: {
      type: Number,
      default: null,
      min: 1,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for listing shares of a file
shareLinkSchema.index({ file: 1, owner: 1 });

shareLinkSchema.methods.isExpired = function (): boolean {
  return this.expiresAt !== null && this.expiresAt !== undefined
    ? new Date() > this.expiresAt
    : false;
};

shareLinkSchema.methods.isMaxedOut = function (): boolean {
  return (
    this.maxDownloads !== null &&
    this.maxDownloads !== undefined &&
    this.downloadCount >= this.maxDownloads
  );
};

shareLinkSchema.methods.isValid = function (): boolean {
  return this.isActive && !this.isExpired() && !this.isMaxedOut();
};

shareLinkSchema.statics.findByToken = function (token: string) {
  return this.findOne({ token });
};

shareLinkSchema.statics.findByFileAndOwner = function (
  fileId: string,
  ownerId: string,
) {
  return this.findOne({ file: fileId, owner: ownerId, isActive: true });
};

export const ShareLink = (mongoose.models.ShareLink ||
  mongoose.model<IShareLink, IShareLinkModel>(
    "ShareLink",
    shareLinkSchema,
  )) as IShareLinkModel;
