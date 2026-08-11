import { telegramAPI } from "./telegram";

// Server-side split size: Telegram Bot API caps a single sendDocument at
// 50MB, so anything larger must be stored as 15MB parts (same convention as
// app/api/upload).
export const SERVER_CHUNK_SIZE = 15 * 1024 * 1024;
export const MAX_PUT_BYTES = 2 * 1024 * 1024 * 1024; // 2GB

export interface TelegramPartMeta {
  size: number;
  fileId: string;
  telegramFilePath: string | null;
  telegramMessageId: string;
}

export interface StreamPartsResult {
  totalBytes: number;
  meta: TelegramPartMeta[]; // length 1 => single-document file
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function uploadOnePart(
  buffer: Buffer,
  name: string,
  mimeType: string,
): Promise<TelegramPartMeta> {
  const response = await telegramAPI.sendDocument(buffer, name, mimeType);
  let telegramFilePath: string | null = null;
  try {
    const info = await telegramAPI.getFile(response.document.file_id);
    telegramFilePath = info.file_path || null;
  } catch {}
  return {
    size: buffer.length,
    fileId: response.document.file_id,
    telegramFilePath,
    telegramMessageId: String(response.message_id),
  };
}

/**
 * Read a request body stream and upload it to Telegram split into
 * SERVER_CHUNK_SIZE parts (single document when tiny). Parts are uploaded
 * concurrently (window of `concurrency`) while the body is still being read,
 * so memory stays bounded and throughput ~= concurrency × one connection.
 * Throws an Error with message "PAYLOAD_TOO_LARGE" past `maxBytes` and
 * "EMPTY_BODY" for empty payloads.
 */
export async function uploadBodyToTelegram(
  body: AsyncIterable<Buffer | string>,
  fileName: string,
  mimeType: string,
  opts: { maxBytes?: number; concurrency?: number } = {},
): Promise<StreamPartsResult> {
  const maxBytes = opts.maxBytes ?? MAX_PUT_BYTES;
  const concurrency = Math.max(1, Math.min(4, opts.concurrency ?? 3));

  let partBufs: Buffer[] = [];
  let partLen = 0;
  let totalBytes = 0;
  let lastError: unknown = null;

  const jobs: Promise<TelegramPartMeta>[] = [];
  let inFlight = 0;

  async function* splitBody(): AsyncGenerator<Buffer> {
    for await (const raw of body) {
      const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as string);
      let offset = 0;
      while (offset < chunk.length) {
        const take = Math.min(chunk.length - offset, SERVER_CHUNK_SIZE - partLen);
        partBufs.push(chunk.subarray(offset, offset + take));
        partLen += take;
        totalBytes += take;
        if (totalBytes > maxBytes) {
          throw new Error("PAYLOAD_TOO_LARGE");
        }
        offset += take;
        if (partLen === SERVER_CHUNK_SIZE) {
          yield Buffer.concat(partBufs);
          partBufs = [];
          partLen = 0;
        }
      }
    }
    if (partLen > 0) {
      yield Buffer.concat(partBufs);
      partBufs = [];
      partLen = 0;
    }
  }

  for await (const part of splitBody()) {
    if (lastError) break;
    while (inFlight >= concurrency) {
      await sleep(25);
      if (lastError) break;
    }
    if (lastError) break;
    inFlight++;
    const name = `${fileName}.part${jobs.length + 1}`;
    jobs.push(
      uploadOnePart(part, name, mimeType)
        .catch((error) => {
          lastError = error;
          throw error;
        })
        .finally(() => {
          inFlight--;
        }),
    );
  }

  // Drain remaining in-flight uploads, then propagate the first failure.
  while (inFlight > 0) {
    await sleep(25);
  }

  let meta: TelegramPartMeta[];
  try {
    meta = await Promise.all(jobs);
  } catch {
    throw new Error(
      lastError instanceof Error ? lastError.message : "Telegram part upload failed",
    );
  }

  if (meta.length === 0) {
    throw new Error("EMPTY_BODY");
  }

  return { totalBytes, meta };
}