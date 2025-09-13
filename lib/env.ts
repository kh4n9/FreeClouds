import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  BASE_URL: z.string().url().default("http://localhost:3000"),

  // Database
  DATABASE_URL: z.string().min(1, "Database URL is required"),

  // Auth
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().min(1, "Telegram bot token is required"),
  TELEGRAM_CHAT_ID: z.string().min(1, "Telegram chat ID is required"),
  TELEGRAM_API_BASE: z.string().url().default("https://api.telegram.org"),

  // Security
  ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      throw new Error(`Invalid environment variables:\n${missingVars.join('\n')}`);
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Helper to check if we're in production
export const isProduction = env.NODE_ENV === "production";
export const isDevelopment = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
