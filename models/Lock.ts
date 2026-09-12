import mongoose, { Document, Schema, Types } from "mongoose";

/**
 * WebDAV write locks.
 *
 * These used to live in a module-level `Map` in the Pages Router handler keyed
 * by request path alone, which meant: one user's lock blocked another user's
 * (paths are per-user namespaces, so that was simply wrong), no handler ever
 * consulted the map (PUT/DELETE/MOVE/PROPPATCH wrote through locks freely), no
 * timeout existed, and every lock evaporated on restart — precisely when a
 * client that had locked a resource expected its lock to still be there.
 *
 * Stored in Mongo so locks survive restarts, and scoped per owner because each
 * user's drive is a separate namespace: the same path string denotes different
 * resources for different accounts.
 *
 * Note the TTL index below is deliberate and is NOT the same situation as the
 * files.trashExpiresAt TTL that was removed (see models/File.ts): an expired
 * lock should simply disappear, with no compensating cleanup to run. Trash
 * expiry needed application code to delete Telegram documents; lock expiry
 * needs nothing.
 */
export interface ILock extends Document {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  /** Lock-scoped path within the user's drive, e.g. "/docs/report.pdf". */
  path: string;
  token: string;
  depth: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const lockSchema = new Schema<ILock>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
    },
    depth: {
      type: String,
      default: "infinity",
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

// One live lock per owner+path: re-locking refreshes rather than duplicating.
lockSchema.index({ owner: 1, path: 1 }, { unique: true });
// Self-clearing: abandoned locks must not block a resource forever.
lockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Lock =
  (mongoose.models.Lock as unknown as mongoose.Model<ILock>) ||
  mongoose.model<ILock>("Lock", lockSchema);
