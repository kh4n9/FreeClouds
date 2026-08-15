import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
} from "@/lib/ratelimit";
import type {
  YoutubeFormatOption,
  YoutubeMp4Option,
} from "@/lib/youtube-types";
import type { YoutubeStreamFormat } from "@/lib/youtube";
import {
  resolveYoutubeInfo,
  isUsableFormat,
} from "@/lib/youtube";
import type { YoutubeResolvedInfo } from "@/lib/youtube";

export const runtime = "nodejs";

const infoSchema = z.object({
  url: z.string().min(1).max(2048),
});

function mimeOf(format: YoutubeStreamFormat): string {
  return format.mimeType?.split(";")[0]?.trim() || "application/octet-stream";
}

function containerOf(format: YoutubeStreamFormat): string {
  return format.container || "";
}

function sizeOf(format: YoutubeStreamFormat): number | null {
  const n = Number(format.contentLength);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) return createCsrfError();

    const rateLimit = checkRateLimit(
      request,
      { maxRequests: 15, windowMs: 5 * 60 * 1000 },
      "youtube-info",
    );
    if (!rateLimit.allowed) {
      return createRateLimitResponse(
        rateLimit.remaining,
        rateLimit.resetTime,
        rateLimit.maxRequests,
      );
    }

    await requireAuth(request);

    const body = await request.json().catch(() => null);
    const parsed = infoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid YouTube URL", code: "INVALID_URL" },
        { status: 400 },
      );
    }

    let videoId: string;
    try {
      videoId = ytdl.getURLVideoID(parsed.data.url);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Not a valid YouTube URL", code: "INVALID_URL" },
        { status: 400 },
      );
    }

    let info: YoutubeResolvedInfo;
    try {
      info = await resolveYoutubeInfo(videoId);
    } catch (error) {
      console.error("[youtube] getInfo failed:", error);
      const message = error instanceof Error ? error.message : "";
      if (/unavailable|removed|not available/i.test(message)) {
        return NextResponse.json(
          {
            ok: false,
            error: "Video is unavailable or has been removed",
            code: "NOT_AVAILABLE",
          },
          { status: 404 },
        );
      }
      if (/sign in to confirm|not a bot|bot check/i.test(message)) {
        return NextResponse.json(
          {
            ok: false,
            error: "YouTube blocked the request from this server. It may be age-restricted or region-locked.",
            code: "BLOCKED",
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        {
          ok: false,
          error: "YouTube did not return video data. Try again later.",
          code: "FETCH_FAILED",
        },
        { status: 502 },
      );
    }

    const details = info.details;
    // Multiple player clients (WEB + TV, etc.) report the same format; keep
    // the first occurrence of each itag.
    const seenItags = new Set<number>();
    const usable = info.formats.filter((f) => {
      if (!isUsableFormat(f)) return false;
      if (seenItags.has(f.itag)) return false;
      seenItags.add(f.itag);
      return true;
    });

    // Progressive MP4 formats (video + audio in one file, no merging needed).
    const progressive = usable
      .filter((f) => f.hasVideo && f.hasAudio && f.container === "mp4")
      .sort((a, b) => (b.height || 0) - (a.height || 0));

    // Audio-only formats, best first (m4a preferred for MP3 conversion).
    const audioFormats = usable
      .filter((f) => f.hasAudio && !f.hasVideo)
      .sort((a, b) => {
        const aIsM4a = containerOf(a) === "m4a" ? 1 : 0;
        const bIsM4a = containerOf(b) === "m4a" ? 1 : 0;
        if (aIsM4a !== bIsM4a) return bIsM4a - aIsM4a;
        return (b.audioBitrate || 0) - (a.audioBitrate || 0);
      });

    // Fallback: when YouTube withholds audio-only URLs, MP3 can still be
    // extracted from a progressive MP4.
    const useProgressiveAudio = audioFormats.length === 0;
    const audioSources = useProgressiveAudio ? progressive : audioFormats;

    const audio: YoutubeFormatOption[] = audioSources.map((f) => ({
      itag: f.itag,
      label: useProgressiveAudio
        ? `${f.qualityLabel || `${f.height || 0}p`} · ${f.container} (progressive)`
        : `${f.audioBitrate || 0} kbps · ${f.container}`,
      mime: mimeOf(f),
      sizeBytes: sizeOf(f),
      container: containerOf(f),
      height: f.height ?? null,
      audioBitrateKbps: f.audioBitrate ? Math.round(f.audioBitrate) : null,
      fromProgressive: useProgressiveAudio,
    }));

    // Video-only MP4 formats for higher qualities (need merging with audio).
    const bestAudio = audioFormats.find((f) => containerOf(f) === "m4a") || null;

    const videoOnlyByHeight = new Map<number, YoutubeStreamFormat>();
    for (const f of usable) {
      if (f.hasVideo && !f.hasAudio && f.container === "mp4" && f.height) {
        const existing = videoOnlyByHeight.get(f.height);
        if (!existing || (f.bitrate || 0) > (existing.bitrate || 0)) {
          videoOnlyByHeight.set(f.height, f);
        }
      }
    }

    const MAX_VIDEO_HEIGHT = 1080;
    const mergeOptions: YoutubeMp4Option[] = [];
    if (bestAudio) {
      const heights = Array.from(videoOnlyByHeight.keys())
        .filter((h) => h >= 360 && h <= MAX_VIDEO_HEIGHT)
        .sort((a, b) => b - a);
      for (const height of heights) {
        const videoFormat = videoOnlyByHeight.get(height);
        if (!videoFormat) continue;
        const videoSize = sizeOf(videoFormat);
        const audioSize = sizeOf(bestAudio);
        mergeOptions.push({
          id: `${height}p`,
          label: `${videoFormat.qualityLabel || `${height}p`}`,
          itags: [videoFormat.itag, bestAudio.itag],
          needsMerge: true,
          sizeBytes:
            videoSize !== null && audioSize !== null
              ? videoSize + audioSize
              : null,
          height,
        });
      }
    }

    const progressiveOptions: YoutubeMp4Option[] = progressive.map((f) => ({
      id: `prog-${f.itag}`,
      label: `${f.qualityLabel || `${f.height || 0}p`}`,
      itags: [f.itag],
      needsMerge: false,
      sizeBytes: sizeOf(f),
      height: f.height || 0,
    }));

    const mp4 = [...mergeOptions, ...progressiveOptions].sort(
      (a, b) => b.height - a.height,
    );

    if (audio.length === 0 && mp4.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "No downloadable format found for this video",
          code: "NO_FORMATS",
        },
        { status: 400 },
      );
    }

    const thumbnails = details.thumbnails;
    const thumbnail =
      thumbnails && thumbnails.length > 0
        ? thumbnails[thumbnails.length - 1]!.url
        : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    const urls: Record<string, string> = {};
    for (const f of usable) {
      if (f.url) urls[String(f.itag)] = f.url;
    }

    return NextResponse.json({
      ok: true,
      videoId,
      title: details.title,
      author: details.authorName,
      durationSeconds: details.lengthSeconds,
      thumbnail,
      audio,
      mp4,
      urls,
    });
  } catch (error) {
    console.error("[youtube] info error:", error);
    if (error instanceof AuthError) return createAuthResponse(error);
    return NextResponse.json(
      { ok: false, error: "Unexpected error", code: "INTERNAL" },
      { status: 500 },
    );
  }
}
