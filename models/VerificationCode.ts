import mongoose, {
  Schema,
  Document,
  Model,
  FilterQuery,
  UpdateWriteOpResult,
  DeleteResult,
  Types,
} from "mongoose";
import { createHmac } from "crypto";
import { env } from "@/lib/env";

export type VerificationType =
  | "password_reset"
  | "account_deletion"
  | "email_verification"
  | "vault_pin_reset";

export interface IVerificationCode extends Document {
  _id: Types.ObjectId;
  email: string;
  code: string;
  type: VerificationType;
  expiresAt: Date;
  used: boolean;
  /** Failed verification attempts; the code stops matching at MAX_CODE_ATTEMPTS. */
  attempts: number;
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
    // Stored as an HMAC of the 6-digit code, never in plaintext: a database
    // dump or log leak should not hand over usable password-reset /
    // account-deletion / vault-recovery codes. Hashing happens in the pre-save
    // hook below so every creation site stays unchanged.
    code: {
      type: String,
      required: [true, "Verification code is required"],
      maxlength: [128, "Verification code hash is too long"],
    },
    type: {
      type: String,
      required: [true, "Verification type is required"],
      enum: [
        "password_reset",
        "account_deletion",
        "email_verification",
        "vault_pin_reset",
      ],
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
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Compound index for efficient queries
VerificationCodeSchema.index({ email: 1, type: 1, used: 1 });
VerificationCodeSchema.index({ code: 1, type: 1, used: 1 });

/**
 * Deterministic digest for a verification code. Salted with JWT_SECRET so a
 * stolen database alone cannot be matched against a precomputed table of the
 * 10^6 possible 6-digit codes.
 */
const CODE_HASH_PREFIX = "hmac-sha256:";

function hashCode(code: string): string {
  return (
    CODE_HASH_PREFIX +
    createHmac("sha256", env.JWT_SECRET).update(code).digest("hex")
  );
}

// Hash on the way in, so every creation site can keep assigning the plaintext
// code. Guarded by the prefix so re-saving a document (e.g. marking it used)
// never double-hashes.
VerificationCodeSchema.pre("save", function (next) {
  if (this.isModified("code") && !this.code.startsWith(CODE_HASH_PREFIX)) {
    this.code = hashCode(this.code);
  }
  next();
});

// Instance method to check if code is expired
VerificationCodeSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt;
};

// Instance method to check if code is valid
VerificationCodeSchema.methods.isValid = function (): boolean {
  return !this.used && !this.isExpired();
};

/**
 * Attempts allowed per issued code before it stops matching. The only other
 * brake on guessing is the IP rate limiter, and getClientIp() trusts a
 * client-supplied X-Forwarded-For — so an attacker who rotates that header
 * could otherwise sweep a meaningful slice of the 10^6 code space inside the
 * code's 15-minute lifetime. This counter travels with the code itself.
 */
const MAX_CODE_ATTEMPTS = 5;

/**
 * Find a valid, unused, unexpired code matching the supplied plaintext.
 *
 * Also records the failed attempt when there is no match. That side effect
 * lives here (rather than in the four verify routes) so callers keep treating
 * a null return as "invalid or expired" and cannot forget to count.
 */
VerificationCodeSchema.statics.findValidCode = async function (
  email: string,
  code: string,
  type: VerificationType,
) {
  const normalized = email.toLowerCase();
  const now = new Date();

  const match = await this.findOne({
    email: normalized,
    code: hashCode(code),
    type,
    used: false,
    expiresAt: { $gt: now },
    attempts: { $lt: MAX_CODE_ATTEMPTS },
  });
  if (match) return match;

  // Charge the attempt to the newest live code for this email+type.
  const target = await this.findOne(
    { email: normalized, type, used: false, expiresAt: { $gt: now } },
    { _id: 1 },
    { sort: { createdAt: -1 } },
  ).catch(() => null);

  if (target) {
    await this.updateOne(
      { _id: target._id },
      { $inc: { attempts: 1 } },
    ).catch(() => {
      // Best-effort: never turn a wrong code into a 500.
    });
  }

  return null;
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
