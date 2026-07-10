"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";

interface FolderData {
  id: string;
  name: string;
  parent: string | null;
  createdAt?: string;
  children?: FolderData[];
}

interface PlainFolderTreeProps {
  folders: FolderData[];
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onDeleteFolder?: (folderId: string) => void;
  loading?: boolean;
  expandAll?: boolean;
}

/**
 * Build a nested tree from a flat list of folders.
 */
function buildTree(folders: FolderData[]): FolderData[] {
  const map = new Map<string, FolderData & { children: FolderData[] }>();
  const roots: (FolderData & { children: FolderData[] })[] = [];

  folders.forEach((f) => map.set(f.id, { ...f, children: [] }));

  map.forEach((node) => {
    if (node.parent) {
      const parent = map.get(node.parent);
      if (parent) parent.children.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortRec = (arr: (FolderData & { children: FolderData[] })[]) => {
    arr.sort((a, b) => a.name.localeCompare(b.name));
    arr.forEach((n) => sortRec(n.children as any));
  };

  sortRec(roots);
  return roots;
}

/**
 * Check whether a node (or any of its descendants) contains targetId.
 */
function containsId(node: FolderData, targetId: string | null): boolean {
  if (!targetId) return false;
  if (node.id === targetId) return true;
  if (!node.children || node.children.length === 0) return false;
  return node.children.some((c) => containsId(c, targetId));
}

/**
 * Folder node component with expand/collapse animation and chevron rotation.
 */
interface FolderNodeProps {
  node: FolderData;
  level: number;
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  onCreate: ((parentId: string | null) => void) | undefined;
  onRename: ((id: string, newName: string) => void) | undefined;
  onDelete: ((id: string) => void) | undefined;
  globalExpandAll: boolean | undefined;
}

function FolderNode({
  node,
  level,
  selectedFolderId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  globalExpandAll,
}: FolderNodeProps) {
  const { t } = useTranslation();
  const hasChildren = node.children && node.children.length > 0;
  const [expanded, setExpanded] = useState<boolean>(!!globalExpandAll || false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(node.name);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [maxHeight, setMaxHeight] = useState<string>("0px");

  // Sync expand state with globalExpandAll prop changes
  useEffect(() => {
    if (typeof globalExpandAll === "boolean") {
      setExpanded(globalExpandAll);
    }
  }, [globalExpandAll]);

  // Auto expand if this node contains currently selected folder
  useEffect(() => {
    if (selectedFolderId && containsId(node, selectedFolderId)) {
      setExpanded(true);
    }
  }, [selectedFolderId, node]);

  // Update name if node prop changes
  useEffect(() => {
    setName(node.name);
  }, [node.name]);

  // Update animated maxHeight when expanded toggles or children change
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return () => {};

    // Always capture timeout id in a variable so we can clear it in the cleanup
    let t: ReturnType<typeof setTimeout> | null = null;

    if (expanded) {
      // from 0 -> full height
      const scrollH = el.scrollHeight;
      setMaxHeight(`${scrollH}px`);
      // after transition, allow auto height by removing maxHeight
      t = setTimeout(() => {
        // set to large value so future content changes are visible without abrupt clamp
        setMaxHeight("none");
      }, 220);
    } else {
      // if previously 'none', force measuring then collapse
      if (maxHeight === "none") {
        // set to measured px to kick off transition
        const scrollH = el.scrollHeight;
        // force reflow then set to 0
        setMaxHeight(`${scrollH}px`);
        // next tick set to 0
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setMaxHeight("0px");
          });
        });
      } else {
        setMaxHeight("0px");
      }
    }

    // cleanup always returned
    return () => {
      if (t) clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, node.children?.length]);

  const handleToggle = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (!hasChildren) return;
      setExpanded((v) => !v);
    },
    [hasChildren],
  );

  const handleSelect = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      onSelect(node.id);
    },
    [onSelect, node.id],
  );

  const submitRename = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed) {
      setName(node.name);
      setEditing(false);
      return;
    }
    if (trimmed !== node.name) {
      onRename?.(node.id, trimmed);
    }
    setEditing(false);
  }, [name, node.name, node.id, onRename]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!onDelete) return;
      // Parent component now shows an in-app confirmation modal.
      // Trigger the delete flow which the parent will confirm before performing the API call.
      onDelete(node.id);
    },
    [onDelete, node.id, node.name],
  );

  const isSelected = selectedFolderId === node.id;

  return (
    <div>
      <div
        onClick={handleSelect}
        className={`flex items-center gap-2 min-h-[44px] px-2 py-1.5 rounded-lg cursor-pointer select-none ${
          isSelected
            ? "bg-indigo-500/20 text-indigo-300"
            : "hover:bg-slate-700/50 text-slate-300"
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleToggle(e); }}
          aria-label={hasChildren ? (expanded ? "Collapse" : "Expand") : "No children"}
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-700/50 transition-colors shrink-0"
          style={{
            color: hasChildren ? "#94a3b8" : "transparent",
            transform: hasChildren ? (expanded ? "rotate(90deg)" : "rotate(0deg)") : undefined,
            transition: "transform 180ms ease",
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v1M4 10h16M4 10v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        </svg>

        <div className="flex-1 min-w-0">
          {!editing ? (
            <div className="text-sm truncate" title={node.name}>{node.name}</div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); submitRename(); }}>
              <input autoFocus value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={submitRename}
                onKeyDown={(e) => { if (e.key === "Escape") { setName(node.name); setEditing(false); } }}
                className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>
          )}
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          {onCreate && (
            <button onClick={(e) => { e.stopPropagation(); onCreate(node.id); }}
              title={t("newFolder", commonTranslations.newFolder)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-700/50 text-slate-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
          {onRename && (
            <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              title={t("rename", commonTranslations.rename)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-700/50 text-slate-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button onClick={handleDelete}
              title={t("delete", commonTranslations.delete)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 text-red-400 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Animated children container */}
      <div
        ref={contentRef}
        style={{
          maxHeight: maxHeight === "none" ? undefined : maxHeight,
          overflow: "hidden",
          transition: "max-height 200ms ease, opacity 150ms ease",
          opacity: expanded ? 1 : 0,
        }}
      >
        <div style={{ paddingTop: hasChildren ? 6 : 0 }}>
          {hasChildren &&
            node.children!.map((c) => (
              <FolderNode
                key={c.id}
                node={c}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                onSelect={onSelect}
                onCreate={onCreate}
                onRename={onRename}
                onDelete={onDelete}
                globalExpandAll={globalExpandAll}
              />
            ))}
        </div>
      </div>
    </div>
  );
}

export default function PlainFolderTree({
  folders,
  selectedFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  loading = false,
  expandAll,
}: PlainFolderTreeProps) {
  const { t } = useTranslation();
  const tree = useMemo(() => buildTree(folders), [folders]);
  const [rootExpanded, setRootExpanded] = useState(true);

  useEffect(() => {
    if (typeof expandAll === "boolean") {
      setRootExpanded(expandAll);
    }
  }, [expandAll]);

  const handleRootToggle = useCallback(() => {
    setRootExpanded((v) => !v);
  }, []);

  if (loading) {
    return (
      <div className="p-4">
        <div className="h-4 bg-slate-700/50 rounded mb-2 w-1/3 animate-pulse" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 bg-slate-700/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Folders" className="plain-folder-tree">
      {/* Root / All Files */}
      <div
        className={`flex items-center gap-2 min-h-[44px] px-2 py-1.5 rounded-lg cursor-pointer select-none ${
          selectedFolderId === null
            ? "bg-indigo-500/20 text-indigo-300"
            : "hover:bg-slate-700/50 text-slate-300"
        }`}
        onClick={() => onFolderSelect(null)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); handleRootToggle(); }}
          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-700/50 transition-colors shrink-0"
          style={{
            color: tree.length ? "#94a3b8" : "transparent",
            transform: rootExpanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 180ms ease",
          }}
          aria-label={tree.length ? (rootExpanded ? "Collapse" : "Expand") : "No folders"}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v1M4 10h16M4 10v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
        </svg>
        <div className="flex-1 min-w-0 font-semibold text-sm">
          {t("allFiles", commonTranslations.allFiles)}
        </div>

        {onCreateFolder && (
          <button onClick={(e) => { e.stopPropagation(); onCreateFolder(null); }}
            title={t("newFolder", commonTranslations.newFolder)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-700/50 text-slate-400 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      <div style={{ marginTop: 6 }}>
        {rootExpanded &&
          tree.map((n) => (
            <FolderNode
              key={n.id}
              node={n}
              level={0}
              selectedFolderId={selectedFolderId}
              onSelect={(id) => onFolderSelect(id)}
              onCreate={onCreateFolder}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
              globalExpandAll={expandAll}
            />
          ))}

        {tree.length === 0 && (
          <div className="px-2 py-3 text-sm text-slate-500 text-center">
            {t("noFoldersYet", commonTranslations.noFoldersYet)}
          </div>
        )}
      </div>
    </nav>
  );
}
