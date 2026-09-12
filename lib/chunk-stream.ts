/**
 * Sequential reading of a chunked (multi-part) file's Telegram parts.
 *
 * A chunked file is a parent File row plus N part rows sharing `chunkedId`,
 * each part its own Telegram document. Three separate places needed to read
 * them in order, and each did it differently:
 *   - lib/webdav.ts wrote parts to a ServerResponse, with a bespoke range
 *     skip loop;
 *   - lib/download-file.ts buffered EVERY part into one Buffer before writing;
 *   - lib/download-utils.ts did the same with an unbounded Promise.all.
 *
 * The buffering versions are the problem: a 2GB file meant a 2GB allocation
 * per request, and a range request for a 1MB video header still fetched and
 * assembled the entire file.
 */

export interface ChunkRef {
  /** Telegram document id for this part. */
  fileId: string;
  /** Cached Telegram file_path, when known. */
  telegramFilePath: string | null;
  /** Part size in bytes. */
  size: number;
}

export interface ChunkByteSlice {
  /** Index into the chunk list. */
  index: number;
  /** Bytes to discard from the start of this part. */
  skip: number;
  /** Bytes to take after skipping; -1 means "to the end of the part". */
  take: number;
}

/**
 * Work out which byte slices to read from which parts, for an optional
 * byte range. Pure and synchronous so it can be tested without a network.
 *
 * Chunk sizes may be unknown (0) for a part that was never probed; in that case
 * the plan still covers it with an open-ended `take`.
 */
export function planChunkSlices(
  chunkSizes: number[],
  range: { start: number; end: number } | null,
): ChunkByteSlice[] {
  if (chunkSizes.length === 0) return [];

  // Without a range: every part in full.
  if (!range) {
    return chunkSizes.map((_, index) => ({ index, skip: 0, take: -1 }));
  }

  const slices: ChunkByteSlice[] = [];
  let offset = 0;

  for (let index = 0; index < chunkSizes.length; index++) {
    const size = chunkSizes[index]!;
    const partStart = offset;
    // A part with unknown size is treated as extending to the end of the file,
    // so it is never skipped over.
    const partEnd = size > 0 ? partStart + size - 1 : Number.POSITIVE_INFINITY;
    offset += size > 0 ? size : 0;

    if (partEnd < range.start) continue; // wholly before the range
    if (partStart > range.end) break; // wholly after the range

    const skip = Math.max(0, range.start - partStart);
    const available = size > 0 ? size - skip : -1;
    if (available === 0) continue;

    const wanted = range.end - Math.max(range.start, partStart) + 1;
    const take = available < 0 ? wanted : Math.min(available, wanted);

    slices.push({ index, skip, take });
  }

  return slices;
}

/**
 * Apply a slice to a buffer. Returns the bytes to emit (possibly empty).
 */
export function applySlice(buf: Buffer, slice: ChunkByteSlice): Buffer {
  const start = slice.skip;
  if (start >= buf.length) return Buffer.alloc(0);
  const end = slice.take < 0 ? buf.length : Math.min(buf.length, start + slice.take);
  return buf.subarray(start, end);
}

/**
 * Yield the bytes of a chunked file in order, optionally limited to a byte
 * range, reading one part at a time so memory stays bounded by the largest
 * single part rather than the whole file.
 *
 * `loadChunk` is injected so this module stays free of Telegram/DB imports and
 * can be exercised directly in tests.
 */
export async function* iterateChunkBytes(
  chunks: ChunkRef[],
  range: { start: number; end: number } | null,
  loadChunk: (
    chunk: ChunkRef,
    index: number,
  ) => Promise<{ stream: ReadableStream<Uint8Array>; filePath?: string | null }>,
): AsyncGenerator<Buffer> {
  const slices = planChunkSlices(
    chunks.map((c) => c.size),
    range,
  );

  let remaining = range ? range.end - range.start + 1 : -1;

  for (const slice of slices) {
    if (remaining === 0) return;

    const chunk = chunks[slice.index]!;
    const { stream } = await loadChunk(chunk, slice.index);
    const reader = stream.getReader();

    try {
      let skipped = 0;
      let taken = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!value || value.byteLength === 0) continue;

        let buf = Buffer.from(value);

        if (skipped < slice.skip) {
          const toSkip = Math.min(buf.length, slice.skip - skipped);
          skipped += toSkip;
          buf = buf.subarray(toSkip);
          if (buf.length === 0) continue;
        }

        const limit =
          slice.take < 0 ? buf.length : Math.min(buf.length, slice.take - taken);
        if (limit <= 0) break;

        yield buf.subarray(0, limit);
        taken += limit;

        if (remaining > 0) {
          remaining -= limit;
          if (remaining === 0) return;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Wrap iterateChunkBytes in a ReadableStream with proper backpressure, for
 * use as a web `Response` body.
 */
export function chunkedReadableStream(
  chunks: ChunkRef[],
  range: { start: number; end: number } | null,
  loadChunk: (
    chunk: ChunkRef,
    index: number,
  ) => Promise<{ stream: ReadableStream<Uint8Array>; filePath?: string | null }>,
): ReadableStream<Uint8Array> {
  const iterator = iterateChunkBytes(chunks, range, loadChunk);

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await iterator.return(undefined).catch(() => {});
    },
  });
}
