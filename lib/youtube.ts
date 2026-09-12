import ytdl from "@distube/ytdl-core";

export interface YoutubeStreamFormat {
  itag: number;
  url: string | null;
  mimeType: string | null;
  container: string;
  contentLength: string | null;
  bitrate: number | null;
  /** Audio bitrate in kbps (only for audio-only formats). */
  audioBitrate: number | null;
  qualityLabel: string | null;
  height: number | null;
  hasAudio: boolean;
  hasVideo: boolean;
  isLive: boolean;
  isHLS: boolean;
}

export interface YoutubeVideoDetails {
  title: string;
  authorName: string;
  lengthSeconds: number;
  thumbnails: { url: string }[];
}

export interface YoutubeResolvedInfo {
  formats: YoutubeStreamFormat[];
  details: YoutubeVideoDetails;
  source: "vr" | "android" | "ytdl";
}

type YoutubePlayerClient = "WEB_EMBEDDED" | "TV" | "IOS" | "ANDROID" | "WEB";

const CLIENT_COMBOS: YoutubePlayerClient[][] = [
  ["WEB", "TV"],
  ["WEB"],
  ["TV"],
  ["WEB_EMBEDDED"],
  ["IOS"],
  ["ANDROID"],
];

const VR_CLIENT = {
  clientName: "ANDROID_VR",
  clientVersion: "1.60.19",
  androidSdkVersion: 32,
  deviceMake: "Oculus",
  deviceModel: "Quest 3",
  osName: "Android",
  osVersion: "12",
  hl: "en",
  gl: "US",
};

const VR_USER_AGENT =
  "com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12; GB) gzip";

// ANDROID 20.x returns fully-signed URLs (sig+lsig, no n) for videos the VR
// client refuses (pot-gated). The CDN only serves those URLs via bounded
// Range requests (1MB chunks), so downloads use a chunked stream.
const ANDROID_CLIENT = {
  clientName: "ANDROID",
  clientVersion: "20.11.31",
  androidSdkVersion: 30,
  osName: "Android",
  osVersion: "12",
  hl: "en",
  gl: "US",
};

const ANDROID_USER_AGENT =
  "com.google.android.youtube/20.11.31 (Linux; U; Android 12; en_US; sdk_arm64; Google; 128.1.0.0; 3440x1440)";

const INNERTUBE_API = "https://www.youtube.com/youtubei/v1/";

const CONTAINER_FROM_MIME: Record<string, string> = {
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/3gpp": "3gp",
};

function containerOfMime(mimeType: string | null): string {
  const mime = mimeType?.split(";")[0]?.trim() || "";
  return CONTAINER_FROM_MIME[mime] || (mime.startsWith("audio/") ? "m4a" : mime.split("/")[1]?.split("-")[0] || "mp4");
}

export function ytdlRequestOptions() {
  const cookies = process.env.YOUTUBE_COOKIES;
  return cookies ? { headers: { cookie: cookies } } : undefined;
}

let cachedVisitorData: { value: string; expiresAt: number } | null = null;

/** Per-request ceiling for innerTube calls. */
const INNERTUBE_TIMEOUT_MS = 15_000;

/** Overall budget for the whole fallback chain in resolveYoutubeInfo(). */
const RESOLVE_DEADLINE_MS = 45_000;

/**
 * fetch() with a hard timeout.
 *
 * Every YouTube call in this module used a bare fetch with no AbortController,
 * so a hung connection (the CDN does stall connections rather than closing
 * them) pinned the request open indefinitely — and because the download route
 * also never observed the client disconnecting, a user who navigated away left
 * the server downloading to completion.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = INNERTUBE_TIMEOUT_MS,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Abort the upstream fetch as soon as the caller's signal fires (client
  // disconnected) rather than waiting out the timeout.
  const onAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onAbort, { once: true });

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onAbort);
  }
}

/** True when an error came from an aborted request rather than a real failure. */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.message.includes("aborted"))
  );
}


async function fetchVisitorData(
  force = false,
  signal?: AbortSignal,
): Promise<string> {
  const now = Date.now();
  if (!force && cachedVisitorData && cachedVisitorData.expiresAt > now) {
    return cachedVisitorData.value;
  }
  const res = await fetchWithTimeout(`${INNERTUBE_API}visitor_id?prettyPrint=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": YOUTUBE_FETCH_HEADERS["User-Agent"]!,
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20250626.01.00",
          hl: "en",
          gl: "US",
        },
      },
    }),
  }, INNERTUBE_TIMEOUT_MS, signal);
  if (!res.ok) {
    throw new Error(`visitor_id failed: ${res.status}`);
  }
  const json = (await res.json()) as { responseContext?: { visitorData?: string } };
  const value = json.responseContext?.visitorData;
  if (!value) {
    throw new Error("visitor_id returned no visitorData");
  }
  cachedVisitorData = { value, expiresAt: now + 30 * 60 * 1000 };
  return value;
}

async function fetchVrPlayer(
  videoId: string,
  visitorData?: string,
  signal?: AbortSignal,
) {
  const visitor = visitorData ?? (await fetchVisitorData(false, signal));
  const res = await fetchWithTimeout(`${INNERTUBE_API}player?prettyPrint=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": VR_USER_AGENT,
    },
    body: JSON.stringify({
      context: { client: { ...VR_CLIENT, visitorData: visitor } },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
  }, INNERTUBE_TIMEOUT_MS, signal);
  if (!res.ok) {
    throw new Error(`ANDROID_VR player failed: ${res.status}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

async function fetchAndroidPlayer(videoId: string, signal?: AbortSignal) {
  const res = await fetchWithTimeout(`${INNERTUBE_API}player?prettyPrint=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ANDROID_USER_AGENT,
    },
    body: JSON.stringify({
      context: { client: ANDROID_CLIENT },
      videoId,
      contentCheckOk: true,
      racyCheckOk: true,
    }),
  }, INNERTUBE_TIMEOUT_MS, signal);
  if (!res.ok) {
    throw new Error(`ANDROID player failed: ${res.status}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

interface RawFormat {
  itag?: number;
  url?: string;
  mimeType?: string;
  bitrate?: number;
  contentLength?: string;
  width?: number;
  height?: number;
  qualityLabel?: string;
  audioQuality?: string;
  audioSampleRate?: string;
  audioChannels?: number;
}

function normalizeVrFormats(json: Record<string, unknown>): YoutubeStreamFormat[] {
  const streamingData = json.streamingData as
    | { formats?: RawFormat[]; adaptiveFormats?: RawFormat[] }
    | undefined;
  if (!streamingData) return [];
  const raw = [
    ...(streamingData.formats || []),
    ...(streamingData.adaptiveFormats || []),
  ];
  return raw.map((f): YoutubeStreamFormat => {
    const mime = f.mimeType || null;
    const hasHeight = typeof f.height === "number";
    const hasAudioFields = !!(f.audioQuality || f.audioSampleRate || f.audioChannels);
    const isAudioOnly = hasAudioFields && !hasHeight;
    const isHLS = !!f.url?.includes(".m3u8") || (mime || "").includes("mpegurl");
    return {
      itag: f.itag || 0,
      url: f.url || null,
      mimeType: mime,
      container: containerOfMime(mime),
      contentLength: f.contentLength || null,
      bitrate: typeof f.bitrate === "number" ? f.bitrate : null,
      audioBitrate:
        isAudioOnly && typeof f.bitrate === "number"
          ? Math.round(f.bitrate / 1000)
          : null,
      qualityLabel: f.qualityLabel || null,
      height: hasHeight ? (f.height ?? null) : null,
      hasAudio: isAudioOnly || (hasHeight && hasAudioFields),
      hasVideo: hasHeight,
      isLive: false,
      isHLS,
    };
  });
}

function normalizeVrDetails(json: Record<string, unknown>): YoutubeVideoDetails {
  const d = json.videoDetails as
    | {
        title?: string;
        lengthSeconds?: string;
        author?: string | { name?: string };
        thumbnails?: { url?: string }[];
        thumbnail?: { thumbnails?: { url?: string }[] };
        isLiveNow?: boolean;
      }
    | undefined;
  const microformat = json.microformat as
    | { playerMicroformatRenderer?: { ownerChannelName?: string } }
    | undefined;
  const authorRaw = d?.author;
  const authorName =
    typeof authorRaw === "string"
      ? authorRaw
      : authorRaw?.name ||
        microformat?.playerMicroformatRenderer?.ownerChannelName ||
        "Unknown";
  const thumbSource = d?.thumbnails || d?.thumbnail?.thumbnails || [];
  return {
    title: d?.title || "Untitled video",
    authorName,
    lengthSeconds: Number(d?.lengthSeconds) || 0,
    thumbnails: thumbSource
      .map((t) => ({ url: t.url || "" }))
      .filter((t) => t.url !== ""),
  };
}

function ytdlFormatToStream(f: ytdl.videoFormat): YoutubeStreamFormat {
  return {
    itag: f.itag,
    url: f.url || null,
    mimeType: f.mimeType || null,
    container: (f.container as string) || containerOfMime(f.mimeType || null),
    contentLength: f.contentLength || null,
    bitrate: typeof f.bitrate === "number" ? f.bitrate : null,
    audioBitrate:
      f.hasAudio && !f.hasVideo && typeof f.audioBitrate === "number"
        ? Math.round(f.audioBitrate)
        : null,
    qualityLabel: f.qualityLabel || null,
    height: f.height ?? null,
    hasAudio: f.hasAudio,
    hasVideo: f.hasVideo,
    isLive: !!f.isLive,
    isHLS: !!f.isHLS,
  };
}

export function isUsableFormat(format: YoutubeStreamFormat): boolean {
  return (
    !!format.url &&
    format.url.startsWith("https://") &&
    // Pot-gated URLs carry a raw `n` param and 403 on this network; the
    // working clients (ANDROID_VR, ANDROID 20.x) never include it.
    !/[?&]n=/.test(format.url) &&
    !format.isLive &&
    !format.isHLS
  );
}

/**
 * YouTube is currently serving this app's network without decryptable stream
 * URLs to the classic player clients (WEB/TV are pot-gated and ytdl-core's
 * decipher parser is broken against the current player script). Working path:
 * the ANDROID_VR (Oculus Quest) client returns ungated direct URLs for every
 * format when a visitorData token is attached; for pot-gated videos VR
 * refuses, ANDROID 20.x still returns fully-signed URLs (which need bounded
 * Range requests to download). Fall back to @distube/ytdl-core last.
 */
export async function resolveYoutubeInfo(
  videoId: string,
  logPrefix = "[youtube]",
  options: { signal?: AbortSignal; deadlineMs?: number } = {},
): Promise<YoutubeResolvedInfo> {
  const failures: string[] = [];
  const signal = options.signal;
  // Overall budget for the fallback chain. Without one, a video that fails
  // every client could chain 2 VR + 1 ANDROID + 6 ytdl attempts, each with its
  // own timeout, holding the request open for minutes.
  const deadline = Date.now() + (options.deadlineMs ?? RESOLVE_DEADLINE_MS);

  const outOfBudget = () => Date.now() > deadline;

  const vrJson = await (async () => {
    if (outOfBudget()) {
      failures.push("ANDROID_VR: skipped (resolution budget exhausted)");
      return null;
    }
    try {
      const json = await fetchVrPlayer(videoId, undefined, signal);
      const playability = json.playabilityStatus as
        | { status?: string; reason?: string }
        | undefined;
      if (playability?.status && playability.status !== "OK") {
        failures.push(`ANDROID_VR: ${playability.status} ${playability.reason || ""}`);
        return null;
      }
      return json;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      failures.push(`ANDROID_VR: ${msg}`);
      return null;
    }
  })();

  // LOGIN_REQUIRED can be transient bot-flagging of the visitor; retry once
  // with a freshly minted token before giving up on VR.
  const vrJson2 =
    vrJson ?? (await (async () => {
      if (outOfBudget()) {
        failures.push("ANDROID_VR retry: skipped (resolution budget exhausted)");
        return null;
      }
      try {
        const json = await fetchVrPlayer(
          videoId,
          await fetchVisitorData(true, signal),
          signal,
        );
        const playability = json.playabilityStatus as
          | { status?: string; reason?: string }
          | undefined;
        if (playability?.status && playability.status !== "OK") {
          failures.push(`ANDROID_VR retry: ${playability.status} ${playability.reason || ""}`);
          return null;
        }
        return json;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        failures.push(`ANDROID_VR retry: ${msg}`);
        return null;
      }
    })());

  const vrFormats = vrJson2 ? normalizeVrFormats(vrJson2) : [];
  if (vrJson2 && vrFormats.some(isUsableFormat)) {
    console.log(
      `${logPrefix} resolved via ANDROID_VR (${vrFormats.length} formats)`,
    );
    return {
      formats: vrFormats,
      details: normalizeVrDetails(vrJson2),
      source: "vr",
    };
  }
  if (vrJson2) {
    failures.push("ANDROID_VR: no usable formats");
    console.warn(`${logPrefix} ANDROID_VR returned no usable formats`);
  }

  if (outOfBudget()) {
    failures.push("ANDROID: skipped (resolution budget exhausted)");
  } else
  try {
    const json = await fetchAndroidPlayer(videoId, signal);
    const playability = json.playabilityStatus as
      | { status?: string; reason?: string }
      | undefined;
    if (playability?.status && playability.status !== "OK") {
      throw new Error(
        `${playability.status} ${playability.reason || ""}`,
      );
    }
    const formats = normalizeVrFormats(json);
    if (formats.some(isUsableFormat)) {
      console.log(
        `${logPrefix} resolved via ANDROID innerTube (${formats.length} formats)`,
      );
      return {
        formats,
        details: normalizeVrDetails(json),
        source: "android",
      };
    }
    failures.push("ANDROID: no usable formats");
    console.warn(`${logPrefix} ANDROID returned no usable formats`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    failures.push(`ANDROID: ${msg}`);
    console.warn(`${logPrefix} ANDROID failed (${msg})`);
  }

  const requestOptions = ytdlRequestOptions();
  let best: YoutubeResolvedInfo | null = null;
  let bestScore = 0;
  const errors: string[] = [];

  for (const players of CLIENT_COMBOS) {
    // The ytdl path can try six client combos; stop once the budget is gone.
    if (outOfBudget()) {
      errors.push("ytdl-core: skipped (resolution budget exhausted)");
      break;
    }
    try {
      const info = await ytdl.getInfo(videoId, {
        playerClients: players,
        requestOptions,
      });
      const formats = info.formats.map(ytdlFormatToStream);
      const score = formats.filter(isUsableFormat).length;
      if (score > bestScore) {
        best = {
          formats,
          details: {
            title: info.videoDetails.title,
            authorName: info.videoDetails.author.name,
            lengthSeconds: Number(info.videoDetails.lengthSeconds) || 0,
            thumbnails: info.videoDetails.thumbnails.map((t) => ({ url: t.url })),
          },
          source: "ytdl",
        };
        bestScore = score;
      }
      if (score > 0) {
        console.log(
          `${logPrefix} resolved via ytdl-core ${players.join("+")} (${score} usable formats)`,
        );
        return best!;
      }
      errors.push(`${players.join("+")}: no playable formats`);
    } catch (error) {
      errors.push(
        `${players.join("+")}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  if (best) return best;
  throw new Error(`All player clients failed: ${[...failures, ...errors].join(" | ")}`);
}

const SAFE_STREAM_HOST_RE = /(^|\.)(googlevideo|youtube|ytimg)\.com$/i;

/**
 * The download route streams the exact URL returned by the info route instead
 * of re-resolving. Only accept signed googlevideo/youtube URLs to avoid
 * turning the route into an open proxy.
 */
export function isSafeStreamUrl(url: string): boolean {
  if (!url || url.length > 2000 || !url.startsWith("https://")) return false;
  try {
    const parsed = new URL(url);
    return SAFE_STREAM_HOST_RE.test(parsed.hostname) && url.includes("expire=");
  } catch {
    return false;
  }
}

export const YOUTUBE_FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Referer: "https://www.youtube.com/",
};

/**
 * The CDN rate-limits a signed URL after roughly ~25MB of range downloads.
 * Long downloads rotate to a freshly resolved URL (same itag, same file,
 * fresh quota) — the same trick the official apps use.
 */
export async function rotateYoutubeStreamUrl(
  videoId: string,
  itag: number,
  options: { signal?: AbortSignal; logPrefix?: string } = {},
): Promise<string | null> {
  const logPrefix = options.logPrefix ?? "[youtube]";
  try {
    // Rotation re-runs the whole resolver, so it must respect the same abort
    // signal and budget as the stream that is asking for a fresh URL.
    const info = await resolveYoutubeInfo(videoId, logPrefix, {
      // exactOptionalPropertyTypes: only include signal when it is defined.
      ...(options.signal ? { signal: options.signal } : {}),
    });
    const format = info.formats.find(
      (f) => f.itag === itag && isUsableFormat(f),
    );
    return format?.url ?? null;
  } catch (error) {
    console.warn(
      `${logPrefix} rotation failed (${error instanceof Error ? error.message : String(error)})`,
    );
    return null;
  }
}
