import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFolder extends Document {
  name: string;
  owner: Types.ObjectId;
  parent: Types.ObjectId | null;
  createdAt: Date;
}

const folderSchema = new Schema<IFolder>({
  name: {
    type: String,
    required: [true, "Folder name is required"],
    trim: true,
    minlength: [1, "Folder name must be at least 1 character long"],
    maxlength: [100, "Folder name must be less than 100 characters"],
    validate: {
      validator: function (name: string) {
        // Check for invalid characters
        const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
        return !invalidChars.test(name);
      },
      message: "Folder name contains invalid characters",
    },
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Owner is required"],
    index: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound indexes for better query performance
folderSchema.index({ owner: 1, parent: 1 });
folderSchema.index({ owner: 1, name: 1, parent: 1 }, { unique: true });
folderSchema.index({ createdAt: -1 });

// Virtual for id
folderSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
folderSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    // Convert parent ObjectId to string
    if (ret.parent) {
      ret.parent = ret.parent.toString();
    }
    return ret;
  },
});

// Pre-save middleware
folderSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.name = this.name.trim();
  }
  next();
});

// Prevent circular references
folderSchema.pre("save", async function (next) {
  if (this.isModified("parent") && this.parent) {
    // Check if parent exists and belongs to the same owner
    const parent = await this.constructor.findOne({
      _id: this.parent,
      owner: this.owner,
    });

    if (!parent) {
      return next(new Error("Parent folder not found or access denied"));
    }

    // Check for circular reference
    let currentParent = parent.parent;
    const visited = new Set([this._id.toString(), this.parent.toString()]);

    while (currentParent) {
      if (visited.has(currentParent.toString())) {
        return next(new Error("Circular folder reference detected"));
      }

      visited.add(currentParent.toString());

      const nextParent = await this.constructor.findById(currentParent).select("parent");
      if (!nextParent) break;

      currentParent = nextParent.parent;
    }
  }
  next();
});

// Static methods
folderSchema.statics.findByOwner = function (ownerId: string, parentId?: string | null) {
  const query: any = { owner: ownerId };

  // If parentId is provided, filter by parent
  if (parentId !== undefined) {
    query.parent = parentId || null;
  }

  return this.find(query).sort({ name: 1 });
};

folderSchema.statics.findByPath = async function (
  ownerId: string,
  folderPath: string[]
): Promise<IFolder | null> {
  if (folderPath.length === 0) return null;

  let currentParent = null;
  let folder = null;

  for (const folderName of folderPath) {
    folder = await this.findOne({
      owner: ownerId,
      parent: currentParent,
      name: folderName,
    });

    if (!folder) return null;
    currentParent = folder._id;
  }

  return folder;
};

folderSchema.statics.getFolderTree = async function (ownerId: string) {
  const folders = await this.find({ owner: ownerId }).sort({ name: 1 });

  const folderMap = new Map();
  const rootFolders: any[] = [];

  // Create folder map
  folders.forEach((folder) => {
    folderMap.set(folder._id.toString(), {
      ...folder.toJSON(),
      children: [],
    });
  });

  // Build tree structure
  folders.forEach((folder) => {
    const folderData = folderMap.get(folder._id.toString());

    if (folder.parent) {
      const parent = folderMap.get(folder.parent.toString());
      if (parent) {
        parent.children.push(folderData);
      }
    } else {
      rootFolders.push(folderData);
    }
  });

  return rootFolders;
};

folderSchema.statics.getFolderPath = async function (folderId: string): Promise<string[]> {
  const path: string[] = [];
  let currentFolder = await this.findById(folderId);

  while (currentFolder) {
    path.unshift(currentFolder.name);
    if (currentFolder.parent) {
      currentFolder = await this.findById(currentFolder.parent);
    } else {
      break;
    }
  }

  return path;
};

// Instance methods
folderSchema.methods.getFullPath = async function (): Promise<string> {
  const path = await this.constructor.getFolderPath(this._id);
  return "/" + path.join("/");
};

folderSchema.methods.hasChild = async function (childName: string): Promise<boolean> {
  const child = await this.constructor.findOne({
    parent: this._id,
    name: childName,
    owner: this.owner,
  });
  return !!child;
};

folderSchema.methods.getChildren = function () {
  return this.constructor.find({
    parent: this._id,
    owner: this.owner,
  }).sort({ name: 1 });
};

folderSchema.methods.canBeDeleted = async function (): Promise<{ canDelete: boolean; reason?: string }> {
  // Always allow deletion - we'll handle recursive deletion
  return { canDelete: true };
};

folderSchema.methods.deleteRecursively = async function (): Promise<{
  foldersDeleted: number;
  filesDeleted: number;
  errors: string[]
}> {
  const stats = {
    foldersDeleted: 0,
    filesDeleted: 0,
    errors: [] as string[]
  };

  // First, get all child folders
  const childFolders = await this.constructor.find({
    parent: this._id,
  });

  // Recursively delete all child folders
  for (const childFolder of childFolders) {
    try {
      const childStats = await childFolder.deleteRecursively();
      stats.foldersDeleted += childStats.foldersDeleted;
      stats.filesDeleted += childStats.filesDeleted;
      stats.errors.push(...childStats.errors);
    } catch (error) {
      const errorMsg = `Failed to delete child folder ${childFolder.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg);
      stats.errors.push(errorMsg);
    }
  }

  // Delete all files in this folder from database
  try {
    const File = mongoose.model("File");
    const filesInFolder = await File.find({
      folder: this._id,
    });

    const deletedFilesResult = await File.deleteMany({
      folder: this._id,
    });

    stats.filesDeleted += deletedFilesResult.deletedCount || 0;
  } catch (error) {
    const errorMsg = `Could not delete files in folder ${this.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.warn(errorMsg);
    stats.errors.push(errorMsg);
  }

  // Finally, delete this folder
  try {
    await this.constructor.findByIdAndDelete(this._id);
    stats.foldersDeleted += 1;
  } catch (error) {
    const errorMsg = `Could not delete folder ${this.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg);
    stats.errors.push(errorMsg);
  }

  return stats;
};

folderSchema.methods.countContents = async function (): Promise<{
  totalFolders: number;
  totalFiles: number;
}> {
  let totalFolders = 0;
  let totalFiles = 0;

  // Count child folders recursively
  const childFolders = await this.constructor.find({
    parent: this._id,
  });

  totalFolders += childFolders.length;

  // Recursively count contents of child folders
  for (const childFolder of childFolders) {
    const childStats = await childFolder.countContents();
    totalFolders += childStats.totalFolders;
    totalFiles += childStats.totalFiles;
  }

  // Count files in this folder
  try {
    const File = mongoose.model("File");
    const filesCount = await File.countDocuments({
      folder: this._id,
      deletedAt: null,
    });
    totalFiles += filesCount;
  } catch (error) {
    console.warn("Could not count files in folder:", error);
  }

  return { totalFolders, totalFiles };
};

export const Folder = mongoose.models.Folder || mongoose.model<IFolder>("Folder", folderSchema);
