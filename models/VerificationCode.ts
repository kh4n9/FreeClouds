import mongoose, {
  Schema,
  Document,
  Model,
  FilterQuery,
  UpdateWriteOpResult,
  DeleteResult,
  Types,
} from "mongoose";

export type VerificationType =
  | "password_reset"
  | "account_deletion"
  | "email_verification";

export interface IVerificationCode extends Document {
  _id: Types.ObjectId;
  email: string;
  code: string;
  type: VerificationType;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  isValid(): boolean;
}

export interface IVerificationCodeModel extends Model<IVerificationCode> {
  findValidCode(
    email: string,
    code: string,
    type: VerificationType,
  ): Promise<IVerificationCode | null>;
  invalidateUserCodes(
    email: string,
    type?: VerificationType,
  ): Promise<UpdateWriteOpResult>;
  cleanupExpired(): Promise<DeleteResult>;
}

const VerificationCodeSchema = new Schema<IVerificationCode>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: [true, "Verification code is required"],
      length: 6,
    },
    type: {
      type: String,
      required: [true, "Verification type is required"],
      enum: ["password_reset", "account_deletion", "email_verification"],
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index for automatic cleanup
    },
    used: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Compound index for efficient queries
VerificationCodeSchema.index({ email: 1, type: 1, used: 1 });
VerificationCodeSchema.index({ code: 1, type: 1, used: 1 });

// Instance method to check if code is expired
VerificationCodeSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Instance method to check if code is valid
VerificationCodeSchema.methods.isValid = function (): boolean {
  return !this.used && !this.isExpired();
};

// Static method to find valid code
VerificationCodeSchema.statics.findValidCode = function (
  email: string,
  code: string,
  type: VerificationType,
) {
  return this.findOne({
    email: email.toLowerCase(),
    code,
    type,
    used: false,
    expiresAt: { $gt: new Date() },
  });
};

// Static method to invalidate all codes for user
VerificationCodeSchema.statics.invalidateUserCodes = function (
  email: string,
  type?: VerificationType,
) {
  const query: FilterQuery<IVerificationCode> = {
    email: email.toLowerCase(),
    used: false,
  };

  if (type) {
    query.type = type;
  }

  return this.updateMany(query, { used: true });
};

// Static method to cleanup expired codes (manual cleanup)
VerificationCodeSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

// Pre-save middleware to ensure email is lowercase
VerificationCodeSchema.pre("save", function (next) {
  if (this.email) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-save middleware to set expiration time (15 minutes from now)
VerificationCodeSchema.pre("save", function (next) {
  if (this.isNew && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  next();
});

const VerificationCode = (mongoose.models.VerificationCode ||
  mongoose.model<IVerificationCode, IVerificationCodeModel>(
    "VerificationCode",
    VerificationCodeSchema,
  )) as IVerificationCodeModel;

export default VerificationCode;
