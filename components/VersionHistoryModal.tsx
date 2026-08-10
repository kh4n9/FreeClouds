"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  History,
  Upload,
  Download,
  RotateCcw,
  Trash2,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";
import { formatFileSize, formatDate } from "@/lib/file-utils";

interface VersionInfo {
  id: string;
  version: number;
  size: number;
  mime: string;
  createdAt: string;
  name: string;
}

interface VersionHistoryModalProps {
  fileId: string;
  fileName: string;
  onClose: () => void;
  onToast?: (type: "success" | "error" | "info", message: string) => void;
  onVersionChanged?: () => void;
}

export default function VersionHistoryModal({
  fileId,
  fileName,
  onClose,
  onToast,
  onVersionChanged,
}: VersionHistoryModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/files/${fileId}/versions`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.("error", data.error || t("loadFailed", { en: "Failed to load versions", vi: "Không tải được danh sách phiên bản" }));
        return;
      }
      const data = await res.json();
      setCurrentVersion(data.currentVersion || 1);
      setVersions(data.versions || []);
    } catch {
      onToast?.("error", t("loadFailed", { en: "Failed to load versions", vi: "Không tải được danh sách phiên bản" }));
    } finally {
      setLoading(false);
    }
  }, [fileId, onToast, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadVersions();
  }, [loadVersions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/files/${fileId}/versions`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast?.("error", data.error || t("uploadFailed", { en: "Upload failed", vi: "Tải lên thất bại" }));
        return;
      }
      onToast?.("success", t("uploadedVersion", { en: "New version uploaded", vi: "Đã tải lên phiên bản mới" }));
      onVersionChanged?.();
      await loadVersions();
    } catch {
      onToast?.("error", t("uploadFailed", { en: "Upload failed", vi: "Tải lên thất bại" }));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (v: VersionInfo) => {
    const a = document.createElement("a");
    a.href = `/api/files/${fileId}/versions/${v.id}`;
    a.download = v.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRestore = async (v: VersionInfo) => {
    if (!window.confirm(t("confirmRestore", { en: "Restore this version? The current version will be kept in history.", vi: "Khôi phục phiên bản này? Phiên bản hiện tại sẽ được lưu vào lịch sử." }))) return;
    setBusyId(v.id);
    try {
      const res = await fetch(`/api/files/${fileId}/versions/${v.id}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast?.("error", data.error || t("restoreFailed", { en: "Restore failed", vi: "Khôi phục thất bại" }));
        return;
      }
      onToast?.("success", t("restored", { en: "Version restored", vi: "Đã khôi phục phiên bản" }));
      onVersionChanged?.();
      await loadVersions();
    } catch {
      onToast?.("error", t("restoreFailed", { en: "Restore failed", vi: "Khôi phục thất bại" }));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (v: VersionInfo) => {
    if (!window.confirm(t("confirmDeleteVersion", { en: "Delete this version? This cannot be undone.", vi: "Xóa phiên bản này? Hành động này không thể hoàn tác." }))) return;
    setBusyId(v.id);
    try {
      const res = await fetch(`/api/files/${fileId}/versions/${v.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.("error", data.error || t("deleteFailed", { en: "Delete failed", vi: "Xóa thất bại" }));
        return;
      }
      onToast?.("success", t("deletedVersion", { en: "Version deleted", vi: "Đã xóa phiên bản" }));
      await loadVersions();
    } catch {
      onToast?.("error", t("deleteFailed", { en: "Delete failed", vi: "Xóa thất bại" }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative modal-content w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30 flex items-center justify-center">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{t("versionHistory", { en: "Version History", vi: "Lịch sử phiên bản" })}</h3>
              <p className="text-xs text-muted truncate max-w-[280px]">{fileName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:text-foreground hover:bg-card-hover transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Upload new version */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-foreground">{t("uploadNewVersion", { en: "Upload new version", vi: "Tải lên phiên bản mới" })}</p>
                <p className="text-xs text-muted">{t("currentVersion", { en: `Current version: v${currentVersion}`, vi: `Phiên bản hiện tại: v${currentVersion}` })}</p>
              </div>
            </div>
            <label className="cursor-pointer shrink-0">
              <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${uploading ? "opacity-50" : "bg-accent text-white hover:shadow-lg hover:shadow-accent/25"}`}>
                {uploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {t("upload", { en: "Upload", vi: "Tải lên" })}
              </span>
            </label>
          </div>

          {/* Versions list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-400 border-t-transparent" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-10 h-10 text-muted mx-auto mb-3" />
              <p className="text-sm text-muted">{t("noVersions", { en: "No previous versions yet. Upload a new version to get started.", vi: "Chưa có phiên bản trước đó. Hãy tải lên phiên bản mới." })}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-card border border-line flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-purple-400">v{v.version}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.name}</p>
                      <p className="text-xs text-muted">{formatFileSize(v.size)} · {formatDate(v.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleDownload(v)} title={t("download", commonTranslations.download)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:text-foreground hover:bg-card-hover transition-all">
                      <Download className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRestore(v)} disabled={busyId === v.id} title={t("restore", { en: "Restore", vi: "Khôi phục" })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:text-success hover:bg-emerald-500/10 transition-all">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(v)} disabled={busyId === v.id} title={t("delete", commonTranslations.delete)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:text-error hover:bg-error/10 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
