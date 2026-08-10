"use client";

import { useState } from "react";
import { X, Folder, FileText, FolderOpen, Loader2, CheckCircle2 } from "lucide-react";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";

interface FolderData {
  id: string;
  name: string;
  parent: string | null;
  createdAt?: string;
  children?: FolderData[];
}

export interface MoveItem {
  id: string;
  name: string;
  kind: "file" | "folder";
}

interface MoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MoveItem | null;
  folders: FolderData[];
  currentFolderId: string | null;
  /** Folder ids that must not be shown as destinations (e.g. the folder being moved and its descendants) */
  excludeIds?: string[];
  onMoved: () => void;
}

function buildTree(folders: FolderData[], excludeIds: Set<string>): FolderData[] {
  const map = new Map<string, FolderData & { children: FolderData[] }>();
  const roots: (FolderData & { children: FolderData[] })[] = [];
  folders.forEach((f) => {
    if (!excludeIds.has(f.id)) map.set(f.id, { ...f, children: [] });
  });
  map.forEach((node) => {
    if (node.parent && map.has(node.parent)) {
      const parent = map.get(node.parent);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (arr: FolderData[]) => {
    arr.sort((a, b) => a.name.localeCompare(b.name));
    arr.forEach((n) => sortRec(n.children ?? []));
  };
  sortRec(roots);
  return roots;
}

function FolderRow({
  node,
  level,
  targetId,
  onPick,
}: {
  node: FolderData;
  level: number;
  targetId: string | null;
  onPick: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isTarget = targetId === node.id;

  return (
    <div>
      <div
        onClick={() => onPick(node.id)}
        className={`flex items-center gap-2 min-h-[40px] px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
          isTarget
            ? "bg-blue-500/20 text-accent ring-1 ring-blue-500/30"
            : "hover:bg-card-hover text-foreground"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
          }}
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-card-hover transition-colors shrink-0"
          style={{
            color: hasChildren ? "#94a3b8" : "transparent",
            transform: hasChildren && expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 180ms ease",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <Folder className="w-4 h-4 shrink-0 text-accent" />
        <div className="flex-1 min-w-0 text-sm truncate">{node.name}</div>
        {isTarget && <CheckCircle2 className="w-4 h-4 shrink-0 text-accent" />}
      </div>
      {expanded && hasChildren && (
        <div style={{ marginTop: 2 }}>
          {node.children!.map((c) => (
            <FolderRow key={c.id} node={c} level={level + 1} targetId={targetId} onPick={onPick} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MoveModal({
  isOpen,
  onClose,
  item,
  folders,
  currentFolderId,
  excludeIds = [],
  onMoved,
}: MoveModalProps) {
  const { t } = useTranslation();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const isFolder = item.kind === "folder";
  const excludeSet = new Set(excludeIds);
  const tree = buildTree(folders, excludeSet);

  const handleMove = async () => {
    setMoving(true);
    setError(null);
    try {
      const endpoint = isFolder ? `/api/folders/${item.id}` : `/api/files/${item.id}`;
      const payload = isFolder
        ? { action: "move", targetFolderId: targetId }
        : { action: "move", folderId: targetId };
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        onMoved();
        onClose();
        setTargetId(null);
      } else {
        setError(data.error || t("error", commonTranslations.error));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setMoving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-content w-full max-w-md max-h-[85vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
              {isFolder ? <FolderOpen className="w-4 h-4 text-white" /> : <Folder className="w-4 h-4 text-white" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                {isFolder
                  ? t("moveFolder", { en: "Move Folder", vi: "Di chuyển thư mục" })
                  : t("moveFile", { en: "Move File", vi: "Di chuyển tệp" })}
              </h2>
              <p className="text-xs text-muted truncate flex items-center gap-1 mt-0.5">
                {isFolder ? <FolderOpen className="w-3 h-3 shrink-0" /> : <FileText className="w-3 h-3 shrink-0" />}
                {item.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
            {t("chooseDestination", { en: "Choose destination", vi: "Chọn nơi đến" })}
          </p>

          {/* Root option */}
          <div
            onClick={() => setTargetId(null)}
            className={`flex items-center gap-2 min-h-[40px] px-2 py-1.5 rounded-lg cursor-pointer select-none transition-colors ${
              targetId === null
                ? "bg-blue-500/20 text-accent ring-1 ring-blue-500/30"
                : "hover:bg-card-hover text-foreground"
            }`}
          >
            <svg className="w-4 h-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v1M4 10h16M4 10v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            </svg>
            <div className="flex-1 min-w-0 font-medium text-sm">
              {t("allFiles", commonTranslations.allFiles)}
            </div>
            {targetId === null && <CheckCircle2 className="w-4 h-4 shrink-0 text-accent" />}
          </div>

          {tree.length > 0 && (
            <div className="mt-1 border-t border-line pt-1">
              {tree.map((n) => (
                <FolderRow key={n.id} node={n} level={0} targetId={targetId} onPick={setTargetId} />
              ))}
            </div>
          )}

          {targetId !== currentFolderId && (
            <p className="text-xs text-muted mt-3">
              {isFolder
                ? t("moveFolderNote", {
                    en: "The folder and all its contents will be moved to the selected location.",
                    vi: "Thư mục và toàn bộ nội dung sẽ được chuyển đến nơi đã chọn.",
                  })
                : t("moveNote", {
                    en: "The file will be moved to the selected folder.",
                    vi: "Tệp sẽ được chuyển đến thư mục đã chọn.",
                  })}
            </p>
          )}

          {error && (
            <div className="mt-3 px-4 py-3 bg-error/10 border border-red-500/20 text-error rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 pt-0 border-t border-line mt-2">
          <button
            onClick={onClose}
            disabled={moving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-card-hover transition-all disabled:opacity-50"
          >
            {t("cancel", commonTranslations.cancel)}
          </button>
          <button
            onClick={handleMove}
            disabled={moving || targetId === currentFolderId}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium btn-primary disabled:opacity-50 min-w-28"
          >
            {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Folder className="w-4 h-4" />}
            {moving ? t("moving", { en: "Moving...", vi: "Đang chuyển..." }) : t("moveBtn", { en: "Move", vi: "Di chuyển" })}
          </button>
        </div>
      </div>
    </div>
  );
}
