"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Youtube,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Music2,
  Film,
  ArrowRight,
  Download,
} from "lucide-react";
import { useTranslation, commonTranslations } from "@/components/LanguageSwitcher";
import { uploadBlobToCloud } from "@/lib/upload-client";
import type { YoutubeInfoResponse } from "@/lib/youtube-types";

const FFMPEG_CORE_JS = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";
const FFMPEG_CORE_WASM = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm";

interface FfmpegInstance {
  load: (opts: { coreURL: string; wasmURL: string }) => Promise<void>;
  writeFile: (path: string, data: unknown) => Promise<void>;
  readFile: (path: string) => Promise<Uint8Array>;
  exec: (args: string[]) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  on: (
    event: string,
    cb: (arg: { progress?: number; message?: string }) => void,
  ) => void;
  terminate: () => void;
}

type Phase = "idle" | "fetching" | "downloading" | "converting" | "uploading" | "done";

const BITRATES = ["128", "192", "320"] as const;

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function sanitizeFileName(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
  return cleaned || "youtube-video";
}

function translateApiError(
  code: string | undefined,
  fallback: string | undefined,
  t: (key: string, translations: Record<string, string>) => string,
): string {
  const map: Record<string, string> = {
    INVALID_URL: t("youtubeInvalidUrl", commonTranslations.youtubeInvalidUrl),
    BLOCKED: t("youtubeBlocked", commonTranslations.youtubeBlocked),
    NO_FORMATS: t("youtubeNoFormats", commonTranslations.youtubeNoFormats),
    NOT_AVAILABLE: t("youtubeNotAvailable", commonTranslations.youtubeNotAvailable),
    TOO_LARGE: t("youtubeTooLarge", commonTranslations.youtubeTooLarge),
  };
  return (
    (code && map[code]) ||
    fallback ||
    t("youtubeFailed", commonTranslations.youtubeFailed)
  );
}

interface YoutubeModalProps {
  folderId: string | null;
  onUploaded: () => void;
  onClose: () => void;
}

export default function YoutubeModal({
  folderId,
  onUploaded,
  onClose,
}: YoutubeModalProps) {
  const { t } = useTranslation();

  const [url, setUrl] = useState("");
  const [info, setInfo] = useState<YoutubeInfoResponse | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"mp4" | "mp3">("mp4");
  const [mp4OptionId, setMp4OptionId] = useState("");
  const [mp3Bitrate, setMp3Bitrate] = useState<(typeof BITRATES)[number]>("192");

  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const ffmpegRef = useRef<FfmpegInstance | null>(null);
  const progressRef = useRef<((p: number) => void) | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      ffmpegRef.current?.terminate();
    };
  }, []);

  const getFfmpeg = useCallback(async (): Promise<FfmpegInstance> => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);
    const ffmpeg = new FFmpeg() as unknown as FfmpegInstance;
    ffmpegRef.current = ffmpeg;
    ffmpeg.on("progress", ({ progress: p }) => {
      if (typeof p === "number") {
        progressRef.current?.(Math.max(0, Math.min(1, p)));
      }
    });
    ffmpeg.on("log", ({ message }) => {
      console.log("[ffmpeg]", message);
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(FFMPEG_CORE_JS, "text/javascript"),
      wasmURL: await toBlobURL(FFMPEG_CORE_WASM, "application/wasm"),
    });
    return ffmpeg;
  }, []);

  const handleFetch = useCallback(async () => {
    if (!url.trim()) {
      setError(t("youtubeInvalidUrl", commonTranslations.youtubeInvalidUrl));
      return;
    }
    setFetching(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/youtube/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = (await res.json().catch(() => null)) as
        | YoutubeInfoResponse
        | { ok: false; error?: string; code?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setError(
          translateApiError(
            (data as { code?: string } | null)?.code,
            (data as { error?: string } | null)?.error,
            t,
          ),
        );
        return;
      }
      setInfo(data);
      const bestMp4 = data.mp4[0];
      setMp4OptionId(bestMp4 ? bestMp4.id : "");
    } catch {
      setError(t("youtubeFailed", commonTranslations.youtubeFailed));
    } finally {
      setFetching(false);
    }
  }, [url, t]);

  const downloadItag = useCallback(
    async (itag: number, onFrac: (frac: number) => void): Promise<Blob> => {
      const controller = new AbortController();
      abortRef.current = controller;
      const snapshotUrl = info!.urls[String(itag)];
      const urlParam = snapshotUrl
        ? `&url=${encodeURIComponent(snapshotUrl)}`
        : "";
      const res = await fetch(
        `/api/youtube/download?videoId=${encodeURIComponent(info!.videoId)}&itag=${itag}${urlParam}`,
        { signal: controller.signal },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
          code?: string;
        } | null;
        throw new Error(translateApiError(data?.code, data?.error, t));
      }
      if (!res.body) throw new Error("empty-response");
      const total = Number(res.headers.get("content-length") || 0);
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) onFrac(received / total);
      }
      if (total === 0) onFrac(1);
      return new Blob(chunks as unknown as BlobPart[], {
        type: res.headers.get("content-type") || "application/octet-stream",
      });
    },
    [info, t],
  );

  const handleStart = useCallback(async () => {
    if (!info) return;
    setError(null);
    setBusy(true);
    setProgress(0);
    setStep(0);

    const title = sanitizeFileName(info.title);
    const audioOption = info.audio[0];
    const mp4Option = info.mp4.find((o) => o.id === mp4OptionId);

    try {
      if (mode === "mp3") {
        if (!audioOption) {
          setError(t("youtubeNoFormats", commonTranslations.youtubeNoFormats));
          return;
        }
        setPhase("downloading");
        const audioBlob = await downloadItag(audioOption.itag, (frac) =>
          setProgress(frac * 100),
        );
        setStep(1);
        setPhase("converting");
        setProgress(0);
        progressRef.current = (p) => setProgress(p * 100);

        const { fetchFile } = await import("@ffmpeg/util");
        const ffmpeg = await getFfmpeg();
        const container =
          audioOption.container === "m4a" ||
          audioOption.container === "webm" ||
          audioOption.container === "mp4"
            ? audioOption.container
            : "webm";
        await ffmpeg.writeFile(`input.${container}`, await fetchFile(audioBlob));
        await ffmpeg.exec([
          "-i",
          `input.${container}`,
          "-map",
          "0:a:0",
          "-c:a",
          "libmp3lame",
          "-b:a",
          `${mp3Bitrate}k`,
          "output.mp3",
        ]);
        const data = await ffmpeg.readFile("output.mp3");
        const mp3Blob = new Blob([new Uint8Array(data)], { type: "audio/mpeg" });
        ffmpeg.deleteFile(`input.${container}`).catch(() => {});
        ffmpeg.deleteFile("output.mp3").catch(() => {});

        setStep(2);
        setPhase("uploading");
        setProgress(0);
        progressRef.current = null;
        await uploadBlobToCloud(
          mp3Blob,
          `${title}.mp3`,
          "audio/mpeg",
          folderId,
          (p) => setProgress(p),
        );
      } else {
        if (!mp4Option) {
          setError(t("youtubeNoFormats", commonTranslations.youtubeNoFormats));
          return;
        }

        const itags = mp4Option.itags;
        if (!mp4Option.needsMerge) {
          setPhase("downloading");
          const videoBlob = await downloadItag(itags[0]!, (frac) =>
            setProgress(frac * 100),
          );
          setStep(1);
          setPhase("uploading");
          setProgress(0);
          await uploadBlobToCloud(
            videoBlob,
            `${title}-${mp4Option.label}.mp4`,
            videoBlob.type || "video/mp4",
            folderId,
            (p) => setProgress(p),
          );
        } else {
          setPhase("downloading");
          const videoBlob = await downloadItag(itags[0]!, (frac) =>
            setProgress(frac * 0.5 * 100),
          );
          setStep(1);
          const audioBlob = await downloadItag(itags[1]!, (frac) =>
            setProgress(50 + frac * 0.5 * 100),
          );
          setStep(2);
          setPhase("converting");
          setProgress(0);
          progressRef.current = (p) => setProgress(p * 100);

          const { fetchFile } = await import("@ffmpeg/util");
          const ffmpeg = await getFfmpeg();
          await ffmpeg.writeFile("video.mp4", await fetchFile(videoBlob));
          await ffmpeg.writeFile("audio.m4a", await fetchFile(audioBlob));
          await ffmpeg.exec([
            "-i",
            "video.mp4",
            "-i",
            "audio.m4a",
            "-c",
            "copy",
            "-movflags",
            "+faststart",
            "output.mp4",
          ]);
          const data = await ffmpeg.readFile("output.mp4");
          const mp4Blob = new Blob([new Uint8Array(data)], {
            type: "video/mp4",
          });
          ffmpeg.deleteFile("video.mp4").catch(() => {});
          ffmpeg.deleteFile("audio.m4a").catch(() => {});
          ffmpeg.deleteFile("output.mp4").catch(() => {});

          setStep(3);
          setPhase("uploading");
          setProgress(0);
          progressRef.current = null;
          await uploadBlobToCloud(
            mp4Blob,
            `${title}-${mp4Option.label}.mp4`,
            "video/mp4",
            folderId,
            (p) => setProgress(p),
          );
        }
      }

      setStep(0);
      setPhase("done");
      onUploaded();
    } catch (e) {
      console.error("[youtube] extraction failed:", e);
      if (e instanceof DOMException && e.name === "AbortError") return;
      setPhase("idle");
      setError(
        e instanceof Error
          ? translateApiError(undefined, e.message, t)
          : t("youtubeFailed", commonTranslations.youtubeFailed),
      );
    } finally {
      setBusy(false);
    }
  }, [
    info,
    mode,
    mp4OptionId,
    mp3Bitrate,
    folderId,
    downloadItag,
    getFfmpeg,
    onUploaded,
    t,
  ]);

  const needsMerge = info?.mp4.find((o) => o.id === mp4OptionId)?.needsMerge;
  const active = phase !== "idle" && phase !== "done";
  const percent = Math.round(progress);

  return (
    <div className="flex flex-col gap-4">
      {phase === "done" ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">
            {t("youtubeDone", commonTranslations.youtubeDone)}
          </p>
          <p className="text-sm text-muted mb-6">
            {t("youtubeSavedToFolder", commonTranslations.youtubeSavedToFolder)}
          </p>
          <button
            onClick={onClose}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm"
          >
            {t("close", commonTranslations.close)}
          </button>
        </div>
      ) : (
        <>
          {!info ? (
            <div>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-card border border-line focus-within:border-accent transition-colors">
                  <Youtube className="w-4 h-4 text-error flex-shrink-0" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFetch();
                    }}
                    placeholder={t(
                      "youtubeUrlPlaceholder",
                      commonTranslations.youtubeUrlPlaceholder,
                    )}
                    disabled={fetching}
                    className="w-full bg-transparent outline-none text-sm text-foreground placeholder:text-muted"
                  />
                </div>
                <button
                  onClick={handleFetch}
                  disabled={fetching}
                  className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {fetching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {t("youtubeFetch", commonTranslations.youtubeFetch)}
                  </span>
                </button>
              </div>
              {fetching && (
                <p className="text-sm text-muted mt-3 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  {t("youtubeFetching", commonTranslations.youtubeFetching)}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <img
                  src={info.thumbnail}
                  alt={info.title}
                  className="w-32 h-20 rounded-xl object-cover bg-card border border-line flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    {info.title}
                  </p>
                  <p className="text-xs text-muted mt-1">
                    {info.author}
                    {info.durationSeconds > 0
                      ? ` · ${formatDuration(info.durationSeconds)}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("mp4")}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    mode === "mp4"
                      ? "bg-accent text-white"
                      : "bg-card border border-line text-muted hover:text-foreground"
                  }`}
                >
                  <Film className="w-4 h-4" /> MP4
                </button>
                <button
                  onClick={() => setMode("mp3")}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    mode === "mp3"
                      ? "bg-accent text-white"
                      : "bg-card border border-line text-muted hover:text-foreground"
                  }`}
                >
                  <Music2 className="w-4 h-4" /> MP3
                </button>
              </div>

              {mode === "mp4" ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("youtubeQuality", commonTranslations.youtubeQuality)}
                  </p>
                  {info.mp4.map((option) => {
                    const size = formatSize(option.sizeBytes);
                    return (
                      <label
                        key={option.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                          mp4OptionId === option.id
                            ? "border-accent bg-accent/10"
                            : "border-line bg-card hover:border-line-hover"
                        }`}
                      >
                        <input
                          type="radio"
                          name="mp4-option"
                          checked={mp4OptionId === option.id}
                          onChange={() => setMp4OptionId(option.id)}
                          className="accent-current text-accent"
                        />
                        <span className="text-sm font-medium text-foreground">
                          {option.label}
                        </span>
                        {!option.needsMerge && (
                          <span className="text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                            {t("youtubeDirect", commonTranslations.youtubeDirect)}
                          </span>
                        )}
                        {size && (
                          <span className="ml-auto text-xs text-muted">
                            ~{size}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {t("youtubeBitrate", commonTranslations.youtubeBitrate)}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {BITRATES.map((b) => (
                      <button
                        key={b}
                        onClick={() => setMp3Bitrate(b)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          mp3Bitrate === b
                            ? "bg-accent text-white"
                            : "bg-card border border-line text-muted hover:text-foreground"
                        }`}
                      >
                        {b} kbps
                      </button>
                    ))}
                  </div>
                  {info.audio[0] && (
                    <p className="text-xs text-muted">
                      {info.audio[0].label}
                      {formatSize(info.audio[0].sizeBytes)
                        ? ` · ~${formatSize(info.audio[0].sizeBytes)}`
                        : ""}
                    </p>
                  )}
                </div>
              )}

              {active && (
                <div className="flex flex-col gap-2">
                  <div className="bg-card rounded-full h-2.5 overflow-hidden border border-line">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted flex items-center justify-between">
                    <span>
                      {phase === "downloading" &&
                        t("youtubeDownloading", commonTranslations.youtubeDownloading)}
                      {phase === "converting" &&
                        (mode === "mp4"
                          ? t("youtubeMerging", commonTranslations.youtubeMerging)
                          : t("youtubeConverting", commonTranslations.youtubeConverting))}
                      {phase === "uploading" &&
                        t("youtubeUploading", commonTranslations.youtubeUploading)}
                    </span>
                    <span>
                      {phase === "downloading" && needsMerge
                        ? `${step + 1}/2`
                        : phase === "downloading"
                          ? ""
                          : `${percent}%`}
                    </span>
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-error/10 border border-error/20 text-error">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm flex-1">{error}</p>
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={busy}
                className="btn-primary w-full px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {t("youtubeDownload", commonTranslations.youtubeDownload)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}