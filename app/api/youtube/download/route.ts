import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import ytdl from "@distube/ytdl-core";
import {
  requireAuth,
  AuthError,
  createAuthResponse,
  validateOrigin,
  createCsrfError,
} from "@/lib/auth";
import {
  checkRateLimit,
  createRateLimitResponse,
  RATE_LIMITS,
} from "@/lib/ratelimit";
import {
  resolveYoutubeInfo,
  isUsableFormat,
  isSafeStreamUrl,
  rotateYoutubeStreamUrl,
  ytdlRequestOptions,
  YOUTUBE_FETCH_HEADERS,
} from "@/lib/youtube";
import type { YoutubeResolvedInfo } from "@/lib/youtube";

export const runtime = "nodejs";

const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

const DEFAULT_MAX_BYTES = 1024 * 1024 * 1024; // 1GB

/**
 * fetch() that re-validates every redirect target against isSafeStreamUrl().
 *
 * The snapshot URL is validated before the first request, but fetch() followed
 * redirects by default: a signed googlevideo URL that answered 302 to an
 * internal address would have been followed without any host check, turning
 * the SSRF guard into a formality.
 */
async function fetchFollowingSafeRedirects(
  url: string,
  init: RequestInit,
  maxHops = 3,
): Promise<Response> {
  let current = url;

  for (let hop = 0; hop <= maxHops; hop++) {
    const res = await fetch(current, { ...init, redirect: "manual" });

    if (res.status < 300 || res.status >= 400) return res;

    const location = res.headers.get("location");
    if (!location) return res;

    const next = new URL(location, current).toString();
    if (!isSafeStreamUrl(next)) {
      console.error(
        `[youtube] refusing redirect to untrusted host: ${next.slice(0, 120)}`,
      );
      throw new Error("Upstream redirected to an untrusted host");
    }
    current = next;
  }

  throw new Error("Too many upstream redirects");
}

const RANGE_CHUNK = 1024 * 1024; // CDN serves ANDROID-signed URLs in 1MB ranges
const ROTATE_EVERY_BYTES = 16 * 1024 * 1024; // fresh signed URL before the CDN throttle

function maxBytes(): number {
  const raw = process.env.YOUTUBE_MAX_BYTES;
  if (!raw) return DEFAULT_MAX_BYTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MAX_BYTES;
}

/**
 * ANDROID-client URLs are only served via bounded Range requests. Stream the
 * file by fetching consecutive 1MB ranges and forwarding the bytes. The CDN
 * transiently 403s range bursts, so each chunk is retried with backoff.
 */
/** Cap on a single upstream request, so a stalled CDN cannot hang the route. */
const UPSTREAM_TIMEOUT_MS = 30_000;

async function fetchRange(
  url: string,
  offset: number,
  signal?: AbortSignal,
): Promise<Response | null> {
  const delays = [500, 1000, 2000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    if (signal?.aborted) return null;

    // A bare fetch here had no timeout: a stalled CDN connection held the
    // request (and its bytes) open indefinitely.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const forward = () => controller.abort();
    signal?.addEventListener("abort", forward, { once: true });

    try {
      const res = await fetch(url, {
        headers: {
          ...YOUTUBE_FETCH_HEADERS,
          Range: `bytes=${offset}-${offset + RANGE_CHUNK - 1}`,
        },
        signal: controller.signal,
      });
      if (res.ok && res.body) return res;
      if (attempt === 0) {
        console.error(`[youtube] range fetch ${res.status} at ${offset}, retrying`);
      }
    } catch (error) {
      if (signal?.aborted) return null;
      if (attempt === 0) {
        console.error(`[youtube] range fetch failed at ${offset}:`, error);
      }
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", forward);
    }

    if (attempt < delays.length) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt]!));
    }
  }
  return null;
}

async function openRangeStream(
  url: string,
  videoId: string,
  itag: number,
  signal?: AbortSignal,
): Promise<{ stream: ReadableStream<Uint8Array>; total: number | null; mimeType: string | null } | null> {
  const first = await fetchRange(url, 0, signal);
  if (!first || !first.body) return null;

  const rangeMatch = first.headers.get("content-range")?.match(/\/(\d+)$/);
  const total = rangeMatch ? Number(rangeMatch[1]) : null;
  const mimeType = first.headers.get("content-type")?.split(";")[0]?.trim() || null;
  const firstBuf: Uint8Array[] = [];
  const reader = first.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    firstBuf.push(value);
  }
  const firstLen = firstBuf.reduce((sum, b) => sum + b.byteLength, 0);

  let offset = RANGE_CHUNK;
  let lastRotate = 0;
  let currentUrl = url;
  let finished = total !== null ? offset >= total : firstLen < RANGE_CHUNK;

  // Running byte count. When the CDN omits Content-Range there is no `total`,
  // and the size cap used to be skipped entirely because it was only ever
  // checked against a known length — so an unknown-length stream could exceed
  // YOUTUBE_MAX_BYTES unchecked.
  const cap = maxBytes();
  let streamed = firstLen;
  if (streamed > cap) return null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const buf of firstBuf) controller.enqueue(buf);
      if (finished) controller.close();
    },
    async pull(controller) {
      if (finished) {
        controller.close();
        return;
      }
      // Client hung up: stop fetching instead of rotating URLs to completion.
      if (signal?.aborted) {
        controller.close();
        return;
      }
      const pullStart = Date.now();
      if (offset - lastRotate >= ROTATE_EVERY_BYTES) {
        const fresh = await rotateYoutubeStreamUrl(videoId, itag, signal ? { signal } : {});
        if (fresh) {
          currentUrl = fresh;
          lastRotate = offset;
        } else {
          console.error("[youtube] URL rotation failed, continuing with old URL");
        }
      }
      let res = await fetchRange(currentUrl, offset, signal);
      if (!res || !res.body) {
        // The signed URL died mid-stream (CDN throttle) — rotate once and
        // retry the same offset against the fresh URL before giving up.
        console.error("[youtube] range fetch exhausted, rotating URL");
        const fresh = await rotateYoutubeStreamUrl(videoId, itag, signal ? { signal } : {});
        if (fresh) {
          currentUrl = fresh;
          lastRotate = offset;
          res = await fetchRange(currentUrl, offset, signal);
        }
      }
      if (!res || !res.body) {
        if (signal?.aborted) {
          controller.close();
          return;
        }
        controller.error(new Error("range fetch failed after retries"));
        return;
      }
      const chunkReader = res.body.getReader();
      while (true) {
        const { done, value } = await chunkReader.read();
        if (done) break;
        streamed += value.byteLength;
        if (streamed > cap) {
          // Stop cleanly at the cap rather than continuing past it; the client
          // gets a truncated body and will fail its own length check.
          console.error(
            `[youtube] stream exceeded YOUTUBE_MAX_BYTES (${cap}); truncating`,
          );
          await chunkReader.cancel().catch(() => {});
          controller.close();
          finished = true;
          return;
        }
        controller.enqueue(value);
      }
      const pulled = offset;
      offset += RANGE_CHUNK;
      if (total !== null && offset >= total) finished = true;
      const elapsed = Date.now() - pullStart;
      if (elapsed > 500) {
        console.error(
          `[youtube] pull slow: chunk at ${pulled} took ${elapsed}ms (${(1048576 / elapsed).toFixed(1)} MB/s)`,
        );
      }
    },
  });

  return { stream, total, mimeType };
}

export async function GET(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();

    const rateLimit = checkRateLimit(
      request,
      RATE_LIMITS.DOWNLOAD,
      "youtube-download",
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.remaining,
        rateLimit.resetTime,
        rateLimit.maxRequests,
      );
    }

    await requireAuth(request);

    const videoId = request.nextUrl.searchParams.get("videoId") || "";
    const itagRaw = request.nextUrl.searchParams.get("itag") || "";
    const snapshotUrl = request.nextUrl.searchParams.get("url") || "";

    if (
      !VIDEO_ID_RE.test(videoId) ||
      !/^\d+$/.test(itagRaw) ||
      (snapshotUrl && !isSafeStreamUrl(snapshotUrl))
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", code: "INVALID_PARAMS" },
        { status: 400 },
      );
    }
    const itag = Number(itagRaw);

    // Fast path: stream the exact signed URL the info route resolved.
    // Re-deciphering on every download is the flaky step, so avoid it.
    if (snapshotUrl) {
      // Bounded 1MB Range requests first: the CDN serves ANDROID/VR-signed
      // URLs quickly via ranges, but plain GETs either 403 or trickle at
      // ~30KB/s (gir=yes URLs).
      const ranged = await openRangeStream(
        snapshotUrl,
        videoId,
        itag,
        request.signal,
      );
      if (ranged) {
        if (ranged.total !== null && ranged.total > maxBytes()) {
          return NextResponse.json(
            {
              ok: false,
              error: "This format is too large to download",
              code: "TOO_LARGE",
            },
            { status: 413 },
          );
        }
        const rangedHeaders: Record<string, string> = {
          "Content-Type":
            ranged.mimeType || "application/octet-stream",
          "Cache-Control": "no-store",
        };
        if (ranged.total !== null && ranged.total > 0) {
          rangedHeaders["Content-Length"] = String(ranged.total);
        }
        return new Response(ranged.stream, { status: 200, headers: rangedHeaders });
      }

      const upstream = await fetchFollowingSafeRedirects(snapshotUrl, {
        headers: YOUTUBE_FETCH_HEADERS,
        signal: request.signal,
      });
      if (!upstream.ok || !upstream.body) {
        console.error(
          "[youtube] upstream fetch failed:",
          upstream.status,
          snapshotUrl.slice(0, 120),
        );
        return NextResponse.json(
          {
            ok: false,
            error: "YouTube stream could not be reached. Try again later.",
            code: "FETCH_FAILED",
          },
          { status: 502 },
        );
      }

      const upstreamLength = Number(
        upstream.headers.get("content-length") || 0,
      );
      if (Number.isFinite(upstreamLength) && upstreamLength > maxBytes()) {
        return NextResponse.json(
          {
            ok: false,
            error: "This format is too large to download",
            code: "TOO_LARGE",
          },
          { status: 413 },
        );
      }

      const headers: Record<string, string> = {
        "Content-Type":
          upstream.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "no-store",
      };
      if (Number.isFinite(upstreamLength) && upstreamLength > 0) {
        headers["Content-Length"] = String(upstreamLength);
      }

      return new Response(upstream.body, { status: 200, headers });
    }

    let info: YoutubeResolvedInfo;
    try {
      info = await resolveYoutubeInfo(videoId, "[youtube] download", {
        signal: request.signal,
      });
    } catch (error) {
      console.error("[youtube] getInfo failed:", error);
      return NextResponse.json(
        {
          ok: false,
          error: "YouTube did not return video data. Try again later.",
          code: "FETCH_FAILED",
        },
        { status: 502 },
      );
    }

    const format = info.formats.find(
      (f) => f.itag === itag && isUsableFormat(f),
    );
    if (!format) {
      return NextResponse.json(
        { ok: false, error: "Format not found", code: "NO_FORMATS" },
        { status: 404 },
      );
    }

    const contentLength = Number(format.contentLength);
    if (Number.isFinite(contentLength) && contentLength > maxBytes()) {
      return NextResponse.json(
        {
          ok: false,
          error: "This format is too large to download",
          code: "TOO_LARGE",
        },
        { status: 413 },
      );
    }

    // The format carries a signed, still-fresh URL from the resolver — hand
    // it to ytdl-core so it streams that URL instead of re-deciphering.
    const stream = ytdl(videoId, {
      format: {
        itag: format.itag,
        url: format.url || undefined,
        mimeType: format.mimeType || undefined,
        hasAudio: format.hasAudio,
        hasVideo: format.hasVideo,
        container: format.container,
        contentLength: format.contentLength || undefined,
      } as ytdl.videoFormat,
      requestOptions: ytdlRequestOptions(),
      playerClients: ["WEB", "TV"],
    });

    stream.on("error", (err) => {
      console.error("[youtube] download stream error:", err);
    });

    // Destroy the upstream ytdl stream when the client goes away. Without this
    // a disconnected client left the download running to completion, burning
    // bandwidth for bytes nobody would receive.
    const onClientAbort = () => stream.destroy();
    request.signal.addEventListener("abort", onClientAbort, { once: true });
    stream.on("close", () =>
      request.signal.removeEventListener("abort", onClientAbort),
    );

    const webStream = Readable.toWeb(stream) as ReadableStream<Uint8Array>;

    const headers: Record<string, string> = {
      "Content-Type": format.mimeType?.split(";")[0]?.trim() || "application/octet-stream",
      "Cache-Control": "no-store",
    };
    if (Number.isFinite(contentLength) && contentLength > 0) {
      headers["Content-Length"] = String(contentLength);
    }

    return new Response(webStream, { status: 200, headers });
  } catch (error) {
    console.error("[youtube] download error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { ok: false, error: "Unexpected error", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
