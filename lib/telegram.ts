import { env } from "./env";

export interface TelegramFile {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
}

export interface TelegramResponse<T = unknown> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

export interface SendDocumentResponse {
  message_id: number;
  from: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username: string;
  };
  chat: {
    id: number;
    title?: string;
    type: string;
  };
  date: number;
  document: {
    file_name: string;
    mime_type: string;
    file_id: string;
    file_unique_id: string;
    file_size: number;
  };
}

export class TelegramError extends Error {
  constructor(
    message: string,
    public errorCode?: number,
    public description?: string,
  ) {
    super(message);
    this.name = "TelegramError";
  }
}

class TelegramAPI {
  private baseUrl: string;
  private botToken: string;
  private chatId: string;
  private timeoutMs: number;
  private maxRetries: number;

  constructor() {
    this.botToken = env.TELEGRAM_BOT_TOKEN;
    this.chatId = env.TELEGRAM_CHAT_ID;
    this.baseUrl = `${env.TELEGRAM_API_BASE}/bot${this.botToken}`;
    this.timeoutMs = env.TELEGRAM_TIMEOUT_MS;
    this.maxRetries = env.TELEGRAM_MAX_RETRIES;
  }

  private async fetchWithRetry(
    url: string,
    options?: RequestInit,
    timeoutMs?: number,
    maxRetries?: number,
  ): Promise<Response> {
    let lastError: unknown;
    const effectiveTimeout = timeoutMs ?? this.timeoutMs;
    const attempts = Math.min(maxRetries ?? this.maxRetries, 5);
    for (let attempt = 0; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), effectiveTimeout);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          const delay = 500 * 2 ** attempt + Math.random() * 250;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError;
  }

  private async makeRequest<T>(
    method: string,
    data?: unknown,
    isFormData: boolean = false,
  ): Promise<TelegramResponse<T>> {
    try {
      const url = `${this.baseUrl}/${method}`;

      const options: RequestInit = {
        method: "POST",
        headers: isFormData
          ? {}
          : {
              "Content-Type": "application/json",
            },
        body: isFormData
          ? (data as BodyInit)
          : data
            ? JSON.stringify(data)
            : null,
      };

      const response = await this.fetchWithRetry(url, options);
      const result = await response.json();

      if (!result.ok) {
        throw new TelegramError(
          result.description || "Telegram API error",
          result.error_code,
          result.description,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof TelegramError) {
        throw error;
      }

      console.error("Telegram API request failed:", error);
      throw new TelegramError(
        "Failed to communicate with Telegram API",
        undefined,
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  }

  async sendDocument(
    file: Buffer | Uint8Array,
    fileName: string,
    mimeType?: string,
  ): Promise<SendDocumentResponse> {
    try {
      const formData = new FormData();

      // Create a Blob from the buffer
      const blob = new Blob([new Uint8Array(file)], {
        type: mimeType || "application/octet-stream",
      });

      formData.append("chat_id", this.chatId);
      formData.append("document", blob, fileName);
      formData.append("caption", `📁 ${fileName}`);

      const response = await this.makeRequest<SendDocumentResponse>(
        "sendDocument",
        formData,
        true,
      );

      if (!response.result) {
        throw new TelegramError("No result from sendDocument");
      }

      return response.result;
    } catch (error) {
      console.error("Failed to send document to Telegram:", error);
      throw error;
    }
  }

  async getFile(fileId: string): Promise<TelegramFile> {
    try {
      const response = await this.makeRequest<TelegramFile>("getFile", {
        file_id: fileId,
      });

      if (!response.result) {
        throw new TelegramError("No result from getFile");
      }

      return response.result;
    } catch (error) {
      console.error("Failed to get file from Telegram:", error);
      throw error;
    }
  }

  /**
   * Download a byte range of a Telegram file. Telegram's file endpoints
   * honor standard HTTP Range requests (206). `end` is inclusive.
   * Per-attempt timeout capped at 3 min and a single retry, so a stalled
   * connection (Telegram throttling parallel downloads) fails in minutes
   * instead of hanging the whole request for 20+ min. HTTP errors like 404
   * are NOT retried — the file is permanently gone, fail fast.
   */
  async downloadFileRange(
    filePath: string,
    start: number,
    end: number,
    timeoutMs: number = 180_000,
  ): Promise<{ stream: ReadableStream<Uint8Array>; isPartial: boolean }> {
    const url = `${env.TELEGRAM_API_BASE}/file/bot${this.botToken}/${filePath}`;

    const response = await this.fetchWithRetry(
      url,
      { headers: { Range: `bytes=${start}-${end}` } },
      timeoutMs,
      2,
    );

    if (!response.ok && response.status !== 206) {
      throw new TelegramError(
        `Failed to download file: ${response.status} ${response.statusText}`,
      );
    }

    if (!response.body) {
      throw new TelegramError("No response body received");
    }

    return { stream: response.body, isPartial: response.status === 206 };
  }

  async downloadFile(
    filePath: string,
    timeoutMs: number = 90_000,
  ): Promise<ReadableStream<Uint8Array>> {
    try {
      const url = `${env.TELEGRAM_API_BASE}/file/bot${this.botToken}/${filePath}`;

      // Retry transient timeouts up to 3 attempts: Telegram throttles bursts
      // of parallel connections with ETIMEDOUT, and a retry usually succeeds
      // once the burst subsides. Stall-abort is 90s per attempt, so worst
      // case is ~4.5 min per chunk instead of 20+ min. 404/400 is never
      // retried (fail fast).
      const response = await this.fetchWithRetry(url, undefined, timeoutMs, 2);

      if (!response.ok) {
        throw new TelegramError(
          `Failed to download file: ${response.status} ${response.statusText}`,
        );
      }

      if (!response.body) {
        throw new TelegramError("No response body received");
      }

      return response.body;
    } catch (error) {
      console.error("Failed to download file from Telegram:", error);
      throw error;
    }
  }

  async getFileStream(
    fileId: string,
    filePath?: string,
    range?: { start: number; end: number },
  ): Promise<{
    stream: ReadableStream<Uint8Array>;
    size?: number;
    mimeType?: string;
    filePath?: string;
  }> {
    try {
      const download = async (path: string) => {
        if (range) {
          const result = await this.downloadFileRange(path, range.start, range.end);
          return result.stream;
        }
        return this.downloadFile(path);
      };

      if (filePath) {
        try {
          const stream = await download(filePath);
          return { stream, filePath };
        } catch (error) {
          if (
            error instanceof TelegramError &&
            /404|400/.test(error.message)
          ) {
            console.warn(
              `Cached file path unavailable (${filePath}), refreshing from getFile`,
            );
            return this.getFileStream(fileId, undefined, range);
          }
          throw error;
        }
      }

      const fileInfo = await this.getFile(fileId);

      if (!fileInfo.file_path) {
        throw new TelegramError("File path not available");
      }

      const stream = await download(fileInfo.file_path);

      return {
        stream,
        filePath: fileInfo.file_path,
        ...(fileInfo.file_size !== undefined && { size: fileInfo.file_size }),
      };
    } catch (error) {
      console.error("Failed to get file stream:", error);
      throw error;
    }
  }

  async verifyBotToken(): Promise<boolean> {
    try {
      const response = await this.makeRequest("getMe");
      return response.ok;
    } catch (error) {
      console.error("Bot token verification failed:", error);
      return false;
    }
  }

  async testChatAccess(): Promise<boolean> {
    try {
      const response = await this.makeRequest("getChat", {
        chat_id: this.chatId,
      });
      return response.ok;
    } catch (error) {
      console.error("Chat access test failed:", error);
      return false;
    }
  }

  /**
   * Best-effort deletion of a bot-sent message. Bots can delete their own
   * messages at any time. Returns false if the message could not be deleted.
   */
  async deleteMessage(messageId: string, chatId?: string): Promise<boolean> {
    try {
      const response = await this.makeRequest("deleteMessage", {
        chat_id: chatId || this.chatId,
        message_id: messageId,
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to delete Telegram message:", error);
      return false;
    }
  }
}

// Export singleton instance
export const telegramAPI = new TelegramAPI();

// Helper functions
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

export function validateFileName(fileName: string): boolean {
  // Check for valid file name
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(fileName)) {
    return false;
  }

  // Check length
  if (fileName.length === 0 || fileName.length > 255) {
    return false;
  }

  // Check for reserved names on Windows
  const reservedNames = /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
  const nameWithoutExt = fileName.split(".")[0];
  if (reservedNames.test(nameWithoutExt || "")) {
    return false;
  }

  return true;
}

export function sanitizeFileName(fileName: string): string {
  // Replace invalid characters with underscores
  let sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

  // Trim whitespace and dots
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, "");

  // Ensure it's not empty
  if (sanitized.length === 0) {
    sanitized = "file";
  }

  // Truncate if too long
  if (sanitized.length > 255) {
    const ext = sanitized.substring(sanitized.lastIndexOf("."));
    const name = sanitized.substring(0, 255 - ext.length);
    sanitized = name + ext;
  }

  return sanitized;
}

// File type validation
export function isAllowedFileType(mimeType: string, fileName: string): boolean {
  // Block potentially dangerous file types
  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".com",
    ".pif",
    ".scr",
    ".vbs",
    ".js",
    ".jar",
    ".ws",
    ".wsf",
    ".wsc",
    ".msi",
    ".msp",
    ".dll",
    ".sys",
    ".scf",
  ];

  const fileExtension = fileName
    .toLowerCase()
    .substring(fileName.lastIndexOf("."));
  if (dangerousExtensions.includes(fileExtension)) {
    return false;
  }

  // Block executable MIME types
  const dangerousMimeTypes = [
    "application/x-executable",
    "application/x-msdownload",
    "application/x-msdos-program",
    "application/x-msi",
    "application/x-winexe",
    "text/javascript",
    "application/javascript",
  ];

  if (dangerousMimeTypes.includes(mimeType.toLowerCase())) {
    return false;
  }

  return true;
}

export const TELEGRAM_FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB (upload limit)
export const TELEGRAM_DOWNLOAD_LIMIT = 20 * 1024 * 1024; // 20MB (download limit via getFile)
export const MAX_CAPTION_LENGTH = 1024;
