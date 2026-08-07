"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ImagePlus,
  RotateCw,
  Scan,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  FileText,
  X,
  FileImage,
  Layers,
} from "lucide-react";
import { useTranslation } from "../LanguageSwitcher";
import {
  loadImageFromUrl,
  loadOpenCV,
  detectDocumentCorners,
  processPage,
  canvasToJpegBlob,
  buildPdfBlob,
  orderCorners,
  dpiToMaxDim,
  type Corner,
  type FilterMode,
} from "@/lib/scanner";
import { uploadBlobToCloud } from "@/lib/upload-client";

export interface ScanSourceFile {
  id: string;
  name: string;
  size: number;
  mime: string;
}

interface Page {
  id: string;
  name: string;
  mime: string;
  sourceUrl: string;
  img: HTMLImageElement | null;
  width: number;
  height: number;
  corners: Corner[] | null;
  cornerState: "none" | "manual";
  processed: HTMLCanvasElement | null;
  processedUrl: string | null;
  processing: boolean;
  detection: boolean;
  error: string | null;
}

interface Settings {
  filter: FilterMode;
  brightness: number;
  contrast: number;
  saturation: number;
  rotate90: number;
}

interface DocumentScannerProps {
  files?: ScanSourceFile[];
  folderId?: string | null;
  onClose: () => void;
  onDone?: (saved: { images: number; pdf: boolean; names: string[] }) => void;
}

const PREVIEW_MAX_DIM = 1280;
const DEFAULT_SETTINGS: Settings = {
  filter: "enhance",
  brightness: 0,
  contrast: 0,
  saturation: 0,
  rotate90: 0,
};

function stem(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function sanitizePrefix(value: string): string {
  const s = value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 96);
  return s || "scan";
}

const FILTER_OPTIONS: { value: FilterMode; en: string; vi: string }[] = [
  { value: "enhance", en: "Magic color", vi: "Màu thật" },
  { value: "gray", en: "Grayscale", vi: "Xám" },
  { value: "bw", en: "B&W", vi: "Đen trắng" },
];

export default function DocumentScanner({
  files = [],
  folderId = null,
  onClose,
  onDone,
}: DocumentScannerProps) {
  const { t } = useTranslation();
  const tr = useCallback(
    (en: string, vi: string) => t(en, { en, vi }),
    [t],
  );

  const [pages, setPages] = useState<Page[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [engineState, setEngineState] = useState<
    "idle" | "loading" | "ready" | "failed"
  >("loading");
  const [viewTab, setViewTab] = useState<"source" | "result">("source");
  const [step, setStep] = useState<"edit" | "save">("edit");
  const [adding, setAdding] = useState(false);
  const [format, setFormat] = useState<"images" | "pdf" | "both">("pdf");
  const [dpi, setDpi] = useState<150 | 200 | 300>(200);
  const [prefix, setPrefix] = useState("scan");
  const [saving, setSaving] = useState<{
    state: "idle" | "working" | "done" | "error";
    progress: number;
    message: string | null;
    error: string | null;
  }>({ state: "idle", progress: 0, message: null, error: null });
  const [addWarn, setAddWarn] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceImgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{ cornerIndex: number; pageId: string } | null>(null);

  const selectedPage = pages.find((p) => p.id === selectedId) || null;

  const updatePage = useCallback((id: string, patch: Partial<Page>) => {
    setPages((prev) =>
      prev.some((p) => p.id === id)
        ? prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
        : prev,
    );
  }, []);

  /* ---------- engine warmup ---------- */
  useEffect(() => {
    let cancelled = false;
    loadOpenCV()
      .then(() => {
        if (!cancelled) setEngineState("ready");
      })
      .catch(() => {
        if (!cancelled) setEngineState("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- page processing ---------- */
  const reprocessPage = useCallback(
    async (page: Page, maxDimOverride?: number) => {
      if (!page.img) return;
      updatePage(page.id, { processing: true, error: null });
      try {
        const canvas = await processPage(
          page.img,
          page.width,
          page.height,
          page.corners,
          {
            filter: settings.filter,
            brightness: settings.brightness,
            contrast: settings.contrast,
            saturation: settings.saturation,
            rotate90: settings.rotate90,
            maxDim: maxDimOverride ?? PREVIEW_MAX_DIM,
            jpegQuality: 0.9,
          },
        );
        updatePage(page.id, { processed: canvas, processedUrl: canvas.toDataURL("image/jpeg", 0.8) });
      } catch (err) {
        updatePage(page.id, {
          error:
            err instanceof Error && err.message === "image_decode_failed"
              ? tr("Unsupported image format", "Định dạng ảnh không được hỗ trợ")
              : tr("Processing failed", "Xử lý thất bại"),
        });
      } finally {
        updatePage(page.id, { processing: false });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings, updatePage],
  );

  const autoDetect = useCallback(
    async (page: Page) => {
      if (!page.img) return;
      updatePage(page.id, { detection: true });
      try {
        const corners = await detectDocumentCorners(page.img, page.width, page.height);
        if (corners && corners.length === 4) {
          updatePage(page.id, { corners: orderCorners(corners) });
        } else {
          updatePage(page.id, { corners: null });
        }
      } catch {
        updatePage(page.id, { corners: null });
      } finally {
        updatePage(page.id, { detection: false });
        void reprocessPage(page);
      }
    },
    [updatePage, reprocessPage],
  );

  const addSource = useCallback(
    async (src: { url: string; name: string; mime: string }) => {
      const id = crypto.randomUUID();
      try {
        const img = await loadImageFromUrl(src.url);
        const page: Page = {
          id,
          name: stem(src.name),
          mime: src.mime,
          sourceUrl: src.url,
          img,
          width: img.naturalWidth,
          height: img.naturalHeight,
          corners: null,
          cornerState: "none",
          processed: null,
          processedUrl: null,
          processing: false,
          detection: false,
          error: null,
        };
        setPages((prev) => [...prev, page]);
        setSelectedId(id);
        void autoDetect(page);
      } catch {
        setPages((prev) => [
          ...prev,
          {
            id,
            name: stem(src.name),
            mime: src.mime,
            sourceUrl: src.url,
            img: null,
            width: 0,
            height: 0,
            corners: null,
            cornerState: "none",
            processed: null,
            processedUrl: null,
            processing: false,
            detection: false,
            error: tr("Unsupported image format", "Định dạng ảnh không được hỗ trợ"),
          },
        ]);
        setSelectedId(id);
      }
    },
    [autoDetect, tr],
  );

  /* ---------- initial cloud files ---------- */
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (const f of files) {
        if (cancelled) return;
        try {
          const resp = await fetch(`/api/files/${f.id}/download`);
          if (!resp.ok) continue;
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          await addSource({ url, name: f.name, mime: f.mime || blob.type });
        } catch {
          // skip unreadable file
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- debounced reprocess on setting/corner change ---------- */
  const selectedRef = useRef<Page | null>(null);
  useEffect(() => {
    selectedRef.current = selectedPage;
  }, [selectedPage]);

  const selectedCorners = selectedPage?.corners;

  useEffect(() => {
    if (step !== "edit") return;
    const timer = setTimeout(() => {
      const p = selectedRef.current;
      if (p && p.img) void reprocessPage(p);
    }, 400);
    return () => clearTimeout(timer);
  }, [
    settings.filter,
    settings.brightness,
    settings.contrast,
    settings.saturation,
    settings.rotate90,
    selectedId,
    selectedCorners,
    step,
    reprocessPage,
  ]);

  /* ---------- add photos from file input ---------- */
  const handleAddFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setAdding(true);
      setAddWarn(null);
      const urls: string[] = [];
      let skipped = 0;
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith("image/")) {
          skipped++;
          continue;
        }
        const url = URL.createObjectURL(file);
        urls.push(url);
        await addSource({ url, name: file.name, mime: file.type });
      }
      if (skipped > 0) {
        setAddWarn(
          tr(
            `${skipped} non-image file(s) were skipped`,
            `Đã bỏ qua ${skipped} tệp không phải ảnh`,
          ),
        );
      }
      setAdding(false);
    },
    [addSource, tr],
  );

  /* ---------- page operations ---------- */
  const removePage = useCallback(
    (id: string) => {
      setPages((prev) => {
        const target = prev.find((p) => p.id === id);
        if (target) URL.revokeObjectURL(target.sourceUrl);
        const next = prev.filter((p) => p.id !== id);
        if (selectedId === id) {
          setSelectedId(next.length > 0 ? (next[0] as Page).id : null);
        }
        return next;
      });
    },
    [selectedId],
  );

  const movePage = useCallback((id: string, dir: -1 | 1) => {
    setPages((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      const to = idx + dir;
      if (idx === -1 || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [page] = next.splice(idx, 1);
      next.splice(to, 0, page as Page);
      return next;
    });
  }, []);

  /* ---------- corner dragging ---------- */
  const handleCornerPointerDown = useCallback(
    (e: React.PointerEvent, cornerIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      const page = selectedRef.current;
      const imgEl = sourceImgRef.current;
      if (!page || !page.img || !imgEl || !page.corners) return;
      dragRef.current = { cornerIndex, pageId: page.id };

      const rect = imgEl.getBoundingClientRect();
      const onMove = (ev: PointerEvent) => {
        if (!dragRef.current) return;
        const pageNow = selectedRef.current;
        if (!pageNow?.corners) return;
        const x = Math.min(
          pageNow.width,
          Math.max(0, ((ev.clientX - rect.left) / rect.width) * pageNow.width),
        );
        const y = Math.min(
          pageNow.height,
          Math.max(0, ((ev.clientY - rect.top) / rect.height) * pageNow.height),
        );
        const corners = pageNow.corners.map((c, i) =>
          i === dragRef.current?.cornerIndex ? { x, y } : c,
        );
        updatePage(pageNow.id, { corners, cornerState: "manual" });
      };
      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [updatePage],
  );

  const resetCorners = useCallback(() => {
    const page = selectedRef.current;
    if (!page) return;
    updatePage(page.id, {
      corners: [
        { x: 0, y: 0 },
        { x: page.width, y: 0 },
        { x: page.width, y: page.height },
        { x: 0, y: page.height },
      ],
      cornerState: "manual",
    });
  }, [updatePage]);

  const runAutoDetect = useCallback(() => {
    const page = selectedRef.current;
    if (page) void autoDetect(page);
  }, [autoDetect]);

  /* ---------- save ---------- */
  const handleSave = useCallback(async () => {
    if (pages.length === 0 || saving.state === "working") return;
    setSaving({
      state: "working",
      progress: 0,
      message: tr("Scanning pages...", "Đang xử lý các trang..."),
      error: null,
    });

    const saveMaxDim = dpiToMaxDim(dpi);
    const names: string[] = [];
    let imagesCount = 0;
    let pdfSaved = false;

    try {
      const processed: { canvas: HTMLCanvasElement; blob: Blob }[] = [];
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as Page;
        setSaving((s) => ({
          ...s,
          progress: Math.round((i / pages.length) * 60),
          message: tr(
            `Scanning page ${i + 1}/${pages.length}`,
            `Đang xử lý trang ${i + 1}/${pages.length}`,
          ),
        }));
        const canvas = await processPage(
          page.img as HTMLImageElement,
          page.width,
          page.height,
          page.corners,
          {
            filter: settings.filter,
            brightness: settings.brightness,
            contrast: settings.contrast,
            saturation: settings.saturation,
            rotate90: settings.rotate90,
            maxDim: saveMaxDim,
            jpegQuality: 0.92,
          },
        );
        const blob = await canvasToJpegBlob(canvas, 0.92);
        processed.push({ canvas, blob });
      }

      if (format === "images" || format === "both") {
        for (let i = 0; i < processed.length; i++) {
          const name = `${sanitizePrefix(prefix)}_${String(i + 1).padStart(2, "0")}.jpg`;
          names.push(name);
          setSaving((s) => ({
            ...s,
            progress:
              Math.round(60 + ((i + 1) / processed.length) * 30),
            message: tr(`Uploading ${name}`, `Đang tải lên ${name}`),
          }));
          await uploadBlobToCloud(
            (processed[i] as { blob: Blob }).blob,
            name,
            "image/jpeg",
            folderId,
          );
          imagesCount++;
        }
      }

      if (format === "pdf" || format === "both") {
        const pdfName = `${sanitizePrefix(prefix)}.pdf`;
        names.push(pdfName);
        setSaving((s) => ({
          ...s,
          progress: 92,
          message: tr("Creating PDF...", "Đang tạo PDF..."),
        }));
        const pdfBlob = await buildPdfBlob(
          processed.map((p) => ({
            blob: p.blob,
            width: p.canvas.width,
            height: p.canvas.height,
          })),
        );
        setSaving((s) => ({
          ...s,
          progress: 95,
          message: tr("Uploading PDF...", "Đang tải lên PDF..."),
        }));
        await uploadBlobToCloud(
          pdfBlob,
          pdfName,
          "application/pdf",
          folderId,
        );
        pdfSaved = true;
      }

      setSaving({
        state: "done",
        progress: 100,
        message: tr("Saved successfully", "Đã lưu thành công"),
        error: null,
      });
      onDone?.({ images: imagesCount, pdf: pdfSaved, names });
    } catch (err) {
      setSaving({
        state: "error",
        progress: 0,
        message: null,
        error:
          err instanceof Error ? err.message : tr("Save failed", "Lưu thất bại"),
      });
    }
  }, [pages, saving.state, dpi, format, prefix, settings, folderId, onDone, tr]);

  /* ---------- close key ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (saving.state === "working") return;
        onClose();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose, saving.state]);

  /* ---------- cleanup object urls ---------- */
  useEffect(() => {
    return () => {
      setPages((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.sourceUrl));
        return prev;
      });
    };
  }, []);

  const isWorking = saving.state === "working";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => {
          if (!isWorking) onClose();
        }}
      />
      <div className="relative modal-content w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center">
              <Scan className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">
                {tr("Document Scanner", "Quét tài liệu")}
              </h3>
              <p className="text-xs text-slate-400">
                {tr(
                  "Scan photos of paper into clean images or PDF",
                  "Quét ảnh giấy tờ thành ảnh hoặc PDF sạch",
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isWorking}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 px-6 pt-4 shrink-0">
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              step === "edit"
                ? "bg-sky-500/20 text-sky-300"
                : "bg-slate-700/40 text-slate-400"
            }`}
          >
            {tr("1. Adjust pages", "1. Chỉnh trang")}
          </span>
          <div className="w-6 h-px bg-slate-700" />
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              step === "save"
                ? "bg-sky-500/20 text-sky-300"
                : "bg-slate-700/40 text-slate-400"
            }`}
          >
            {tr("2. Save", "2. Lưu")}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {pages.length === 0 ? (
            <EmptyState
              adding={adding}
              onAdd={() => fileInputRef.current?.click()}
            />
          ) : step === "edit" ? (
            <EditView
              pages={pages}
              selectedPage={selectedPage}
              settings={settings}
              setSettings={setSettings}
              viewTab={viewTab}
              setViewTab={setViewTab}
              sourceImgRef={sourceImgRef}
              onCornerPointerDown={handleCornerPointerDown}
              onResetCorners={resetCorners}
              onAutoDetect={runAutoDetect}
              onSelect={setSelectedId}
              onRemove={removePage}
              onMove={movePage}
              engineState={engineState}
              tr={tr}
              fileInputRef={fileInputRef}
              addWarn={addWarn}
            />
          ) : (
            <SaveView
              pages={pages}
              format={format}
              setFormat={setFormat}
              dpi={dpi}
              setDpi={setDpi}
              prefix={prefix}
              setPrefix={setPrefix}
              saving={saving}
              onSave={handleSave}
              onDone={onClose}
              tr={tr}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/50 shrink-0">
          {step === "edit" ? (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isWorking}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-600/60 text-slate-300 hover:bg-slate-700/40 disabled:opacity-40 transition-all"
              >
                <ImagePlus className="w-4 h-4" />
                {tr("Add photos", "Thêm ảnh")}
              </button>
              <button
                onClick={() => setStep("save")}
                disabled={pages.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium btn-primary disabled:opacity-50 transition-all"
              >
                {tr("Next", "Tiếp")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("edit")}
                disabled={isWorking}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-600/60 text-slate-300 hover:bg-slate-700/40 disabled:opacity-40 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                {tr("Back", "Quay lại")}
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isWorking || saving.state === "done"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 transition-all"
              >
                {isWorking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Scan className="w-4 h-4" />
                )}
                {tr("Scan & Save to cloud", "Quét & lưu lên cloud")}
              </button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({
  adding,
  onAdd,
}: {
  adding: boolean;
  onAdd: () => void;
}) {
  const { t } = useTranslation();
  const tr = (en: string, vi: string) => t(en, { en, vi });
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-5">
        {adding ? (
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
        ) : (
          <Scan className="w-8 h-8 text-sky-400" />
        )}
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">
        {tr("Add photos of your documents", "Thêm ảnh chụp giấy tờ của bạn")}
      </h4>
      <p className="text-sm text-slate-400 max-w-md mb-6">
        {tr(
          "Select one or multiple photos of paper documents. We will detect the paper edges, straighten and enhance them automatically.",
          "Chọn một hoặc nhiều ảnh chụp giấy tờ. Chúng tôi sẽ tự động nhận diện mép giấy, căn chỉnh và làm rõ ảnh.",
        )}
      </p>
      <button
        onClick={onAdd}
        disabled={adding}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-sky-500/25 disabled:opacity-50 transition-all"
      >
        {adding ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImagePlus className="w-4 h-4" />
        )}
        {tr("Choose photos", "Chọn ảnh")}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Edit view                                                           */
/* ------------------------------------------------------------------ */

interface EditViewProps {
  pages: Page[];
  selectedPage: Page | null;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  viewTab: "source" | "result";
  setViewTab: (v: "source" | "result") => void;
  sourceImgRef: React.RefObject<HTMLImageElement | null>;
  onCornerPointerDown: (e: React.PointerEvent, i: number) => void;
  onResetCorners: () => void;
  onAutoDetect: () => void;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  engineState: "idle" | "loading" | "ready" | "failed";
  tr: (en: string, vi: string) => string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  addWarn: string | null;
}

function EditView({
  pages,
  selectedPage,
  settings,
  setSettings,
  viewTab,
  setViewTab,
  sourceImgRef,
  onCornerPointerDown,
  onResetCorners,
  onAutoDetect,
  onSelect,
  onRemove,
  onMove,
  engineState,
  tr,
  fileInputRef,
  addWarn,
}: EditViewProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Page list */}
      <div className="lg:w-56 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {tr("Pages", "Trang")} ({pages.length})
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-sky-300 hover:bg-slate-700/50 transition-colors"
            title={tr("Add photos", "Thêm ảnh")}
          >
            <ImagePlus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2 max-h-72 lg:max-h-[420px] overflow-y-auto pr-1">
          {pages.map((page, index) => (
            <div
              key={page.id}
              onClick={() => onSelect(page.id)}
              className={`group relative flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
                selectedPage?.id === page.id
                  ? "border-sky-500/50 bg-sky-500/10"
                  : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600/60"
              }`}
            >
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0 flex items-center justify-center">
                {page.processedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.processedUrl}
                    alt={page.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileImage className="w-5 h-5 text-slate-500" />
                )}
                {(page.processing || page.detection) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="w-4 h-4 text-sky-300 animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">
                  {index + 1}. {page.name}
                </p>
                {page.error ? (
                  <p className="text-[10px] text-red-400 truncate">{page.error}</p>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    {page.width}×{page.height}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(page.id, -1);
                  }}
                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(page.id, 1);
                  }}
                  className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white rounded"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(page.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/90 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        {addWarn && (
          <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" /> {addWarn}
          </p>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 min-w-0">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setViewTab("source")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewTab === "source"
                ? "bg-sky-500/20 text-sky-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tr("Source", "Ảnh gốc")}
          </button>
          <button
            onClick={() => setViewTab("result")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              viewTab === "result"
                ? "bg-sky-500/20 text-sky-300"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tr("Result", "Kết quả")}
            {selectedPage?.processing && (
              <Loader2 className="w-3 h-3 inline ml-1.5 animate-spin" />
            )}
          </button>
        </div>

        {/* Canvas area */}
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 relative overflow-hidden">
          {selectedPage ? (
            <div className="relative flex items-center justify-center min-h-[280px]">
              {viewTab === "source" ? (
                <div className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={sourceImgRef}
                    src={selectedPage.sourceUrl}
                    alt={selectedPage.name}
                    draggable={false}
                    className="block max-w-full max-h-[420px] w-auto h-auto select-none"
                    onDragStart={(e) => e.preventDefault()}
                  />
                  {selectedPage.corners && (
                    <>
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                      >
                        <polygon
                          points={selectedPage.corners
                            .map(
                              (c) =>
                                `${(c.x / selectedPage.width) * 100},${(c.y / selectedPage.height) * 100}`,
                            )
                            .join(" ")}
                          fill="rgba(56,189,248,0.12)"
                          stroke="rgba(125,211,252,0.8)"
                          strokeWidth="0.4"
                        />
                      </svg>
                      {selectedPage.corners.map((corner, i) => (
                        <button
                          key={i}
                          onPointerDown={(e) => onCornerPointerDown(e, i)}
                          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-sky-300 bg-sky-400/40 backdrop-blur-sm cursor-nwse-resize touch-none z-10 hover:bg-sky-400/60 transition-colors"
                          style={{
                            left: `${(corner.x / selectedPage.width) * 100}%`,
                            top: `${(corner.y / selectedPage.height) * 100}%`,
                          }}
                        />
                      ))}
                    </>
                  )}
                  {selectedPage.detection && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex items-center gap-2 text-sm text-sky-200">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {tr("Detecting paper edges...", "Đang nhận diện mép giấy...")}
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedPage.processedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPage.processedUrl}
                  alt={tr("Result", "Kết quả")}
                  className="max-w-full max-h-[420px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-24">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {tr("Processing...", "Đang xử lý...")}
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 text-center text-sm text-slate-500">
              {tr("Select a page to edit", "Chọn một trang để chỉnh sửa")}
            </div>
          )}
        </div>

        {/* Engine status */}
        {engineState === "failed" && (
          <p className="mt-2 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {tr(
              "Auto edge detection unavailable. You can still adjust corners manually.",
              "Nhận diện mép giấy tự động không khả dụng. Bạn vẫn có thể kéo 4 góc bằng tay.",
            )}
          </p>
        )}

        {/* Controls */}
        {selectedPage && (
          <div className="mt-4 space-y-4">
            {/* Corner actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={onAutoDetect}
                disabled={engineState === "failed"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-600/60 text-slate-300 hover:bg-slate-700/40 disabled:opacity-40 transition-colors"
              >
                <Scan className="w-3.5 h-3.5" />
                {tr("Auto detect", "Tự nhận diện")}
              </button>
              <button
                onClick={onResetCorners}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-600/60 text-slate-300 hover:bg-slate-700/40 transition-colors"
              >
                {tr("Reset corners", "Đặt lại góc")}
              </button>
              <button
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    rotate90: (s.rotate90 + 1) % 4,
                  }))
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-600/60 text-slate-300 hover:bg-slate-700/40 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                {tr("Rotate", "Xoay")}
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 w-20 shrink-0">
                {tr("Filter", "Bộ lọc")}
              </span>
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setSettings((s) => ({ ...s, filter: opt.value }))
                    }
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      settings.filter === opt.value
                        ? "bg-sky-500/25 text-sky-200"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tr(opt.en, opt.vi)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Slider
                label={tr("Brightness", "Độ sáng")}
                value={settings.brightness}
                min={-50}
                max={50}
                onChange={(v) => setSettings((s) => ({ ...s, brightness: v }))}
              />
              <Slider
                label={tr("Contrast", "Tương phản")}
                value={settings.contrast}
                min={-50}
                max={50}
                onChange={(v) => setSettings((s) => ({ ...s, contrast: v }))}
              />
              <Slider
                label={tr("Saturation", "Bão hòa")}
                value={settings.saturation}
                min={-50}
                max={50}
                onChange={(v) => setSettings((s) => ({ ...s, saturation: v }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400">{label}</span>
        <span className="text-xs text-slate-500 font-mono">
          {value > 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-sky-500"
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Save view                                                           */
/* ------------------------------------------------------------------ */

interface SaveViewProps {
  pages: Page[];
  format: "images" | "pdf" | "both";
  setFormat: (v: "images" | "pdf" | "both") => void;
  dpi: 150 | 200 | 300;
  setDpi: (v: 150 | 200 | 300) => void;
  prefix: string;
  setPrefix: (v: string) => void;
  saving: {
    state: "idle" | "working" | "done" | "error";
    progress: number;
    message: string | null;
    error: string | null;
  };
  onSave: () => void;
  onDone: () => void;
  tr: (en: string, vi: string) => string;
}

function SaveView({
  pages,
  format,
  setFormat,
  dpi,
  setDpi,
  prefix,
  setPrefix,
  saving,
  onSave,
  onDone,
  tr,
}: SaveViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Pages summary */}
      <div className="lg:col-span-2">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
          {tr("Pages to save", "Các trang sẽ lưu")} ({pages.length})
        </p>
        <div className="grid grid-cols-3 gap-2">
          {pages.map((page, i) => (
            <div
              key={page.id}
              className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-700/50 aspect-[3/4]"
            >
              {page.processedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.processedUrl}
                  alt={page.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                </div>
              )}
              <span className="absolute bottom-1 left-1 text-[10px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="lg:col-span-3 space-y-5">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {tr("Output format", "Định dạng xuất")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "images", icon: FileImage, en: "Images (JPG)", vi: "Ảnh (JPG)" },
                { value: "pdf", icon: FileText, en: "PDF", vi: "PDF" },
                { value: "both", icon: Layers, en: "Both", vi: "Cả hai" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFormat(opt.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  format === opt.value
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                    : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600/60"
                }`}
              >
                <opt.icon className="w-5 h-5" />
                <span className="text-xs font-medium">{tr(opt.en, opt.vi)}</span>
              </button>
            ))}
          </div>
          {format === "images" || format === "both" ? (
            <p className="mt-2 text-xs text-slate-500">
              {tr(
                `Each page is saved as a separate JPG file`,
                `Mỗi trang được lưu thành một file JPG riêng`,
              )}
            </p>
          ) : null}
          {format === "pdf" || format === "both" ? (
            <p className="mt-2 text-xs text-slate-500">
              {tr(
                `All pages are combined into one multi-page PDF`,
                `Tất cả trang được gộp thành một file PDF nhiều trang`,
              )}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {tr("Resolution (DPI)", "Độ phân giải (DPI)")}
          </p>
          <div className="flex items-center gap-2">
            {([150, 200, 300] as const).map((v) => (
              <button
                key={v}
                onClick={() => setDpi(v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  dpi === v
                    ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                    : "border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-slate-600/60"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            {tr("File name prefix", "Tiền tố tên file")}
          </p>
          <input
            type="text"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="scan"
            className="input-modern w-full px-4 py-2.5 rounded-xl text-sm"
            maxLength={100}
          />
          <p className="mt-2 text-xs text-slate-500 font-mono break-all">
            {format === "pdf"
              ? `${sanitizePrefix(prefix)}.pdf`
              : format === "images"
                ? `${sanitizePrefix(prefix)}_01.jpg …`
                : `${sanitizePrefix(prefix)}.pdf + ${sanitizePrefix(prefix)}_01.jpg …`}
          </p>
        </div>

        {/* Saving state */}
        {saving.state !== "idle" && (
          <div
            className={`rounded-xl p-4 border ${
              saving.state === "error"
                ? "border-red-500/40 bg-red-500/10"
                : saving.state === "done"
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-slate-700/50 bg-slate-800/40"
            }`}
          >
            {saving.state === "working" && (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-200 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-300" />
                  {saving.message}
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${saving.progress}%` }}
                  />
                </div>
              </>
            )}
            {saving.state === "done" && (
              <div className="flex items-center gap-2 text-sm text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                {tr("Saved to cloud successfully!", "Đã lưu lên cloud thành công!")}
                <span className="ml-auto">
                  <button
                    onClick={onDone}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium btn-primary transition-all"
                  >
                    {tr("Done", "Xong")}
                  </button>
                </span>
              </div>
            )}
            {saving.state === "error" && (
              <div className="flex items-center gap-2 text-sm text-red-300">
                <AlertCircle className="w-5 h-5" />
                <span className="flex-1">{saving.error}</span>
                <button
                  onClick={onSave}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
                >
                  {tr("Retry", "Thử lại")}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <AlertCircle className="w-4 h-4" />
          {tr(
            "The result will be saved into your current folder as a new file.",
            "Kết quả sẽ được lưu vào thư mục hiện tại như một file mới.",
          )}
        </div>
      </div>
    </div>
  );
}