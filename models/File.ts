import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFile extends Document {
  name: string;
  size: number;
  mime: string;
  fileId: string; // Telegram file_id (for chunks, each chunk has its own fileId)
  telegramFilePath?: string; // cached Telegram file_path (skip getFile call on download)
  owner: Types.ObjectId;
  folder: Types.ObjectId | null;
  deletedAt: Date | null;
  createdAt: Date;
  originalExt?: string;     // restored on download when set

  // Chunked file support
  chunkedId?: string;       // group UUID shared by all chunks + parent
  chunkIndex?: number;      // 0-based index for chunks (parent = -1 or null)
  totalChunks?: number;     // total number of chunks

  // Trash support (auto-delete after 30 days)
  trashExpiresAt?: Date | null;

  // Vercel Blob cache for assembled chunked files
  blobCacheUrl?: string | null;

  // Instance methods (typed) so TypeScript recognizes document methods
  softDelete(): Promise<IFile>;
  restore(): Promise<IFile>;
  isDeleted(): boolean;
  getFolderPath(): Promise<string>;
  canBeAccessed(userId: string): boolean;
}

export interface IFileStatics {
  findByOwner(
    ownerId: string,
    options?: {
      folderId?: string | null;
      includeDeleted?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<IFile[]>;
  findByOwnerWithCount(
    ownerId: string,
    options?: {
      folderId?: string | null;
      includeDeleted?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    files: IFile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  getStorageUsage(
    ownerId: string,
  ): Promise<{ totalSize: number; totalFiles: number }>;
  findDuplicates(ownerId: string): Promise<any[]>;
}

export interface IFileModel extends mongoose.Model<IFile>, IFileStatics {
  findTrashByOwner(ownerId: string): Promise<IFile[]>;
  findTrashByOwnerWithCount(ownerId: string, page?: number, limit?: number): Promise<{ files: IFile[]; total: number; page: number; limit: number; totalPages: number }>;
  cleanupExpiredTrash(): Promise<number>;
}

const fileSchema = new Schema<IFile>({
  name: {
    type: String,
    required: [true, "File name is required"],
    trim: true,
    minlength: [1, "File name must be at least 1 character long"],
    maxlength: [255, "File name must be less than 255 characters"],
    validate: {
      validator: function (name: string) {
        // Basic file name validation
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        return !invalidChars.test(name);
      },
      message: "File name contains invalid characters",
    },
  },
  size: {
    type: Number,
    required: [true, "File size is required"],
    min: [0, "File size must be non-negative"],
  },
  mime: {
    type: String,
    required: [true, "MIME type is required"],
    trim: true,
    lowercase: true,
    match: [/^[a-z]+\/[a-z0-9\-\+\.]+$/i, "Invalid MIME type format"],
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
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner is required"],
    index: true,
  },
  folder: {
    type: Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
    index: true,
  },
  deletedAt: {
    type: Date,
    default: null,
    index: true,
  },
  trashExpiresAt: {
    type: Date,
    default: null,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  originalExt: {
    type: String,
    default: null,
  },
  chunkedId: {
    type: String,
    default: null,
    index: true,
  },
  chunkIndex: {
    type: Number,
    default: null,
  },
  totalChunks: {
    type: Number,
    default: null,
  },
  blobCacheUrl: {
    type: String,
    default: null,
  },
});

// Compound indexes for better query performance
fileSchema.index({ owner: 1, folder: 1, deletedAt: 1 });
fileSchema.index({ owner: 1, name: 1, deletedAt: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ deletedAt: 1, createdAt: -1 });
fileSchema.index({ chunkedId: 1, chunkIndex: 1 });
fileSchema.index({ owner: 1, trashExpiresAt: 1 });
fileSchema.index({ trashExpiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for id
fileSchema.virtual("id").get(function (this: IFile) {
  return (this._id as Types.ObjectId).toHexString();
});

// Virtual for formatted size
fileSchema.virtual("formattedSize").get(function () {
  return formatFileSize(this.size);
});

// Virtual for file extension
fileSchema.virtual("extension").get(function () {
  const lastDot = this.name.lastIndexOf(".");
  return lastDot === -1 ? "" : this.name.substring(lastDot);
});

// Virtual for file name without extension
fileSchema.virtual("nameWithoutExtension").get(function () {
  const lastDot = this.name.lastIndexOf(".");
  return lastDot === -1 ? this.name : this.name.substring(0, lastDot);
});

// Virtual for display name (restores original extension for wrapped blocked types)
fileSchema.virtual("displayName").get(function () {
  if (this.originalExt) {
    return this.name.replace(/\.bin$/i, "") + this.originalExt;
  }
  return this.name;
});

// Ensure virtual fields are serialized
fileSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    // explicit any to satisfy TypeScript and allow safe deletions
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

// Pre-save middleware
fileSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.name = this.name.trim();
  }
  if (this.isModified("mime")) {
    this.mime = this.mime.toLowerCase().trim();
  }
  next();
});

// Pre-save validation for folder ownership
fileSchema.pre("save", async function (next) {
  if (this.isModified("folder") && this.folder) {
    try {
      const Folder = mongoose.model("Folder");
      const folder = await Folder.findOne({
        _id: this.folder,
        owner: this.owner,
      });

      if (!folder) {
        return next(new Error("Folder not found or access denied"));
      }
    } catch (error) {
      // Folder model might not be registered yet
      console.warn("Could not validate folder ownership:", error);
    }
  }
  next();
});

// Static methods
fileSchema.statics.findByOwner = function (
  ownerId: string,
  options: {
    folderId?: string | null;
    includeDeleted?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const {
    folderId,
    includeDeleted = false,
    search,
    page = 1,
    limit = 50,
  } = options;

  const query: any = { owner: ownerId };

  // Filter by folder
  if (folderId !== undefined) {
    query.folder = folderId;
  }

  // Filter by deletion status
  if (!includeDeleted) {
    query.deletedAt = null;
  }

  // Exclude chunk files (only show parent/chunked files or non-chunked files)
  query.$or = [
    { chunkedId: null },
    { chunkIndex: -1 },
  ];

  // Search functionality
  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("folder", "name");
};

fileSchema.statics.findByOwnerWithCount = async function (
  ownerId: string,
  options: {
    folderId?: string | null;
    includeDeleted?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {},
) {
  const {
    folderId,
    includeDeleted = false,
    search,
    page = 1,
    limit = 50,
  } = options;

  const query: any = { owner: ownerId };

  if (folderId !== undefined) {
    query.folder = folderId;
  }

  if (!includeDeleted) {
    query.deletedAt = null;
  }

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  // Also exclude chunks from the count
  const countQuery = { ...query };
  countQuery.$or = [
    { chunkedId: null },
    { chunkIndex: -1 },
  ];

  const [files, total] = await Promise.all([
    (this as any).findByOwner(ownerId, options),
    this.countDocuments(countQuery),
  ]);

  return {
    files,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

fileSchema.statics.getStorageUsage = async function (ownerId: string) {
  const result = await this.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(ownerId),
        deletedAt: null,
        $or: [
          { chunkedId: null },
          { chunkIndex: -1 },
        ],
      },
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: "$size" },
        totalFiles: { $sum: 1 },
      },
    },
  ]);

  return result[0] || { totalSize: 0, totalFiles: 0 };
};

fileSchema.statics.findDuplicates = function (ownerId: string) {
  return this.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(ownerId),
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: { name: "$name", size: "$size" },
        files: { $push: "$$ROOT" },
        count: { $sum: 1 },
      },
    },
    {
      $match: { count: { $gt: 1 } },
    },
  ]);
};

// Instance methods
fileSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.trashExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return this.save();
};

fileSchema.methods.restore = function () {
  this.deletedAt = null;
  this.trashExpiresAt = null;
  return this.save();
};

fileSchema.methods.isDeleted = function (): boolean {
  return this.deletedAt !== null;
};

fileSchema.methods.getFolderPath = async function (): Promise<string> {
  if (!this.folder) return "/";

  try {
    const Folder = mongoose.model("Folder");
    const folder = await Folder.findById(this.folder);
    if (folder && typeof folder.getFullPath === "function") {
      return await folder.getFullPath();
    }
  } catch (error) {
    console.warn("Could not get folder path:", error);
  }

  return "/";
};

fileSchema.methods.canBeAccessed = function (userId: string): boolean {
  return this.owner.toString() === userId && !this.isDeleted();
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

// Static methods for trash
fileSchema.statics.findTrashByOwner = function (ownerId: string) {
  return this.find({
    owner: ownerId,
    deletedAt: { $ne: null },
    $or: [
      { chunkedId: null },
      { chunkIndex: -1 },
    ],
  }).sort({ deletedAt: -1 });
};

fileSchema.statics.findTrashByOwnerWithCount = async function (ownerId: string, page = 1, limit = 50) {
  const query: any = {
    owner: ownerId,
    deletedAt: { $ne: null },
    $or: [
      { chunkedId: null },
      { chunkIndex: -1 },
    ],
  };
  const [files, total] = await Promise.all([
    this.find(query).sort({ deletedAt: -1 }).skip((page - 1) * limit).limit(limit),
    this.countDocuments(query),
  ]);
  return { files, total, page, limit, totalPages: Math.ceil(total / limit) };
};

fileSchema.statics.cleanupExpiredTrash = async function () {
  const now = new Date();
  const expired = await this.find({ trashExpiresAt: { $lte: now }, deletedAt: { $ne: null } });
  let count = 0;
  for (const file of expired) {
    if ((file as any).chunkedId && (file as any).totalChunks > 1) {
      await this.deleteMany({ chunkedId: (file as any).chunkedId, chunkIndex: { $gte: 0 } }).catch(() => {});
    }
    await this.findByIdAndDelete(file._id).catch(() => {});
    count++;
  }
  return count;
};

export const File =
  (mongoose.models.File as unknown as IFileModel) ||
  (mongoose.model<IFile, IFileModel>("File", fileSchema) as IFileModel);
