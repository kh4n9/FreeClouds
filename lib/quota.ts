import { connectToDatabase } from "./db";
import { User } from "@/models/User";
import { getSystemSettings } from "./settings";

/**
 * Returns the effective storage limit (bytes) for a user:
 * the user's own storageLimit when set, otherwise the system-wide
 * default from the admin settings.
 */
export async function getEffectiveStorageLimit(
  userId: string,
): Promise<number> {
  try {
    await connectToDatabase();
    const user = await User.findById(userId).select("storageLimit");
    if (user && user.storageLimit && user.storageLimit > 0) {
      return user.storageLimit;
    }
  } catch (error) {
    console.error("Failed to load user storage limit:", error);
  }
  const settings = await getSystemSettings();
  return settings.storageLimit;
}

/**
 * Returns the effective storage limit plus a flag describing whether
 * the limit comes from the user's own plan (true) or the system default
 * (false). Used by the profile API to display quota details.
 */
export async function getStorageLimitInfo(userId: string): Promise<{
  storageLimit: number;
  customStorageLimit: boolean;
}> {
  await connectToDatabase();
  const user = await User.findById(userId).select("storageLimit");
  if (user && user.storageLimit && user.storageLimit > 0) {
    return { storageLimit: user.storageLimit, customStorageLimit: true };
  }
  const settings = await getSystemSettings();
  return { storageLimit: settings.storageLimit, customStorageLimit: false };
}
