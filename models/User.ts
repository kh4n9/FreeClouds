import mongoose, { Document, Schema, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: "user" | "admin";
  isActive: boolean;
  lastLoginAt?: Date;
  totalFilesUploaded: number;
  totalStorageUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserStatics {
  findByEmail(email: string): Promise<IUser | null>;
  existsByEmail(email: string): Promise<IUser | null>;
  findActiveUsers(): Promise<IUser[]>;
  findAdmins(): Promise<IUser[]>;
  getSystemStats(): Promise<any>;
}

export interface IUserModel extends Model<IUser>, IUserStatics {}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [100, "Name must be less than 100 characters"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      minlength: [60, "Invalid password hash"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
    totalFilesUploaded: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalStorageUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // This will automatically manage createdAt and updatedAt
  },
);

// Index for faster queries (email already has unique index above)
userSchema.index({ createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ totalStorageUsed: -1 });

// Virtual for id
userSchema.virtual("id").get(function () {
  return (this._id as any).toHexString();
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc: any, ret: any) {
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash; // Never include password hash in JSON
    return ret;
  },
});

// Pre-save middleware
userSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.isModified("name")) {
    this.name = this.name.trim();
  }
  next();
});

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userSchema.statics.existsByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() }).select("_id");
};

userSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true });
};

userSchema.statics.findAdmins = function () {
  return this.find({ role: "admin", isActive: true });
};

userSchema.statics.getSystemStats = async function () {
  const totalUsers = await this.countDocuments();
  const activeUsers = await this.countDocuments({ isActive: true });
  const totalAdmins = await this.countDocuments({ role: "admin" });
  const usersToday = await this.countDocuments({
    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
  });
  const usersThisWeek = await this.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });
  const usersThisMonth = await this.countDocuments({
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
  });

  const storageStats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalStorage: { $sum: "$totalStorageUsed" },
        averageStorage: { $avg: "$totalStorageUsed" },
        maxStorage: { $max: "$totalStorageUsed" },
      },
    },
  ]);

  const storageResult = storageStats[0] as any;

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      admins: totalAdmins,
      today: usersToday,
      thisWeek: usersThisWeek,
      thisMonth: usersThisMonth,
    },
    storage: storageResult || {
      totalStorage: 0,
      averageStorage: 0,
      maxStorage: 0,
    },
  };
};

// Instance methods
userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  const safeUser = user as any;
  delete safeUser.passwordHash;
  delete safeUser._id;
  delete safeUser.__v;
  return safeUser;
};

userSchema.methods.isAdmin = function () {
  return this.role === "admin";
};

userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

userSchema.methods.incrementFileCount = function () {
  this.totalFilesUploaded += 1;
  return this.save();
};

userSchema.methods.updateStorageUsed = function (sizeChange: number) {
  this.totalStorageUsed = Math.max(0, this.totalStorageUsed + sizeChange);
  return this.save();
};

userSchema.methods.syncStatistics = async function () {
  try {
    const mongoose = require("mongoose");
    const File = mongoose.model("File");
    const Folder = mongoose.model("Folder");

    // Get actual file statistics
    const fileStats = await File.aggregate([
      {
        $match: {
          owner: this._id,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: "$size" },
        },
      },
    ]);

    // Get folder count
    const folderCount = await Folder.countDocuments({
      owner: this._id,
    });

    const stats = fileStats[0] || { totalFiles: 0, totalSize: 0 };

    // Update user statistics
    this.totalFilesUploaded = stats.totalFiles;
    this.totalStorageUsed = stats.totalSize;

    return this.save();
  } catch (error) {
    console.error("Error syncing user statistics:", error);
    throw error;
  }
};

export const User = (mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema)) as IUserModel;
