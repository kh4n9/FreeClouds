export const CLIENT_CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk (Vercel hobby 4.5MB body limit)
export const PARALLEL_CHUNKS = 3; // max concurrent chunk uploads

/**
 * Upload a Blob to the user's cloud storage, saving it as a new file.
 *
 * Automatically picks the correct strategy based on size:
 * - <= CLIENT_CHUNK_SIZE  -> single XHR POST to /api/upload
 * - larger               -> chunked upload via /api/upload/chunk + /api/upload/complete
 *
 * onProgress receives a percentage (0..100).
 */
export async function uploadBlobToCloud(
  blob: Blob,
  fileName: string,
  mimeType: string,
  folderId: string | null,
  onProgress?: (percent: number) => void,
): Promise<void> {
  if (blob.size <= CLIENT_CHUNK_SIZE) {
    await uploadSingle(blob, fileName, mimeType, folderId, onProgress);
  } else {
    await uploadChunked(blob, fileName, mimeType, folderId, onProgress);
  }
}

function uploadSingle(
  blob: Blob,
  fileName: string,
  mimeType: string,
  folderId: string | null,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append("file", new File([blob], fileName, { type: mimeType }));
    fd.append("folderId", folderId || "");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          reject(new Error(data.error || `Upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.open("POST", "/api/upload");
    xhr.send(fd);
  });
}

async function uploadChunked(
  blob: Blob,
  fileName: string,
  mimeType: string,
  folderId: string | null,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const chunkedId = crypto.randomUUID();
  const totalChunks = Math.ceil(blob.size / CLIENT_CHUNK_SIZE);
  const totalSize = blob.size;

  const uploadOneChunk = async (i: number): Promise<void> => {
    const start = i * CLIENT_CHUNK_SIZE;
    const end = Math.min(start + CLIENT_CHUNK_SIZE, totalSize);
    const chunkBlob = blob.slice(start, end);

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        const delay = Math.min(3000, 1000 * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, delay));
      }

      const fd = new FormData();
      fd.append("chunk", chunkBlob, `chunk_${i}`);
      fd.append("chunkedId", chunkedId);
      fd.append("chunkIndex", String(i));
      fd.append("totalChunks", String(totalChunks));
      fd.append("originalName", fileName);
      fd.append("originalMime", mimeType);
      fd.append("folderId", folderId || "");

      const resp = await fetch("/api/upload/chunk", {
        method: "POST",
        body: fd,
      });

      if (resp.ok) return;

      if (resp.status === 429) {
        await new Promise((r) => setTimeout(r, 5000));
      }
      const errData = await resp.json().catch(() => null);
      if (attempt === 2) {
        throw new Error(errData?.error || `Chunk ${i + 1}/${totalChunks} failed`);
      }
    }
  };

  for (let i = 0; i < totalChunks; i += PARALLEL_CHUNKS) {
    const batch = [];
    for (let j = i; j < Math.min(i + PARALLEL_CHUNKS, totalChunks); j++) {
      batch.push(uploadOneChunk(j));
    }
    await Promise.all(batch);

    const done = Math.min(i + PARALLEL_CHUNKS, totalChunks);
    onProgress?.(Math.round((done / totalChunks) * 100));
  }

  // Finalize
  const finalResp = await fetch("/api/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chunkedId,
      originalName: fileName,
      originalMime: mimeType,
      totalSize,
      totalChunks,
      folderId: folderId || null,
    }),
  });

  if (!finalResp.ok) {
    const errData = await finalResp.json().catch(() => null);
    throw new Error(errData?.error || "Failed to finalize upload");
  }

  onProgress?.(100);
}