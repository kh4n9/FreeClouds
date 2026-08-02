import { telegramAPI } from "./telegram";
import { File, type IFile } from "@/models/File";

export function bufferToStream(buf: Buffer): ReadableStream<Uint8Array> {
  let offset = 0;
  const CHUNK_SIZE = 65536;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= buf.length) {
        controller.close();
        return;
      }
      const end = Math.min(offset + CHUNK_SIZE, buf.length);
      controller.enqueue(new Uint8Array(buf.subarray(offset, end)));
      offset = end;
    },
  });
}

/**
 * Resolve any file (chunked or not) to a downloadable stream.
 * Chunked parents are assembled from their Telegram chunk records.
 * Ownership must be verified by the caller.
 */
export async function getFileDownloadStream(file: IFile): Promise<{
  stream: ReadableStream<Uint8Array>;
  size?: number;
}> {
  const isChunked = file.chunkedId && file.totalChunks && file.totalChunks > 1;

  if (!isChunked) {
    const result = await telegramAPI.getFileStream(
      file.fileId,
      file.telegramFilePath || undefined,
    );
    if (!file.telegramFilePath && result.filePath) {
      File.updateOne({ _id: file._id }, { telegramFilePath: result.filePath }).catch(() => {});
    }
    return {
      stream: result.stream,
      ...(result.size !== undefined ? { size: result.size } : {}),
    };
  }

  const chunks = await File.find({
    chunkedId: file.chunkedId,
    chunkIndex: { $gte: 0 },
    owner: file.owner,
    deletedAt: null,
  }).sort({ chunkIndex: 1 });

  if (!chunks.length || chunks.length !== file.totalChunks) {
    throw new Error(`File chunks not found (expected ${file.totalChunks}, found ${chunks.length})`);
  }

  const contiguous = chunks.every((c, i: number) => c.chunkIndex === i);
  if (!contiguous) {
    throw new Error("File chunks are incomplete");
  }

  const buffers: Buffer[] = await Promise.all(
    chunks.map(async (c) => {
      const result = await telegramAPI.getFileStream(c.fileId, c.telegramFilePath || undefined);
      if (!c.telegramFilePath && result.filePath) {
        File.updateOne({ _id: c._id }, { telegramFilePath: result.filePath }).catch(() => {});
      }
      const reader = result.stream.getReader();
      const parts: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        parts.push(value);
      }
      reader.releaseLock();
      return Buffer.concat(parts);
    }),
  );

  return { stream: bufferToStream(Buffer.concat(buffers)), size: file.size };
}
