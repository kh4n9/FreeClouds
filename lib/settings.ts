import { connectToDatabase } from "./db";
import { SystemSetting } from "@/models/SystemSetting";

export interface SystemSettings {
  allowRegistration: boolean;
  storageLimit: number;
  siteName: string;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  allowRegistration: true,
  storageLimit: 1024 * 1024 * 1024 * 1024, // 1TB
  siteName: "Free Clouds",
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    await connectToDatabase();
    const [allowRegistration, storageLimit, siteName] = await Promise.all([
      SystemSetting.getSetting("allowRegistration", String(DEFAULT_SETTINGS.allowRegistration)),
      SystemSetting.getSetting("storageLimit", String(DEFAULT_SETTINGS.storageLimit)),
      SystemSetting.getSetting("siteName", DEFAULT_SETTINGS.siteName),
    ]);
    return {
      allowRegistration: allowRegistration === "true",
      storageLimit: Math.max(1, parseInt(storageLimit, 10) || DEFAULT_SETTINGS.storageLimit),
      siteName: siteName || DEFAULT_SETTINGS.siteName,
    };
  } catch (error) {
    console.error("Failed to load system settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSystemSettings(
  patch: Partial<SystemSettings>,
): Promise<SystemSettings> {
  await connectToDatabase();
  if (patch.allowRegistration !== undefined) {
    await SystemSetting.setSetting("allowRegistration", String(patch.allowRegistration));
  }
  if (patch.storageLimit !== undefined) {
    await SystemSetting.setSetting("storageLimit", String(Math.max(1, patch.storageLimit)));
  }
  if (patch.siteName !== undefined && patch.siteName.trim()) {
    await SystemSetting.setSetting("siteName", patch.siteName.trim());
  }
  return getSystemSettings();
}
