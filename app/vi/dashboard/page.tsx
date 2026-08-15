"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus, Upload, RefreshCw, AlertCircle, X, Cloud, Search,
  HardDrive, FileIcon, FolderIcon, LogOut, Settings, Grid3X3,
  List, ChevronLeft, ChevronRight, ChevronDown, Sidebar, Trash2, FileText,
  RotateCcw, Clock, Star, Sun, Moon, FolderOpen, Download, Copy,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
const DynamicFileGrid = dynamic(() => import("@/components/FileGrid"), { ssr: false });
const DynamicUploadDropzone = dynamic(() => import("@/components/UploadDropzone"), { ssr: false });
const DynamicYoutubeModal = dynamic(() => import("@/components/YoutubeModal"), { ssr: false });
const DynamicUserProfile = dynamic(() => import("@/components/UserProfile"), { ssr: false });
const DynamicShareModal = dynamic(() => import("@/components/ShareModal"), { ssr: false });
const DynamicMoveModal = dynamic(() => import("@/components/MoveModal"), { ssr: false });
const DynamicVersionHistoryModal = dynamic(() => import("@/components/VersionHistoryModal"), { ssr: false });
const DynamicDuplicatesModal = dynamic(() => import("@/components/DuplicatesModal"), { ssr: false });
import Navbar from "@/components/Navbar";
import PlainFolderTree from "@/components/PlainFolderTree";
import ContextMenu from "@/components/ContextMenu";
import Footer from "@/components/Footer";
import { clearAuthCookieClientSide } from "@/utils/auth-helpers";

interface User { id: string; email: string; name: string; createdAt: string; updatedAt: string; stats?: { totalFiles: number; totalSize: number; totalFolders: number; }; }
interface FolderData { id: string; name: string; parent: string | null; createdAt: string; }
interface FileData { id: string; name: string; displayName?: string; size: number; mime: string; folderId: string | null; folderName?: string | null; createdAt: string; favorite?: boolean; }
interface TrashFileData { id: string; name: string; displayName?: string; size: number; mime: string; deletedAt: string; trashExpiresAt: string; }
type CacheKey = string;

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024; const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function Toast({ toast, onDismiss }: { toast: { type: string; message: string } | null; onDismiss: () => void }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-6 right-6 z-[60] max-w-sm animate-slide-up ${toast.type === "success" ? "toast-success" : toast.type === "error" ? "toast-error" : "toast-info"}`}>
      <div className="flex items-center gap-3">
        <span className="text-sm">{toast.message}</span>
        <button onClick={onDismiss} className="ml-auto opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function Modal({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative modal-content w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:text-foreground hover:bg-card-hover transition-all"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function CreateFolderModal({ show, onClose, onConfirm, loading }: { show: boolean; onClose: () => void; onConfirm: (name: string) => void; loading?: boolean }) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (show) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName("");
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
    }
  }, [show]);
  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [show, onClose]);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative modal-content w-full max-w-md">
        <div className="p-6 border-b border-line"><h3 className="text-lg font-semibold text-foreground">Tạo thư mục mới</h3></div>
        <div className="p-6">
          <input ref={inputRef} type="text" placeholder="Tên thư mục" value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-modern w-full px-4 py-2.5 rounded-xl mb-4"
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm(name.trim())} />
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn-secondary px-4 py-2 rounded-lg text-sm">Huỷ</button>
            <button onClick={() => onConfirm(name.trim())} disabled={!name.trim() || loading}
              className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {loading && <svg className="animate-spin h-4 w-4 inline mr-1.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
              Tạo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ show, title, message, warning, loading, onCancel, onConfirm, confirmLabel = "Xoá" }: {
  show: boolean; title: string; message: string; warning?: string; loading?: boolean;
  onCancel: () => void; onConfirm: () => void; confirmLabel?: string;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative modal-content w-full max-w-md p-6">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mb-4 mx-auto">
          <AlertCircle className="w-6 h-6 text-error" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2 text-center">{title}</h3>
        <p className="text-sm text-foreground mb-1 text-center">{message}</p>
        {warning && <p className="text-sm text-error/80 mb-6 text-center">{warning}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} disabled={loading} className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-medium">Huỷ</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-error text-white hover:shadow-lg hover:shadow-error/25 disabled:opacity-50 transition-all">
            {loading && <svg className="animate-spin h-4 w-4 inline mr-1.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, sub, gradient }: { icon: LucideIcon; label: string; value: string; sub?: string; gradient: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-line p-5 group hover:border-line-hover transition-all">
      <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, onClear }: { value: string; onChange: (v: string) => void; onClear: () => void }) {
  return (
    <div className="relative group">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-accent transition-colors" />
      <input ref={(el) => { if (el) el.onkeydown = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") e.preventDefault(); }; }} type="text" placeholder="Tìm kiếm files... (Ctrl+K)" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-modern w-full pl-10 pr-10 py-2.5 rounded-xl text-sm transition-all" />
      {value && (
        <button onClick={onClear} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card border border-line p-5">
          <div className="h-4 bg-card-hover rounded w-3/4 mb-3" />
          <div className="h-3 bg-card-hover rounded w-1/2 mb-4" />
          <div className="h-8 bg-card-hover rounded w-full" />
        </div>
      ))}
    </div>
  );
}

function FileRow({ file, gradient, children }: { file: FileData; gradient: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-line hover:border-line-hover transition-all">
      <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center flex-shrink-0`}>
        <FileIcon className="w-5 h-5 text-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{file.displayName || file.name}</p>
        <p className="text-xs text-muted flex items-center gap-2">
          <span>{formatSize(file.size)}</span>
          <span>{formatDate(file.createdAt)}</span>
          {file.folderName && <span className="text-accent truncate">trong {file.folderName}</span>}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">{children}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function EmptyState({ icon, title, subtitle, gradient }: { icon: React.ReactNode; title: string; subtitle: string; gradient: string }) {
  return (
    <div className="text-center py-20">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className={`absolute inset-0 rounded-3xl ${gradient} blur-lg animate-pulse-slow`} />
        <div className="relative w-24 h-24 rounded-3xl bg-card border border-accent/30 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted">{subtitle}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filesLoading, setFilesLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [spaceMenu, setSpaceMenu] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeView, setActiveView] = useState<"files" | "favorites" | "recent" | "trash">("files");
  const [favoriteFiles, setFavoriteFiles] = useState<FileData[]>([]);
  const [recentFiles, setRecentFiles] = useState<FileData[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark" ? "dark" : "light"
  );
  const showTrash = activeView === "trash";
  const [trashFiles, setTrashFiles] = useState<TrashFileData[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [emptyingTrash, setEmptyingTrash] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showYoutube, setShowYoutube] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [shareFile, setShareFile] = useState<FileData | null>(null);
  const [createFolderParent, setCreateFolderParent] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  useEffect(() => {
    const check = () => setSidebarOpen(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; folder?: FolderData; subfolderCount?: number }>({ show: false });
  const [fileDeleteModal, setFileDeleteModal] = useState<{ show: boolean; fileId?: string; fileName?: string }>({ show: false });
  const [deleting, setDeleting] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  // Client-side file cache: key = "folderId|search"
  const fileCache = useRef<Map<CacheKey, FileData[]>>(new Map());

  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery]);

  // Persist theme preference and apply to <html>
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const PAGE_SIZE = 50;
  const [filesPage, setFilesPage] = useState(1);
  const [filesTotalPages, setFilesTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFiles = useCallback(async (folderId: string | null, search: string, useCache = true) => {
    const cacheKey = `${folderId || ""}|${search}`;
    if (useCache && fileCache.current.has(cacheKey)) {
      setFiles(fileCache.current.get(cacheKey)!);
      setFilesLoading(false);
      return;
    }

    setFilesLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (folderId) params.set("folderId", folderId);
      if (search) params.set("q", search);
      params.set("page", "1");
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        const result = data.files;
        fileCache.current.set(cacheKey, result);
        setFiles(result);
        setFilesPage(1);
        setFilesTotalPages(data.totalPages || 1);
      }
    } catch { setError("Không thể tải files"); }
    finally { setFilesLoading(false); }
  }, []);

  const loadMoreFiles = useCallback(async () => {
    if (loadingMore || filesPage >= filesTotalPages) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (selectedFolderId) params.set("folderId", selectedFolderId);
      if (debouncedSearch) params.set("q", debouncedSearch);
      params.set("page", String(filesPage + 1));
      params.set("limit", String(PAGE_SIZE));
      const res = await fetch(`/api/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        setFiles((prev) => [...prev, ...data.files]);
        setFilesPage(data.page || filesPage + 1);
        setFilesTotalPages(data.totalPages || 1);
      }
    } catch { /* ignore */ }
    finally { setLoadingMore(false); }
  }, [loadingMore, filesPage, filesTotalPages, selectedFolderId, debouncedSearch]);

  const refreshFolders = useCallback(async () => {
    setFoldersLoading(true);
    try { const res = await fetch("/api/folders"); if (res.ok) setFolders(await res.json()); }
    finally { setFoldersLoading(false); }
  }, []);

  // Initial load: auth + folders in parallel, then load files
  useEffect(() => {
    (async () => {
      try {
        const [authRes, foldersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/folders"),
        ]);
        if (authRes.status === 401) {
          router.push("/login");
          return;
        }
        if (!authRes.ok) {
          setError("Không thể xác minh phiên đăng nhập. Vui lòng thử lại.");
          return;
        }
        setUser(await authRes.json());
        if (foldersRes.ok) {
          const folderData = await foldersRes.json();
          setFolders(folderData);
        }
      } catch { setError("Không thể xác minh phiên đăng nhập. Vui lòng thử lại."); }
      finally { setLoading(false); }
    })();
  }, []);

  // Load files when folder/search changes (with cache)
  useEffect(() => {
    if (!user) return;
    loadFiles(selectedFolderId, debouncedSearch, true);
  }, [user, selectedFolderId, debouncedSearch, loadFiles]);

  const refreshData = useCallback(() => {
    fileCache.current.clear();
    loadFiles(selectedFolderId, debouncedSearch, false);
    refreshFolders();
  }, [selectedFolderId, debouncedSearch, loadFiles, refreshFolders]);

  const handleFolderSelect = useCallback((folderId: string | null) => {
    setSelectedFolderId(folderId);
    setSearchQuery("");
    setActiveView("files");
  }, []);

  const handleCreateFolder = useCallback((parentId: string | null) => {
    setCreateFolderParent(parentId);
    setShowCreateFolder(true);
  }, []);

  const confirmCreateFolder = async (folderName?: string) => {
    const name = folderName?.trim() || newFolderName.trim();
    if (!name) return;
    setCreatingFolder(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parent: createFolderParent }),
      });
      if (res.ok) { fileCache.current.clear(); refreshData(); setShowCreateFolder(false); setNewFolderName(""); }
    } catch { /* ignore */ }
    setCreatingFolder(false);
  };

  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      const res = await fetch(`/api/folders/${folderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
      if (res.ok) { fileCache.current.clear(); refreshFolders(); }
    } catch { /* ignore */ }
  };

  const countSubfolders = (folders: FolderData[], parentId: string): number => {
    const children = folders.filter((f) => f.parent === parentId);
    return children.length + children.reduce((sum, child) => sum + countSubfolders(folders, child.id), 0);
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    setDeleteModal({ show: true, folder, subfolderCount: countSubfolders(folders, folderId) });
  };

  const confirmDeleteFolder = async () => {
    if (!deleteModal.folder) return;
    try {
      setToast({ type: "info", message: "Đang xoá thư mục..." });
      const res = await fetch(`/api/folders/${deleteModal.folder.id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: "Đã xoá thư mục" });
        fileCache.current.clear();
        refreshFolders();
        if (selectedFolderId === deleteModal.folder.id) setSelectedFolderId(null);
      }
    } catch { setToast({ type: "error", message: "Xoá thư mục thất bại" }); }
    finally { setDeleteModal({ show: false }); setTimeout(() => setToast(null), 4000); }
  };

  const handleUserUpdate = (updatedUser: User) => { setUser(updatedUser); refreshData(); };

  const handleUpload = async (uploadedFiles: File[], folderId?: string | null) => {
    fileCache.current.clear();
    await loadFiles(selectedFolderId, debouncedSearch, false);
    setShowUpload(false);
  };

  const handleDeleteFile = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    setFileDeleteModal({ show: true, fileId, fileName: file?.name ?? "Unknown" });
  };

  const confirmDeleteFile = async () => {
    if (!fileDeleteModal.fileId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/files/${fileDeleteModal.fileId}`, { method: "DELETE" });
      if (res.ok) {
        fileCache.current.clear();
        await loadFiles(selectedFolderId, debouncedSearch, false);
        setToast({ type: "success", message: "Đã xoá file" });
      }
    } catch { setToast({ type: "error", message: "Xoá file thất bại" }); }
    finally { setDeleting(false); setFileDeleteModal({ show: false }); setTimeout(() => setToast(null), 3000); }
  };

  const handleDownload = (fileId: string, _fileName: string) => {
    const a = document.createElement("a");
    a.href = `/api/files/${fileId}/download`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = useCallback((file: FileData) => {
    setShareFile(file);
  }, []);

  const [moveFile, setMoveFile] = useState<FileData | null>(null);

  const handleMove = useCallback((file: FileData) => {
    setMoveFile(file);
  }, []);

  const [moveFolder, setMoveFolder] = useState<{ id: string; name: string } | null>(null);

  const [versionsFile, setVersionsFile] = useState<FileData | null>(null);
  const [versionsKey, setVersionsKey] = useState(0);

  const handleVersions = useCallback((file: FileData) => {
    setVersionsFile(file);
  }, []);

  const [showDuplicates, setShowDuplicates] = useState(false);

  const getFolderDescendants = (folderId: string, all: FolderData[] = folders): string[] => {
    const result: string[] = [];
    const walk = (parentId: string) => {
      all.forEach((f) => {
        if (f.parent === parentId) {
          result.push(f.id);
          walk(f.id);
        }
      });
    };
    walk(folderId);
    return result;
  };

  const handleMoveFolder = useCallback((folder: { id: string; name: string }) => {
    setMoveFolder(folder);
  }, []);

  const loadTrashFiles = useCallback(async () => {
    setTrashLoading(true);
    try {
      const res = await fetch("/api/trash");
      if (res.ok) {
        const data = await res.json();
        setTrashFiles(data.files || []);
      }
    } catch { /* ignore */ }
    finally { setTrashLoading(false); }
  }, []);

  const loadFavorites = useCallback(async () => {
    setFavoritesLoading(true);
    try {
      const res = await fetch("/api/files?favorite=true&limit=100");
      if (res.ok) {
        const data = await res.json();
        setFavoriteFiles(data.files || []);
      }
    } catch { /* ignore */ }
    finally { setFavoritesLoading(false); }
  }, []);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      const res = await fetch("/api/files?view=recent&limit=30");
      if (res.ok) {
        const data = await res.json();
        setRecentFiles(data.files || []);
      }
    } catch { /* ignore */ }
    finally { setRecentLoading(false); }
  }, []);

  const handleToggleFavorite = useCallback(async (file: FileData) => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "favorite" }),
      });
      if (res.ok) {
        const data = await res.json();
        const isFav: boolean = data.favorite;
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, favorite: isFav } : f)));
        setFavoriteFiles((prev) =>
          isFav
            ? prev.some((f) => f.id === file.id) ? prev : [{ ...file, favorite: true }, ...prev]
            : prev.filter((f) => f.id !== file.id)
        );
        setRecentFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, favorite: isFav } : f)));
        setToast({ type: "success", message: isFav ? "Đã thêm vào Yêu thích" : "Đã bỏ khỏi Yêu thích" });
      } else {
        setToast({ type: "error", message: "Cập nhật yêu thích thất bại" });
      }
    } catch { setToast({ type: "error", message: "Cập nhật yêu thích thất bại" }); }
    finally { setTimeout(() => setToast(null), 3000); }
  }, []);

  const handleOpenFolder = useCallback((folderId: string | null) => {
    handleFolderSelect(folderId);
    setActiveView("files");
    setSearchQuery("");
  }, [handleFolderSelect]);

  const handleRestoreFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (res.ok) {
        setToast({ type: "success", message: "Đã khôi phục file" });
        loadTrashFiles();
        fileCache.current.clear();
        if (!showTrash) loadFiles(selectedFolderId, debouncedSearch, false);
      }
    } catch { setToast({ type: "error", message: "Khôi phục file thất bại" }); }
    finally { setTimeout(() => setToast(null), 3000); }
  };

  const handleEmptyTrash = async () => {
    setEmptyingTrash(true);
    try {
      const res = await fetch("/api/trash/empty", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToast({ type: "success", message: `Đã xoá vĩnh viễn ${data.deleted} file` });
        setTrashFiles([]);
      }
    } catch { setToast({ type: "error", message: "Dọn thùng rác thất bại" }); }
    finally { setEmptyingTrash(false); setTimeout(() => setToast(null), 3000); }
  };

  const handlePermanentDelete = async (fileId: string) => {
    if (!window.confirm("Xoá vĩnh viễn file này? Không thể hoàn tác.")) return;
    try {
      const res = await fetch(`/api/trash?id=${fileId}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: "Đã xoá file vĩnh viễn" });
        setTrashFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        const data = await res.json().catch(() => ({}));
        setToast({ type: "error", message: data.error || "Xoá file thất bại" });
      }
    } catch { setToast({ type: "error", message: "Xoá file thất bại" }); }
    finally { setTimeout(() => setToast(null), 3000); }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      clearAuthCookieClientSide();
      if (response.ok) router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      clearAuthCookieClientSide();
    }
  };

  const totalSize = user?.stats?.totalSize ?? 0;
  const totalFiles = user?.stats?.totalFiles ?? files.length;
  const totalFolders = user?.stats?.totalFolders ?? folders.length;
  const childFolders = selectedFolderId ? folders.filter(f => f.parent === selectedFolderId) : [];
  const currentFolderName = selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : null;

  if (loading) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5 shadow-lg animate-pulse">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen app-bg flex flex-col overflow-hidden animate-fade-in">
      <Navbar user={user} onOpenUserProfile={() => setShowUserProfile(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          flex-shrink-0 bg-background border-r border-line flex flex-col relative
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-72" : "w-0 lg:w-16"}
          ${sidebarOpen ? "" : "overflow-hidden"}
          max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:h-full max-lg:z-40
          ${sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
        `}>
          {sidebarOpen ? (
            <div className="flex flex-col h-full min-w-72">
              <div className="p-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-sm font-bold text-foreground">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">{user.email}</p>
                  </div>
                  <button onClick={() => setSidebarOpen(false)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all" title="Thu gọn sidebar">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-3 border-b border-line">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setShowUpload(true); setSidebarOpen(false); }}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-accent/10 border border-accent/25 text-accent hover:bg-accent/20 hover:border-accent/30 transition-all text-sm font-medium min-h-[44px]">
                    <Upload className="w-4 h-4" /> Tải lên
                  </button>
                  <button onClick={() => { setShowYoutube(true); setSidebarOpen(false); }}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-card border border-line text-foreground hover:bg-card-hover hover:border-line-hover transition-all text-sm font-medium min-h-[44px]">
                    <Youtube className="w-4 h-4 text-error" /> YouTube
                  </button>
                  <button onClick={() => { handleCreateFolder(selectedFolderId); setSidebarOpen(false); }}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-card border border-line text-foreground hover:bg-card-hover hover:border-line-hover transition-all text-sm font-medium min-h-[44px]">
                    <FolderPlus className="w-4 h-4" /> Mới
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Thư mục</h3>
                    <button onClick={() => refreshFolders()} disabled={foldersLoading} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-muted hover:bg-card-hover transition-colors">
                      <RefreshCw className={`w-3.5 h-3.5 ${foldersLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  {foldersLoading && folders.length === 0 ? (
                    <div className="space-y-2 px-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-card animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <PlainFolderTree folders={folders} selectedFolderId={selectedFolderId}
                      onFolderSelect={(id) => { handleFolderSelect(id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                      onCreateFolder={handleCreateFolder}
                      onRenameFolder={handleRenameFolder} onDeleteFolder={handleDeleteFolder} expandAll={true} />
                  )}
                </div>
              </div>
              <div className="p-3 border-t border-line">
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setActiveView(activeView === "favorites" ? "files" : "favorites"); loadFavorites(); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all min-h-[44px] ${activeView === "favorites" ? "text-warning bg-warning/10" : "text-muted hover:text-foreground hover:bg-card-hover"}`}>
                    <Star className={`w-4 h-4 ${activeView === "favorites" ? "fill-amber-400" : ""}`} /> Yêu thích
                  </button>
                  <button onClick={() => { setActiveView(activeView === "recent" ? "files" : "recent"); loadRecent(); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all min-h-[44px] ${activeView === "recent" ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-card-hover"}`}>
                    <Clock className="w-4 h-4" /> Gần đây
                  </button>
                  <button onClick={() => { setShowDuplicates(true); setSidebarOpen(false); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-muted hover:text-foreground hover:bg-card-hover transition-all min-h-[44px]">
                    <Copy className="w-4 h-4" /> Trùng lặp
                  </button>
                  <button onClick={() => { setActiveView(activeView === "trash" ? "files" : "trash"); loadTrashFiles(); setSidebarOpen(false); }}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all min-h-[44px] ${showTrash ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-card-hover"}`}>
                    <Trash2 className="w-4 h-4" /> Thùng rác
                  </button>
                  <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-muted hover:text-foreground hover:bg-card-hover transition-all min-h-[44px]">
                    {theme === "dark" ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-indigo-400" />}
                    {theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
                  </button>
                  <button onClick={() => { setShowUserProfile(true); setSidebarOpen(false); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-muted hover:text-foreground hover:bg-card-hover transition-all min-h-[44px]">
                    <Settings className="w-4 h-4" /> Cài đặt
                  </button>
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-error/70 hover:text-error hover:bg-error/10 transition-all min-h-[44px]">
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center h-full py-4 gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-sm font-bold text-foreground">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="w-8 border-t border-line" />
              <button onClick={() => setShowUpload(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-accent hover:bg-card-hover transition-all" title="Tải lên">
                <Upload className="w-4 h-4" />
              </button>
              <button onClick={() => setShowYoutube(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all" title="Tải từ YouTube">
                <Youtube className="w-4 h-4" />
              </button>
              <button onClick={() => handleCreateFolder(selectedFolderId)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all" title="Thư mục mới">
                <FolderPlus className="w-4 h-4" />
              </button>
              <div className="flex-1" />
              <button onClick={() => { setActiveView(activeView === "favorites" ? "files" : "favorites"); loadFavorites(); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeView === "favorites" ? "text-warning bg-warning/10" : "text-muted hover:text-foreground hover:bg-card-hover"}`} title="Yêu thích">
                <Star className={`w-4 h-4 ${activeView === "favorites" ? "fill-amber-400" : ""}`} />
              </button>
              <button onClick={() => { setActiveView(activeView === "recent" ? "files" : "recent"); loadRecent(); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeView === "recent" ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-card-hover"}`} title="Gần đây">
                <Clock className="w-4 h-4" />
              </button>
              <button onClick={() => { setActiveView(activeView === "trash" ? "files" : "trash"); loadTrashFiles(); }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showTrash ? "text-accent bg-accent/10" : "text-muted hover:text-foreground hover:bg-card-hover"}`} title="Thùng rác">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all" title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}>
                {theme === "dark" ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-indigo-400" />}
              </button>
              <button onClick={() => setShowUserProfile(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all" title="Cài đặt">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={handleLogout}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-error/70 hover:text-error hover:bg-error/10 transition-all" title="Đăng xuất">
                <LogOut className="w-4 h-4" />
              </button>
              <div className="w-8 border-t border-line" />
              <button onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-card-hover transition-all" title="Mở rộng sidebar">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex-shrink-0 border-b border-line bg-card backdrop-blur-xl">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2 rounded-lg text-muted hover:text-foreground">
                  <Sidebar className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-xl font-bold text-foreground truncate">
                      {activeView === "trash" ? "Thùng rác" : activeView === "favorites" ? "Yêu thích" : activeView === "recent" ? "Gần đây" : currentFolderName || "Tất cả files"}
                    </h1>
                    {debouncedSearch && activeView === "files" && <span className="text-sm text-accent hidden sm:inline">&mdash; &ldquo;{debouncedSearch}&rdquo;</span>}
                  </div>
                  <p className="text-xs text-muted">
                    {activeView === "favorites"
                      ? `${favoriteFiles.length} file yêu thích`
                      : activeView === "recent"
                        ? `${recentFiles.length} file mới nhất`
                        : showTrash
                          ? `${trashFiles.length} file trong thùng rác`
                          : selectedFolderId
                            ? `${files.length} file${childFolders.length > 0 ? ` · ${childFolders.length} thư mục con` : ""}`
                            : `${totalFiles} file · ${totalFolders} thư mục`}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <div className="flex-1">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} onClear={() => setSearchQuery("")} />
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 bg-card rounded-xl p-1">
                    {(["grid", "list"] as const).map((mode) => (
                      <button key={mode} onClick={() => setViewMode(mode)}
                        className={`p-2 rounded-lg transition-all ${viewMode === mode ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"}`} title={mode === "grid" ? "Dạng lưới" : "Dạng danh sách"}>
                        {mode === "grid" ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <button onClick={refreshData} disabled={filesLoading || foldersLoading}
                    className="btn-secondary px-3 py-2 rounded-xl text-sm flex items-center gap-2 border-line hover:border-line-hover">
                    <RefreshCw className={`w-4 h-4 ${filesLoading || foldersLoading ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Làm mới</span>
                  </button>
                  <button onClick={() => setShowYoutube(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-line bg-card text-foreground hover:bg-card-hover hover:border-line-hover transition-colors">
                    <Youtube className="w-4 h-4 text-error" /> <span className="hidden sm:inline">YouTube</span>
                  </button>
                  <button onClick={() => setShowUpload(true)}
                    className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Tải lên</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto"
            onContextMenu={(e) => {
              if ((e.target as HTMLElement).closest("[data-context-menu]")) return;
              e.preventDefault();
              setSpaceMenu({ x: e.clientX, y: e.clientY });
            }}
            onClick={() => setSpaceMenu(null)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pt-5 pb-2">
              <StatsCard icon={FileIcon} label="Files" value={totalFiles.toLocaleString()} gradient="bg-accent" />
              <StatsCard icon={FolderIcon} label="Thư mục" value={totalFolders.toLocaleString()} gradient="bg-sub" />
              <StatsCard icon={HardDrive} label="Lưu trữ" value={formatSize(totalSize)} gradient="bg-warning" />
            </div>

            {error && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-error/10 border border-red-500/20 flex items-center gap-3 text-error">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-error hover:text-error p-1"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Trash view */}
            {showTrash ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-error" />
                    <h2 className="text-lg font-semibold text-foreground">Thùng rác</h2>
                    <span className="text-xs text-muted">File tự động xoá sau 30 ngày</span>
                  </div>
                  <button onClick={handleEmptyTrash} disabled={trashFiles.length === 0 || emptyingTrash}
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-error text-white hover:shadow-lg hover:shadow-error/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2">
                    {emptyingTrash ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Dọn thùng rác
                  </button>
                </div>
                {trashLoading ? (
                  <SkeletonLoader />
                ) : trashFiles.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/25 to-rose-400/25 blur-lg animate-pulse-slow" />
                      <div className="relative w-24 h-24 rounded-3xl bg-card border border-error/30 flex items-center justify-center">
                        <Trash2 className="w-12 h-12 text-error" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">Thùng rác trống</h3>
                    <p className="text-sm text-muted">File đã xoá sẽ xuất hiện ở đây và tự động xoá sau 30 ngày.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trashFiles.map((file) => {
                      const expiresAt = new Date(file.trashExpiresAt);
                      const now = new Date();
                      const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={file.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-line hover:border-line-hover transition-all">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-rose-500/20 flex items-center justify-center flex-shrink-0">
                            <FileIcon className="w-5 h-5 text-error" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{file.displayName || file.name}</p>
                            <p className="text-xs text-muted">{formatSize(file.size)}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${daysLeft <= 3 ? "text-error bg-error/10" : "text-muted bg-card-hover"}`}>
                            <Clock className="w-3 h-3" />
                            {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Hết hạn"}
                          </div>
                          <button onClick={() => handleRestoreFile(file.id)}
                            className="px-3 py-2 rounded-lg text-sm text-accent hover:text-accent hover:bg-accent/10 transition-all flex items-center gap-1.5 min-h-[44px]">
                            <RotateCcw className="w-4 h-4" /> Khôi phục
                          </button>
                          <button onClick={() => handlePermanentDelete(file.id)}
                            className="px-3 py-2 rounded-lg text-sm text-error hover:text-error hover:bg-error/10 transition-all flex items-center gap-1.5 min-h-[44px]"
                            title="Xoá vĩnh viễn">
                            <Trash2 className="w-4 h-4" /> Xoá vĩnh viễn
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeView === "favorites" ? (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Star className="w-5 h-5 text-warning" />
                  <h2 className="text-lg font-semibold text-foreground">Yêu thích</h2>
                  <span className="text-xs text-muted">{favoriteFiles.length} file</span>
                </div>
                {favoritesLoading ? (
                  <SkeletonLoader />
                ) : favoriteFiles.length === 0 ? (
                  <EmptyState
                    icon={<Star className="w-12 h-12 text-warning" />}
                    title="Chưa có file yêu thích"
                    subtitle="Gắn sao file để ghim chúng vào đây truy cập nhanh."
                    gradient="bg-gradient-to-br from-amber-500/25 to-orange-400/25"
                  />
                ) : (
                  <div className="space-y-2">
                    {favoriteFiles.map((file) => (
                      <FileRow key={file.id} file={file} gradient="bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                        {file.folderId && (
                          <button onClick={() => handleOpenFolder(file.folderId)}
                            className="px-2.5 py-2 rounded-lg text-xs text-accent hover:text-accent hover:bg-accent/10 transition-all flex items-center gap-1.5" title="Mở thư mục chứa">
                            <FolderOpen className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDownload(file.id, file.displayName || file.name)}
                          className="px-2.5 py-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-card-hover transition-all flex items-center gap-1.5" title="Tải xuống">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleFavorite(file)}
                          className="px-2.5 py-2 rounded-lg text-xs text-warning hover:text-warning hover:bg-warning/10 transition-all flex items-center gap-1.5" title="Bỏ khỏi Yêu thích">
                          <Star className="w-4 h-4 fill-amber-400" />
                        </button>
                      </FileRow>
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === "recent" ? (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-5 h-5 text-accent" />
                  <h2 className="text-lg font-semibold text-foreground">Gần đây</h2>
                  <span className="text-xs text-muted">File mới nhất trên tất cả thư mục</span>
                </div>
                {recentLoading ? (
                  <SkeletonLoader />
                ) : recentFiles.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="w-12 h-12 text-accent" />}
                    title="Không có file gần đây"
                    subtitle="File bạn tải lên sẽ xuất hiện tại đây."
                    gradient="bg-gradient-to-br from-blue-500/25 to-cyan-400/25"
                  />
                ) : (
                  <div className="space-y-2">
                    {recentFiles.map((file) => (
                      <FileRow key={file.id} file={file} gradient="bg-gradient-to-br from-sky-500/20 to-cyan-500/20">
                        {file.folderId && (
                          <button onClick={() => handleOpenFolder(file.folderId)}
                            className="px-2.5 py-2 rounded-lg text-xs text-accent hover:text-accent hover:bg-accent/10 transition-all flex items-center gap-1.5" title="Mở thư mục chứa">
                            <FolderOpen className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDownload(file.id, file.displayName || file.name)}
                          className="px-2.5 py-2 rounded-lg text-xs text-muted hover:text-foreground hover:bg-card-hover transition-all flex items-center gap-1.5" title="Tải xuống">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleFavorite(file)}
                          className={`px-2.5 py-2 rounded-lg text-xs transition-all flex items-center gap-1.5 ${file.favorite ? "text-warning hover:bg-warning/10" : "text-muted hover:text-warning hover:bg-card-hover"}`}
                          title={file.favorite ? "Bỏ khỏi Yêu thích" : "Thêm vào Yêu thích"}>
                          <Star className={`w-4 h-4 ${file.favorite ? "fill-amber-400" : ""}`} />
                        </button>
                      </FileRow>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Sub-folders */}
                {childFolders.length > 0 && !debouncedSearch && (
                  <div className="px-6 pt-5">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderIcon className="w-4 h-4 text-accent" />
                      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Thư mục con</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {childFolders.map(child => (
                        <ContextMenu key={child.id}
                          items={[
                            { label: "Mở", icon: <FolderIcon className="w-4 h-4" />, onClick: () => handleFolderSelect(child.id) },
                            { divider: true },
                            { label: "Tạo thư mục con", icon: <FolderPlus className="w-4 h-4" />, onClick: () => handleCreateFolder(child.id) },
                            { divider: true },
                            { label: "Di chuyển tới...", icon: <FolderOpen className="w-4 h-4" />, onClick: () => handleMoveFolder(child) },
                            { label: "Đổi tên", icon: <FileText className="w-4 h-4" />, onClick: () => { const name = prompt("Đổi tên thư mục:", child.name); if (name && name.trim()) handleRenameFolder(child.id, name.trim()); } },
                            { label: "Xoá", icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDeleteFolder(child.id), danger: true },
                          ]}>
                          <div data-context-menu="true" onClick={() => handleFolderSelect(child.id)}
                            className="group relative flex items-center gap-3 p-3 rounded-xl bg-card border border-line hover:border-accent/30 hover:bg-card-hover cursor-pointer transition-all">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                              <FolderIcon className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{child.name}</p>
                              <p className="text-xs text-muted">{folders.filter(f => f.parent === child.id).length} thư mục con</p>
                            </div>
                          </div>
                        </ContextMenu>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                <div className="p-6">
                  {filesLoading && files.length === 0 && !selectedFolderId ? (
                    <SkeletonLoader />
                  ) : files.length === 0 && childFolders.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="relative w-24 h-24 mx-auto mb-6">
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/30 to-cyan-400/30 blur-lg animate-pulse-slow" />
                        <div className="relative w-24 h-24 rounded-3xl bg-card border border-accent/30 flex items-center justify-center">
                          <Cloud className="w-12 h-12 text-accent" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        {debouncedSearch ? `Không có kết quả cho "${debouncedSearch}"` : selectedFolderId ? "Thư mục này trống" : "Chưa có file nào"}
                      </h3>
                      <p className="text-sm text-muted mb-6 max-w-md mx-auto">
                        {debouncedSearch ? "Thử từ khoá khác hoặc duyệt thư mục của bạn." : selectedFolderId ? "Kéo thả file vào đây hoặc dùng nút tải lên để thêm files." : "Tải file đầu tiên để bắt đầu với FreeClouds."}
                      </p>
                      {!debouncedSearch && (
                        <div className="flex gap-3 justify-center">
                          <button onClick={() => setShowUpload(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                            <Upload className="w-4 h-4" /> Tải files lên
                          </button>
                          <button onClick={() => handleCreateFolder(selectedFolderId)} className="btn-secondary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                            <FolderPlus className="w-4 h-4" /> Tạo thư mục
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {filesLoading && files.length > 0 && (
                        <div className="flex items-center gap-2 mb-4 text-sm text-muted">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Đang làm mới...
                    </div>
                  )}
                  <DynamicFileGrid files={files} loading={filesLoading}
                    onDownload={handleDownload} onDelete={handleDeleteFile}
                    onShare={handleShare} onMove={handleMove} onVersions={handleVersions}
                    onSearch={setSearchQuery} searchQuery={searchQuery}
                    onToggleFavorite={handleToggleFavorite} onOpenFolder={handleOpenFolder}
                    viewMode={viewMode} onViewModeChange={setViewMode} />

                  {files.length > 0 && filesPage < filesTotalPages && (
                    <div className="mt-6 flex justify-center pb-6">
                      <button onClick={loadMoreFiles} disabled={loadingMore}
                        className="btn-secondary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 disabled:opacity-50">
                        {loadingMore ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                        {loadingMore ? "Đang tải..." : `Tải thêm (${files.length} / ${filesTotalPages * PAGE_SIZE}+)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  </div>

  {spaceMenu && (
        <div className="fixed z-[100] min-w-[180px] py-1.5 rounded-xl bg-card border border-line shadow-xl backdrop-blur-xl"
          style={{ left: spaceMenu.x, top: spaceMenu.y }}
          onClick={() => setSpaceMenu(null)}>
          <button onClick={() => { setShowUpload(true); setSpaceMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-card-hover transition-colors">
            <Upload className="w-4 h-4" /> Tải files lên
          </button>
          <button onClick={() => { handleCreateFolder(selectedFolderId); setSpaceMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-card-hover transition-colors">
            <FolderPlus className="w-4 h-4" /> Thư mục mới
          </button>
          <div className="my-1 border-t border-line" />
          <button onClick={() => { refreshData(); setSpaceMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-card-hover transition-colors">
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
        </div>
      )}

      <Modal show={showUpload} onClose={() => setShowUpload(false)} title="Tải files lên">
        <DynamicUploadDropzone onUpload={(files) => handleUpload(files, selectedFolderId)} folderId={selectedFolderId} />
      </Modal>

      <Modal show={showYoutube} onClose={() => setShowYoutube(false)} title="Tải từ YouTube">
        <DynamicYoutubeModal
          folderId={selectedFolderId}
          onClose={() => setShowYoutube(false)}
          onUploaded={() => { fileCache.current.clear(); loadFiles(selectedFolderId, debouncedSearch, false); refreshFolders(); }}
        />
      </Modal>
      <Modal show={showUserProfile} onClose={() => setShowUserProfile(false)} title="Thông tin cá nhân">
        <Suspense fallback={<div className="text-center py-4 text-muted">Đang tải...</div>}>
          <DynamicUserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} user={user!} onUserUpdate={handleUserUpdate} />
        </Suspense>
      </Modal>

      {shareFile && (
        <DynamicShareModal fileId={shareFile.id} fileName={shareFile.displayName || shareFile.name} lang="vi"
          onClose={() => setShareFile(null)}
          onToast={(type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); }} />
      )}

      {moveFile && (
        <DynamicMoveModal isOpen={!!moveFile}
          onClose={() => setMoveFile(null)}
          item={{ id: moveFile.id, name: moveFile.displayName || moveFile.name, kind: "file" }}
          folders={folders}
          currentFolderId={selectedFolderId}
          onMoved={() => { fileCache.current.clear(); loadFiles(selectedFolderId, debouncedSearch, false); setToast({ type: "success", message: "Đã di chuyển tệp" }); setTimeout(() => setToast(null), 3000); }} />
      )}

      {moveFolder && (
        <DynamicMoveModal isOpen={!!moveFolder}
          onClose={() => setMoveFolder(null)}
          item={{ id: moveFolder.id, name: moveFolder.name, kind: "folder" }}
          folders={folders}
          currentFolderId={selectedFolderId}
          excludeIds={[moveFolder.id, ...getFolderDescendants(moveFolder.id)]}
          onMoved={() => { refreshFolders(); if (selectedFolderId && (moveFolder.id === selectedFolderId || getFolderDescendants(moveFolder.id).includes(selectedFolderId))) setSelectedFolderId(null); setToast({ type: "success", message: "Đã di chuyển thư mục" }); setTimeout(() => setToast(null), 3000); }} />
      )}

      {versionsFile && (
        <DynamicVersionHistoryModal
          key={versionsKey}
          fileId={versionsFile.id}
          fileName={versionsFile.displayName || versionsFile.name}
          onClose={() => setVersionsFile(null)}
          onToast={(type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); }}
          onVersionChanged={() => { setVersionsKey((k) => k + 1); fileCache.current.clear(); loadFiles(selectedFolderId, debouncedSearch, false); }} />
      )}

      {showDuplicates && (
        <DynamicDuplicatesModal
          onClose={() => setShowDuplicates(false)}
          onToast={(type, message) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000); }}
          onChanged={() => { fileCache.current.clear(); loadFiles(selectedFolderId, debouncedSearch, false); }}
          onOpenFolder={(folderId) => { setActiveView("files"); setSelectedFolderId(folderId); loadFiles(folderId, debouncedSearch, false); }} />
      )}

      <CreateFolderModal show={showCreateFolder} loading={creatingFolder} onClose={() => { setShowCreateFolder(false); setNewFolderName(""); }} onConfirm={confirmCreateFolder} />

      <ConfirmModal show={deleteModal.show} title="Xoá thư mục"
        message={`Xoá vĩnh viễn "${deleteModal.folder?.name}"?${deleteModal.subfolderCount && deleteModal.subfolderCount > 0 ? ` Thao tác này cũng xoá ${deleteModal.subfolderCount} thư mục con.` : ""}`}
        warning="Hành động này không thể hoàn tác." onCancel={() => setDeleteModal({ show: false })} onConfirm={confirmDeleteFolder} />
      <ConfirmModal show={fileDeleteModal.show} title="Xoá file" message={`Xoá vĩnh viễn "${fileDeleteModal.fileName}"?`}
        warning="Hành động này không thể hoàn tác." loading={deleting} onCancel={() => setFileDeleteModal({ show: false })} onConfirm={confirmDeleteFile} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <Footer />
    </div>
  );
}
