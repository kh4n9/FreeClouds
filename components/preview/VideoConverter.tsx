"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, X, AlertTriangle, Download } from "lucide-react";
import { useTranslation, commonTranslations } from "../LanguageSwitcher";

const FFMPEG_CORE_JS = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";
const FFMPEG_CORE_WASM = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm";

interface VideoConverterProps {
  file: { name: string; size: number };
  sourceUrl: string;
  onDone: (url: string) => void;
  onCancel: () => void;
}

export default function VideoConverter({
  file,
  sourceUrl,
  onDone,
  onCancel,
}: VideoConverterProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "converting" | "failed">(
    "loading",
  );
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef<{ terminate: () => void } | null>(null);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("loading");
        setProgress(0);

        const [{ FFmpeg }, { fetchFile, toBlobURL }] = await Promise.all([
          import("@ffmpeg/ffmpeg"),
          import("@ffmpeg/util"),
        ]);
        if (cancelled) return;

        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on("progress", ({ progress: p }) => {
          if (!cancelled && typeof p === "number") {
            setProgress(Math.max(0, Math.min(1, p)));
          }
        });
        ffmpeg.on("log", ({ message }) => {
          console.log("[ffmpeg]", message);
        });

        setStatus("converting");
        await ffmpeg.load({
          coreURL: await toBlobURL(FFMPEG_CORE_JS, "text/javascript"),
          wasmURL: await toBlobURL(FFMPEG_CORE_WASM, "application/wasm"),
        });
        if (cancelled) {
          ffmpeg.terminate();
          return;
        }

        const ext = file.name.split(".").pop()?.toLowerCase() || "mov";
        await ffmpeg.writeFile(`input.${ext}`, await fetchFile(sourceUrl));
        if (cancelled) {
          ffmpeg.terminate();
          return;
        }

        await ffmpeg.exec([
          "-i",
          `input.${ext}`,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "26",
          "-c:a",
          "aac",
          "-movflags",
          "+faststart",
          "output.mp4",
        ]);
        if (cancelled) {
          ffmpeg.terminate();
          return;
        }

        const data = (await ffmpeg.readFile("output.mp4")) as Uint8Array;
        const bytes = new Uint8Array(data);
        const url = URL.createObjectURL(
          new Blob([bytes], { type: "video/mp4" }),
        );
        if (cancelled) {
          URL.revokeObjectURL(url);
          ffmpeg.terminate();
          return;
        }
        onDoneRef.current(url);
      } catch (err) {
        console.error("Video conversion failed:", err);
        if (!cancelled) setStatus("failed");
      }
    };

    run();

    return () => {
      cancelled = true;
      ffmpegRef.current?.terminate();
    };
  }, [sourceUrl, file.name]);

  const handleCancel = useCallback(() => {
    ffmpegRef.current?.terminate();
    onCancel();
  }, [onCancel]);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    setProgress(0);
  }, []);

  return (
    <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
      {status === "failed" ? (
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {t("convertFailed", commonTranslations.convertFailed)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Loader2 className="w-4 h-4" />
              {t("retry", commonTranslations.retry)}
            </button>
            <button
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("download", commonTranslations.download)}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">
            {status === "loading"
              ? t("loadingConverter", commonTranslations.loadingConverter)
              : t("convertingVideo", commonTranslations.convertingVideo)}
          </p>
          <div className="bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {status === "converting" ? `${Math.round(progress * 100)}%` : "..."}
          </p>
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mx-auto"
          >
            <X className="w-4 h-4" />
            {t("cancel", commonTranslations.cancel)}
          </button>
        </div>
      )}
    </div>
  );
}
