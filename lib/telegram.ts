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

  constructor() {
    this.botToken = env.TELEGRAM_BOT_TOKEN;
    this.chatId = env.TELEGRAM_CHAT_ID;
    this.baseUrl = `${env.TELEGRAM_API_BASE}/bot${this.botToken}`;
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

      const response = await fetch(url, options);
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

  async downloadFile(filePath: string): Promise<ReadableStream<Uint8Array>> {
    try {
      const url = `${env.TELEGRAM_API_BASE}/file/bot${this.botToken}/${filePath}`;

      const response = await fetch(url);

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

  async getFileStream(fileId: string): Promise<{
    stream: ReadableStream<Uint8Array>;
    size?: number;
    mimeType?: string;
  }> {
    try {
      const fileInfo = await this.getFile(fileId);

      if (!fileInfo.file_path) {
        throw new TelegramError("File path not available");
      }

      const stream = await this.downloadFile(fileInfo.file_path);

      return {
        stream,
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

export const TELEGRAM_FILE_SIZE_LIMIT = 50 * 1024 * 1024; // 50MB
export const MAX_CAPTION_LENGTH = 1024;
