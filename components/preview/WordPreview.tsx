"use client";

import { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";
import { useTranslation, commonTranslations } from "../LanguageSwitcher";

interface WordPreviewProps {
  file: { id: string; name: string; size: number; mime: string };
  fileContent: string | null;
  onDownload: () => void;
}

function sanitizeHtml(html: string): string {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll(
      "script, iframe, object, embed, link, meta, style, form, input, button, textarea, select, base",
    )
    .forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith("on")) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName.toLowerCase() === "a") {
      const href = el.getAttribute("href") || "";
      if (!/^(https?:|mailto:)/i.test(href) && !href.startsWith("#")) {
        el.removeAttribute("href");
      }
    }
  });
  return doc.body.innerHTML;
}

export default function WordPreview({
  file,
  fileContent,
  onDownload,
}: WordPreviewProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [legacyUrl, setLegacyUrl] = useState<string | null>(null);

  const isLegacyDoc =
    file.mime === "application/msword" ||
    (file.name.toLowerCase().endsWith(".doc") &&
      !file.name.toLowerCase().endsWith(".docx"));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(false);
      try {
        if (isLegacyDoc) {
          const response = await fetch(
            `/api/files/${file.id}/signed-download`,
          );
          if (!response.ok) throw new Error("signed-download failed");
          const data = (await response.json()) as { url?: string };
          if (cancelled) return;
          setLegacyUrl(
            data.url
              ? window.location.origin + data.url
              : null,
          );
        } else if (fileContent) {
          const response = await fetch(fileContent);
          if (!response.ok) throw new Error("fetch failed");
          const arrayBuffer = await response.arrayBuffer();
          const mammoth = await import("mammoth");
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (cancelled) return;
          setHtml(sanitizeHtml(result.value));
        } else {
          throw new Error("no content");
        }
      } catch (err) {
        console.error("Failed to load Word document:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [file.id, fileContent, isLegacyDoc]);

  const googleDocsUrl = legacyUrl
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(legacyUrl)}&embedded=true`
    : null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span className="font-medium truncate">{file.name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={googleDocsUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg transition-colors ${
              googleDocsUrl ? "hover:bg-blue-50" : "opacity-50 pointer-events-none"
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            {t("openInGoogleDocs", commonTranslations.openInGoogleDocs)}
          </a>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("download", commonTranslations.download)}
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">
              {t("loadingWordDoc", commonTranslations.loadingWordDoc)}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center max-w-md p-8">
            <FileText className="w-24 h-24 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {t("wordParseError", commonTranslations.wordParseError)}
            </p>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <Download className="w-4 h-4" />
              {t("download", commonTranslations.download)}
            </button>
          </div>
        </div>
      ) : isLegacyDoc && legacyUrl ? (
        <iframe
          src={googleDocsUrl || undefined}
          title={file.name}
          className="flex-1 w-full border-0 bg-gray-100"
        />
      ) : html ? (
        <div className="flex-1 overflow-auto bg-gray-100">
          <div
            className="word-preview max-w-3xl mx-auto my-6 bg-white shadow-lg rounded-lg px-10 py-12"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ) : null}

      {/* Inline styles for rendered Word content */}
      <style>{`
        .word-preview { font-family: 'Inter', system-ui, sans-serif; color: #1f2937; line-height: 1.6; font-size: 15px; word-wrap: break-word; }
        .word-preview h1 { font-size: 1.9em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .word-preview h2 { font-size: 1.55em; font-weight: 700; margin: 0.8em 0 0.4em; }
        .word-preview h3 { font-size: 1.3em; font-weight: 600; margin: 0.7em 0 0.35em; }
        .word-preview h4, .word-preview h5, .word-preview h6 { font-size: 1.1em; font-weight: 600; margin: 0.6em 0 0.3em; }
        .word-preview p { margin: 0.6em 0; }
        .word-preview ul { list-style: disc; padding-left: 1.6em; margin: 0.6em 0; }
        .word-preview ol { list-style: decimal; padding-left: 1.6em; margin: 0.6em 0; }
        .word-preview table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
        .word-preview td, .word-preview th { border: 1px solid #d1d5db; padding: 6px 10px; }
        .word-preview img { max-width: 100%; height: auto; }
        .word-preview a { color: #2563eb; text-decoration: underline; }
        .word-preview blockquote { border-left: 3px solid #d1d5db; margin: 0.8em 0; padding-left: 1em; color: #4b5563; }
        .word-preview hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.2em 0; }
      `}</style>
    </div>
  );
}
