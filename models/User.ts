import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries (email already has unique index above)
userSchema.index({ createdAt: -1 });

// Virtual for id
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
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

// Instance methods
userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.passwordHash;
  delete user._id;
  delete user.__v;
  return user;
};

export const User =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);
