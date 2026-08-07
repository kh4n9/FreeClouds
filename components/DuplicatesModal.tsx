"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Copy, Trash2, RefreshCw, FileText, Folder } from "lucide-react";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";
import { formatFileSize, formatDate } from "@/lib/file-utils";

interface DupFile {
  _id: string;
  name: string;
  displayName: string;
  size: number;
  mime: string;
  folderId: string | null;
  folderName: string | null;
  createdAt: string;
}

interface DupGroup {
  _id: { name: string; size: number };
  files: DupFile[];
  count: number;
}

interface DuplicatesModalProps {
  onClose: () => void;
  onToast?: (type: "success" | "error" | "info", message: string) => void;
  onChanged?: () => void;
  onOpenFolder?: (folderId: string) => void;
}

export default function DuplicatesModal({ onClose, onToast, onChanged, onOpenFolder }: DuplicatesModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<DupGroup[]>([]);
  const [keepMap, setKeepMap] = useState<Record<string, string>>({});
  const [cleaning, setCleaning] = useState(false);

  const loadDuplicates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files/duplicates");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onToast?.("error", data.error || t("loadFailed", { en: "Failed to load duplicates", vi: "Không tải được danh sách trùng lặp" }));
        return;
      }
      const data = await res.json();
      setGroups(data.groups || []);
      const map: Record<string, string> = {};
      for (const g of data.groups || []) {
        const files = [...(g.files || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        map[g.files[0]?._id] = files[0]?._id || "";
      }
      setKeepMap(map);
    } catch {
      onToast?.("error", t("loadFailed", { en: "Failed to load duplicates", vi: "Không tải được danh sách trùng lặp" }));
    } finally {
      setLoading(false);
    }
  }, [onToast, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDuplicates();
  }, [loadDuplicates]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const totalWasted = groups.reduce((sum, g) => {
    const first = g.files[0];
    const keepId = first ? keepMap[first._id] : undefined;
    return sum + g.files.filter((f) => f._id !== keepId).reduce((s, f) => s + f.size, 0);
  }, 0);

  const handleCleanup = async () => {
    const keepFileIds = Object.values(keepMap).filter(Boolean);
    if (keepFileIds.length === 0) return;
    if (!window.confirm(t("confirmCleanup", { en: `Delete ${groups.length} duplicate group(s)? Only the files you keep will remain.`, vi: `Xóa ${groups.length} nhóm tệp trùng lặp? Chỉ giữ lại các tệp bạn đã chọn.` }))) return;
    setCleaning(true);
    try {
      const res = await fetch("/api/files/duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepFileIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        onToast?.("error", data.error || t("cleanupFailed", { en: "Cleanup failed", vi: "Dọn dẹp thất bại" }));
        return;
      }
      onToast?.("success", t("cleaned", { en: `${data.deleted} duplicate(s) deleted`, vi: `Đã xóa ${data.deleted} tệp trùng lặp` }));
      onChanged?.();
      await loadDuplicates();
    } catch {
      onToast?.("error", t("cleanupFailed", { en: "Cleanup failed", vi: "Dọn dẹp thất bại" }));
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative modal-content w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center">
              <Copy className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">{t("duplicates", { en: "Duplicates", vi: "Tệp trùng lặp" })}</h3>
              <p className="text-xs text-slate-400">{t("duplicatesHint", { en: "Files with the same name and size. Keep one, delete the rest.", vi: "Các tệp có cùng tên và kích thước. Giữ một bản, xóa phần còn lại." })}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-400 border-t-transparent" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{t("noDuplicates", { en: "No duplicate files found.", vi: "Không tìm thấy tệp trùng lặp." })}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <div>
                  <p className="text-sm font-medium text-slate-200">{t("duplicatesSummary", { en: `${groups.length} duplicate group(s) found`, vi: `Tìm thấy ${groups.length} nhóm trùng lặp` })}</p>
                  <p className="text-xs text-slate-400">{t("wastedSpace", { en: `Up to ${formatFileSize(totalWasted)} can be freed`, vi: `Có thể giải phóng tới ${formatFileSize(totalWasted)}` })}</p>
                </div>
                <button onClick={handleCleanup} disabled={cleaning || groups.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-lg hover:shadow-orange-500/25 disabled:opacity-50 transition-all shrink-0">
                  {cleaning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t("deleteDuplicates", { en: "Delete Duplicates", vi: "Xóa tệp trùng lặp" })}
                </button>
              </div>

              <div className="space-y-4">
                {groups.map((group) => {
                  const first = group.files[0];
                  if (!first) return null;
                  const groupKey = first._id;
                  const keepId = keepMap[groupKey];
                  return (
                    <div key={groupKey} className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
                      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-slate-800/40">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{first.displayName || group._id.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(group._id.size)} · {group.count} {t("copies", { en: "copies", vi: "bản sao" })}</p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full font-medium shrink-0">{group.count}x</span>
                      </div>
                      <div className="p-3 space-y-2">
                        {group.files.map((f) => (
                          <div key={f._id} className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border transition-all ${keepId === f._id ? "border-emerald-500/40 bg-emerald-500/10" : "border-slate-700/40 bg-slate-900/30"}`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <input type="radio" checked={keepId === f._id} onChange={() => setKeepMap((prev) => ({ ...prev, [groupKey]: f._id }))}
                                className="h-4 w-4 rounded-full border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/50 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm text-slate-300 truncate">{f.displayName}</p>
                                <p className="text-xs text-slate-500">{formatDate(f.createdAt)} · {formatFileSize(f.size)}</p>
                              </div>
                            </div>
                            {keepId === f._id && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-medium shrink-0">{t("keep", { en: "Keep", vi: "Giữ" })}</span>
                            )}
                            {f.folderId && onOpenFolder && (
                              <button onClick={() => { onOpenFolder(f.folderId!); onClose(); }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all shrink-0" title={t("openFolder", { en: "Open folder", vi: "Mở thư mục" })}>
                                <Folder className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
