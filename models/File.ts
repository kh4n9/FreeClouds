import mongoose, { Document, FilterQuery, Schema, Types } from "mongoose";

export interface IFile extends Document {
  _id: Types.ObjectId;
  name: string;
  size: number;
  mime: string;
  fileId: string; // Telegram file_id (for chunks, each chunk has its own fileId)
  telegramFilePath?: string | null; // cached Telegram file_path (skip getFile call on download)
  telegramMessageId?: string | null; // Telegram message_id of the uploaded document (for deleteMessage)
  owner: Types.ObjectId;
  folder: Types.ObjectId | null;
  deletedAt: Date | null;
  createdAt: Date;
  /**
   * Managed by Mongoose (see the schema's `timestamps` option). WebDAV
   * PROPFIND reports this as getlastmodified — it previously reported
   * createdAt, so a PUT-overwrite never changed the timestamp and clients
   * syncing on Last-Modified silently missed the update.
   */
  updatedAt: Date;
  originalExt?: string | null;     // restored on download when set

  // Chunked file support
  chunkedId?: string | null;   // group UUID shared by all chunks + parent
  chunkIndex?: number | null;  // 0-based index for chunks (parent = -1 or null)
  totalChunks?: number | null; // total number of chunks

  // Trash support (auto-delete after 30 days)
  trashExpiresAt?: Date | null;

  // Vercel Blob cache for assembled chunked files
  blobCacheUrl?: string | null;

  // Favorites support
  favorite: boolean;

  // Versioning support
  currentVersion: number;

  // Virtuals (computed on the schema)
  displayName: string;
  formattedSize: string;
  extension: string;
  nameWithoutExtension: string;

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
      favorite?: boolean;
      excludeFolderIds?: string[];
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
      favorite?: boolean;
      excludeFolderIds?: string[];
    },
  ): Promise<{
    files: IFile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findRecent(ownerId: string, limit?: number): Promise<IFile[]>;
  getStorageUsage(
    ownerId: string,
  ): Promise<{ totalSize: number; totalFiles: number }>;
  findDuplicates(ownerId: string): Promise<
    Array<{
      _id: { name: string; size: number };
      files: IFile[];
      count: number;
    }>
  >;
}

export interface IFileModel extends mongoose.Model<IFile>, IFileStatics {
  findTrashByOwner(ownerId: string): Promise<IFile[]>;
  findTrashByOwnerWithCount(ownerId: string, page?: number, limit?: number): Promise<{ files: IFile[]; total: number; page: number; limit: number; totalPages: number }>;
  cleanupExpiredTrash(): Promise<number>;
  purgeStoredResources(file: IFile): Promise<number>;
  deletePermanently(fileId: string | Types.ObjectId): Promise<{ ok: boolean; deleted: number }>;
}

/**
 * How long a trashed item stays recoverable before the cleanup sweep purges
 * it. Shared with models/Folder.ts so a folder and the files inside it that
 * were trashed together expire on the same schedule.
 */
export const TRASH_RETENTION_DAYS = 30;
export const TRASH_RETENTION_MS = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;

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
    // NOT unique: reference copies share the same Telegram document.
    // Migration (prod): db.files.dropIndex({ fileId: 1 }) once deployed.
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
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
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
  favorite: {
    type: Boolean,
    default: false,
    index: true,
  },
  currentVersion: {
    type: Number,
    default: 1,
    min: 1,
  },
}, {
  // Mongoose maintains updatedAt on every save() and update*() so WebDAV
  // PROPFIND can report a meaningful getlastmodified. createdAt keeps its own
  // explicit default (createdAt: false) rather than being managed, so existing
  // documents and their historical timestamps are untouched.
  timestamps: { createdAt: false, updatedAt: true },
});

// Compound indexes for better query performance
fileSchema.index({ owner: 1, folder: 1, deletedAt: 1 });
fileSchema.index({ owner: 1, name: 1, deletedAt: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ deletedAt: 1, createdAt: -1 });
fileSchema.index({ chunkedId: 1, chunkIndex: 1 }, { unique: true, partialFilterExpression: { chunkIndex: { $gte: 0 } } });
fileSchema.index({ owner: 1, trashExpiresAt: 1 });
// NOTE: deliberately NO TTL index on trashExpiresAt. A TTL index makes the
// mongod TTL monitor delete the document on its own schedule, which races
// cleanupExpiredTrash() and skips telegramAPI.deleteMessage — every file a
// user trashed and never revisited would orphan its Telegram document (and
// its FileVersion rows) permanently. Expiry is driven solely by
// cleanupExpiredTrash(); see lib/maintenance.ts.
// Migration for existing deployments: db.files.dropIndex({ trashExpiresAt: 1 })

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
  transform: function (_doc: unknown, ret) {
    const json = ret as unknown as Record<string, unknown>;
    delete json._id;
    delete json.__v;
    return json;
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
    favorite?: boolean;
    excludeFolderIds?: string[];
  } = {},
) {
  const {
    folderId,
    includeDeleted = false,
    search,
    page = 1,
    limit = 50,
    favorite,
    excludeFolderIds,
  } = options;

  const query: FilterQuery<IFile> = { owner: ownerId };

  // Filter by folder
  if (folderId !== undefined) {
    query.folder = folderId;
  } else if (excludeFolderIds && excludeFolderIds.length > 0) {
    // Exclude files inside locked hidden folder chains
    query.folder = { $nin: excludeFolderIds };
  }

  // Filter by deletion status
  if (!includeDeleted) {
    query.deletedAt = null;
  }

  // Filter by favorites
  if (favorite !== undefined) {
    query.favorite = favorite;
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
    favorite?: boolean;
    excludeFolderIds?: string[];
  } = {},
) {
  const {
    folderId,
    includeDeleted = false,
    search,
    page = 1,
    limit = 50,
    favorite,
    excludeFolderIds,
  } = options;

  const query: FilterQuery<IFile> = { owner: ownerId };

  if (folderId !== undefined) {
    query.folder = folderId;
  } else if (excludeFolderIds && excludeFolderIds.length > 0) {
    query.folder = { $nin: excludeFolderIds };
  }

  if (!includeDeleted) {
    query.deletedAt = null;
  }

  if (favorite !== undefined) {
    query.favorite = favorite;
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
    (this as IFileModel).findByOwner(ownerId, options),
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
  const owner = new mongoose.Types.ObjectId(ownerId);

  const result = await this.aggregate([
    {
      $match: {
        owner,
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

  // Retained versions occupy real Telegram storage too. Without this they were
  // invisible to quota enforcement, so a user could hold unbounded history for
  // free. Only versions whose parent file is still live count, matching the
  // live-file rule above.
  const { FileVersion } = await import("@/models/FileVersion");
  const versionResult = await FileVersion.aggregate([
    { $match: { owner } },
    {
      $lookup: {
        from: this.collection.name,
        localField: "file",
        foreignField: "_id",
        as: "parent",
      },
    },
    { $match: { "parent.0": { $exists: true }, "parent.deletedAt": null } },
    { $group: { _id: null, totalSize: { $sum: "$size" } } },
  ]);

  const base = result[0] as
    | { totalSize: number; totalFiles: number }
    | undefined;
  const versionSize = (versionResult[0]?.totalSize as number | undefined) ?? 0;

  return {
    totalSize: (base?.totalSize ?? 0) + versionSize,
    totalFiles: base?.totalFiles ?? 0,
  };
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
  this.trashExpiresAt = new Date(Date.now() + TRASH_RETENTION_MS);
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

fileSchema.statics.findRecent = function (ownerId: string, limit = 30) {
  return this.find({
    owner: ownerId,
    deletedAt: null,
    $or: [
      { chunkedId: null },
      { chunkIndex: -1 },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("folder", "name");
};

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
  const query: FilterQuery<IFile> = {
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

/**
 * Purge trashed files and folders whose retention window has elapsed.
 *
 * This is the ONLY thing that expires trash. There is deliberately no TTL
 * index (see the note by the indexes above): the mongod TTL monitor would
 * delete rows without running any of the Telegram/Blob cleanup below.
 *
 * Invariant that makes the file-then-folder order safe: softDeleteRecursively
 * stamps every folder and file in a subtree with the same trashExpiresAt, and
 * a file can never be trashed into an already-trashed folder (it is hidden).
 * So a folder always expires at or after everything inside it.
 */
fileSchema.statics.cleanupExpiredTrash = async function () {
  const model = this.constructor as unknown as IFileModel;
  const now = new Date();

  // Only top-level rows: deletePermanently() sweeps each parent's chunks itself.
  const expired = await this.find({
    trashExpiresAt: { $lte: now },
    deletedAt: { $ne: null },
    $or: [{ chunkedId: null }, { chunkIndex: -1 }],
  });

  let count = 0;
  for (const file of expired) {
    const result = await model.deletePermanently(file._id);
    if (result.ok) count++;
  }

  // Folders expire after their contents (see invariant above), so by now every
  // file that was inside them is already gone.
  const Folder = mongoose.model("Folder");
  const expiredFolders = await Folder.deleteMany({
    trashExpiresAt: { $lte: now },
    deletedAt: { $ne: null },
  }).catch((error) => {
    console.error("Failed to purge expired folders:", error);
    return { deletedCount: 0 };
  });

  return count + (expiredFolders.deletedCount ?? 0);
};

/**
 * Reclaim the underlying storage for a file document: its Telegram message,
 * cached Blob, chunk parts (messages + rows) and version rows (messages + rows).
 *
 * Does NOT delete the File row itself — callers that need that use
 * deletePermanently(). Kept separate so paths that delete rows themselves
 * (the admin bulk user-delete, which runs inside a transaction) can still
 * reclaim storage afterwards.
 *
 * Lives here as the single implementation because the trash-empty route, the
 * admin-trash route, deletePermanently and the account-deletion routes each
 * used to re-implement a different subset, and every one of them leaked
 * whatever it forgot.
 */
fileSchema.statics.purgeStoredResources = async function (
  file: IFile,
): Promise<number> {
  const { telegramAPI } = await import("@/lib/telegram");
  const { FileVersion } = await import("@/models/FileVersion");

  let purged = 0;

  const purgeDoc = async (doc: IFile) => {
    if (doc.telegramMessageId) {
      try {
        await telegramAPI.deleteMessage(doc.telegramMessageId);
      } catch (error) {
        // Don't fail the purge, but make the orphan findable — silently
        // swallowing this is how storage leaks go unnoticed for months.
        console.error(
          `Failed to delete Telegram message ${doc.telegramMessageId}:`,
          error,
        );
      }
    }
    if (doc.blobCacheUrl) {
      try {
        const { del } = await import("@vercel/blob");
        await del(doc.blobCacheUrl);
      } catch (error) {
        console.error(`Failed to delete blob ${doc.blobCacheUrl}:`, error);
      }
    }
    purged += 1;
  };

  await purgeDoc(file);

  if (file.chunkedId && file.totalChunks && file.totalChunks > 1) {
    const chunkDocs = await this.find({
      chunkedId: file.chunkedId,
      chunkIndex: { $gte: 0 },
    });
    for (const c of chunkDocs) {
      await purgeDoc(c);
    }
    await this.deleteMany({
      chunkedId: file.chunkedId,
      chunkIndex: { $gte: 0 },
    }).catch((error: unknown) => {
      console.error(`Failed to delete chunks for ${file.chunkedId}:`, error);
    });
  }

  const versionDocs = await FileVersion.find({ file: file._id });
  for (const v of versionDocs) {
    if (v.telegramMessageId) {
      try {
        await telegramAPI.deleteMessage(v.telegramMessageId);
      } catch (error) {
        console.error(
          `Failed to delete version message ${v.telegramMessageId}:`,
          error,
        );
      }
    }
  }
  await FileVersion.deleteMany({ file: file._id }).catch((error) => {
    console.error(`Failed to delete versions for file ${file._id}:`, error);
  });

  return purged;
};

/**
 * Delete a file forever: reclaim its storage, then drop the row.
 * The single purge primitive for every "delete forever" path (trash empty,
 * trash single-delete, admin trash, expired-trash sweep, account deletion).
 */
fileSchema.statics.deletePermanently = async function (
  fileId: string | Types.ObjectId,
): Promise<{ ok: boolean; deleted: number }> {
  const model = this.constructor as unknown as IFileModel;
  const file = await this.findById(fileId);
  if (!file) return { ok: false, deleted: 0 };

  const deleted = await model.purgeStoredResources(file);

  await this.findByIdAndDelete(file._id).catch((error: unknown) => {
    console.error(`Failed to delete file row ${file._id}:`, error);
  });
  return { ok: true, deleted };
};

export const File =
  (mongoose.models.File as unknown as IFileModel) ||
  (mongoose.model<IFile, IFileModel>("File", fileSchema) as IFileModel);
