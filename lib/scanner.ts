// Client-side document scanning pipeline.
//
// Heavy lifting (edge detection + perspective warp) is done with OpenCV.js
// which is lazy-loaded from a CDN only when the scanner is first opened.
// All processing happens in the user's browser; nothing is sent to a server
// except the final processed images/PDF (via the normal upload endpoints).

export interface Corner {
  x: number;
  y: number;
}

export type FilterMode = "enhance" | "gray" | "bw";

export interface ScanSettings {
  filter: FilterMode;
  brightness: number; // -100..100
  contrast: number; // -100..100
  saturation: number; // -100..100
  rotate90: number; // number of quarter turns applied to the output (0..3)
  maxDim: number; // output maximum side length in pixels
  jpegQuality: number; // 0..1
}

export const OPENCV_SCRIPT = "/opencv.js";

const OPENCV_LOAD_TIMEOUT_MS = 30000;

export function dpiToMaxDim(dpi: number): number {
  // A4 is 210mm x 297mm -> pixels = inches * dpi
  const inches = 297 / 25.4;
  return Math.round(inches * dpi);
}

export function normalizeSetting(
  s: Partial<ScanSettings> = {},
): ScanSettings {
  return {
    filter: s.filter ?? "enhance",
    brightness: s.brightness ?? 0,
    contrast: s.contrast ?? 0,
    saturation: s.saturation ?? 0,
    rotate90: ((s.rotate90 ?? 0) % 4 + 4) % 4,
    maxDim: s.maxDim ?? 1654,
    jpegQuality: s.jpegQuality ?? 0.88,
  };
}

// ---------- OpenCV loader ----------

// OpenCV.js exposes a plain global `cv` object (WASM binding). Its full API
// is dynamic, so we deliberately type it loosely.
/* eslint-disable @typescript-eslint/no-explicit-any */

let openCvPromise: Promise<any> | null = null;

export function loadOpenCV(): Promise<any> {
  if (openCvPromise) return openCvPromise;

  openCvPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${OPENCV_SCRIPT}"]`,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as any).cv));
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load OpenCV.js")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = OPENCV_SCRIPT;
    script.async = true;
    script.onload = () => {
      const cv = (window as any).cv;
      if (cv?.onRuntimeInitialized) {
        const existingResolve = cv.onRuntimeInitialized;
        cv.onRuntimeInitialized = () => {
          existingResolve?.();
          resolve(cv);
        };
      } else {
        resolve(cv);
      }
    };
    script.onerror = () => {
      openCvPromise = null;
      reject(new Error("Failed to load OpenCV.js"));
    };
    document.head.appendChild(script);

    setTimeout(() => {
      const cv = (window as any).cv;
      if (cv?.Mat) {
        resolve(cv);
        return;
      }
      if (openCvPromise) {
        openCvPromise = null;
        reject(new Error("OpenCV load timed out"));
      }
    }, OPENCV_LOAD_TIMEOUT_MS);
  });

  return openCvPromise;
}

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

export function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_decode_failed"));
    img.src = src;
  });
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function dist(a: Corner, b: Corner): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// Orders 4 arbitrary points as [TOP_LEFT, TOP_RIGHT, BOTTOM_RIGHT, BOTTOM_LEFT].
export function orderCorners(points: Corner[]): [Corner, Corner, Corner, Corner] {
  const tl = points.reduce((a, b) => (a.x + a.y < b.x + b.y ? a : b));
  const br = points.reduce((a, b) => (a.x + a.y > b.x + b.y ? a : b));
  let tr = points[0] as Corner;
  let bl = points[0] as Corner;
  for (const p of points) {
    if (p === tl || p === br) continue;
    if (p.x - p.y > tr.x - tr.y) tr = p;
    if (p.x - p.y < bl.x - bl.y) bl = p;
  }
  return [tl, tr, br, bl];
}

/* ------------------------------------------------------------------ */
/* Corner detection                                                    */
/* ------------------------------------------------------------------ */

// Detect the largest quadrilateral (the photographed paper) in an image.
// Returns corners in ORIGINAL image pixels, or null when not found.
export async function detectDocumentCorners(
  source: CanvasImageSource,
  width: number,
  height: number,
): Promise<Corner[] | null> {
  const cv = (await loadOpenCV()) as any;

  // Work on a downscaled copy for speed, then scale corners back up.
  const detectSide = 640;
  const scale = Math.min(1, detectSide / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = w;
  srcCanvas.height = h;
  const sctx = srcCanvas.getContext("2d")!;
  sctx.drawImage(source, 0, 0, w, h);

  const src = cv.imread(srcCanvas);
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
    cv.Canny(blur, edges, 50, 150);
    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE,
    );

    let bestArea = 0;
    let bestCorners: number[] | null = null;

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.02 * peri, true);

      if (approx.rows === 4) {
        const area = Math.abs(cv.contourArea(contour));
        if (area > bestArea) {
          bestArea = area;
          bestCorners = Array.from(approx.data32S as ArrayLike<number>);
        }
      }
      approx.delete();
    }

    if (!bestCorners) return null;
    if (bestArea < 0.02 * (w * h)) return null; // too small to be the page

    const points: Corner[] = [];
    for (let i = 0; i < bestCorners.length; i += 2) {
      points.push({
        x: (bestCorners[i] as number) / scale,
        y: (bestCorners[i + 1] as number) / scale,
      });
    }
    return orderCorners(points);
  } finally {
    src.delete();
    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/* ------------------------------------------------------------------ */
/* Warp + filters                                                      */
/* ------------------------------------------------------------------ */

function fitToMax(
  source: CanvasImageSource,
  width: number,
  height: number,
  maxDim: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxDim / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function warpToRect(
  source: CanvasImageSource,
  width: number,
  height: number,
  corners: Corner[],
  maxDim: number,
): Promise<HTMLCanvasElement> {
  const cv = await loadOpenCV();

  const [tl, tr, br, bl] = orderCorners(corners);
  const outW = Math.max(dist(tl, tr), dist(bl, br));
  const outH = Math.max(dist(tl, bl), dist(tr, br));
  const scale = Math.min(1, maxDim / Math.max(outW, outH));
  const finalW = Math.max(1, Math.round(outW * scale));
  const finalH = Math.max(1, Math.round(outH * scale));

  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  srcCanvas.getContext("2d")!.drawImage(source, 0, 0);

  const srcMat = cv.imread(srcCanvas);
  const dstMat = new cv.Mat();
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    tl.x, tl.y,
    tr.x, tr.y,
    bl.x, bl.y,
    br.x, br.y,
  ]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    finalW, 0,
    0, finalH,
    finalW, finalH,
  ]);

  try {
    const transform = cv.getPerspectiveTransform(srcTri, dstTri);
    cv.warpPerspective(
      srcMat,
      dstMat,
      transform,
      new cv.Size(finalW, finalH),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255),
    );
    transform.delete();

    const out = document.createElement("canvas");
    out.width = finalW;
    out.height = finalH;
    cv.imshow(out, dstMat);
    return out;
  } finally {
    srcMat.delete();
    dstMat.delete();
    srcTri.delete();
    dstTri.delete();
  }
}

function otsuThreshold(data: Uint8ClampedArray, len: number): number {
  const hist = new Array(256).fill(0) as number[];
  for (let i = 0; i < len; i++) hist[data[i]!] = (hist[data[i]!] as number) + 1;
  const total = len;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i]!;
  let sumB = 0;
  let weightB = 0;
  let maxVar = -1;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    weightB += hist[t]!;
    if (weightB === 0) continue;
    const weightF = total - weightB;
    if (weightF === 0) break;
    sumB += t * hist[t]!;
    const meanB = sumB / weightB;
    const meanF = (sum - sumB) / weightF;
    const between = weightB * weightF * (meanB - meanF) * (meanB - meanF);
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }
  return threshold;
}

export function applyScanFilters(
  input: HTMLCanvasElement,
  settings: ScanSettings,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = input.width;
  canvas.height = input.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(input, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const n = d.length / 4;
  const bright = settings.brightness * 2.55;
  const contrastFactor =
    settings.contrast !== 0
      ? (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast))
      : 1;
  const satFactor = 1 + settings.saturation / 100;

  // Histogram stretch (auto-levels) so the paper turns white.
  if (settings.filter === "enhance") {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < n; i++) {
      const l = 0.299 * d[i * 4]! + 0.587 * d[i * 4 + 1]! + 0.114 * d[i * 4 + 2]!;
      if (l < lo) lo = l;
      if (l > hi) hi = l;
    }
    if (hi - lo > 8) {
      const spread = hi - lo;
      for (let i = 0; i < n; i++) {
        d[i * 4] = (((d[i * 4]! - lo) * 255) / spread);
        d[i * 4 + 1] = (((d[i * 4 + 1]! - lo) * 255) / spread);
        d[i * 4 + 2] = (((d[i * 4 + 2]! - lo) * 255) / spread);
      }
    }
  }

  for (let i = 0; i < n; i++) {
    const idx = i * 4;
    let r = d[idx]!;
    let g = d[idx + 1]!;
    let b = d[idx + 2]!;

    if (contrastFactor !== 1) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }
    if (bright !== 0) {
      r += bright;
      g += bright;
      b += bright;
    }

    if (settings.filter === "enhance" && satFactor !== 1) {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      r = lum + (r - lum) * satFactor;
      g = lum + (g - lum) * satFactor;
      b = lum + (b - lum) * satFactor;
    } else if (settings.filter !== "enhance") {
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      r = l;
      g = l;
      b = l;
    }

    d[idx] = clamp(r, 0, 255);
    d[idx + 1] = clamp(g, 0, 255);
    d[idx + 2] = clamp(b, 0, 255);
  }

  if (settings.filter === "bw") {
    const luma = new Uint8ClampedArray(n);
    for (let i = 0; i < n; i++) luma[i] = d[i * 4]!;
    const threshold = otsuThreshold(luma, n);
    for (let i = 0; i < n; i++) {
      const idx = i * 4;
      const v = luma[i]! >= threshold ? 255 : 0;
      d[idx] = v;
      d[idx + 1] = v;
      d[idx + 2] = v;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function rotateCanvas(
  input: HTMLCanvasElement,
  quarters: number,
): HTMLCanvasElement {
  const q = ((quarters % 4) + 4) % 4;
  if (q === 0) return input;
  const canvas = document.createElement("canvas");
  canvas.width = q % 2 === 0 ? input.width : input.height;
  canvas.height = q % 2 === 0 ? input.height : input.width;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((q * 90 * Math.PI) / 180);
  ctx.drawImage(input, -input.width / 2, -input.height / 2);
  return canvas;
}

function cropToQuadBounds(
  source: CanvasImageSource,
  width: number,
  height: number,
  corners: Corner[],
  maxDim: number,
): HTMLCanvasElement {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const c of corners) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x);
    maxY = Math.max(maxY, c.y);
  }
  const cw = Math.max(1, maxX - minX);
  const ch = Math.max(1, maxY - minY);
  const scale = Math.min(1, maxDim / Math.max(cw, ch));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(cw * scale));
  canvas.height = Math.max(1, Math.round(ch * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    source,
    Math.max(0, Math.round(minX)),
    Math.max(0, Math.round(minY)),
    Math.round(cw),
    Math.round(ch),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

export async function processPage(
  source: CanvasImageSource,
  width: number,
  height: number,
  corners: Corner[] | null,
  rawSettings: Partial<ScanSettings> = {},
): Promise<HTMLCanvasElement> {
  const settings = normalizeSetting(rawSettings);
  let canvas: HTMLCanvasElement;
  if (corners && corners.length === 4) {
    try {
      canvas = await warpToRect(source, width, height, corners, settings.maxDim);
    } catch {
      canvas = cropToQuadBounds(source, width, height, corners, settings.maxDim);
    }
  } else {
    canvas = fitToMax(source, width, height, settings.maxDim);
  }
  canvas = applyScanFilters(canvas, settings);
  canvas = rotateCanvas(canvas, settings.rotate90);
  return canvas;
}

export function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality = 0.88,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("toBlob_failed")),
      "image/jpeg",
      quality,
    );
  });
}

export async function buildPdfBlob(
  pages: { blob: Blob; width: number; height: number }[],
): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (const page of pages) {
    const bytes = new Uint8Array(await page.blob.arrayBuffer());
    const img = await pdf.embedJpg(bytes);
    const p = pdf.addPage([page.width, page.height]);
    p.drawImage(img, { x: 0, y: 0, width: page.width, height: page.height });
  }
  const out = await pdf.save();
  const bytes = new Uint8Array(out);
  return new Blob([bytes], { type: "application/pdf" });
}

export const SCANNABLE_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
];

export function isScanableMime(mime: string | null | undefined): boolean {
  return !!mime && SCANNABLE_IMAGE_MIMES.includes(mime.toLowerCase());
}