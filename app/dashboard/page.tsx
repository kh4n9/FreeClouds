"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  FolderPlus, Upload, RefreshCw, AlertCircle, X, Cloud, Search,
  HardDrive, FileIcon, FolderIcon, LogOut, Settings, Grid3X3,
  List, ChevronLeft, ChevronRight, Sidebar, Trash2, FileText,
} from "lucide-react";
import dynamic from "next/dynamic";
const DynamicFileGrid = dynamic(() => import("@/components/FileGrid"), { ssr: false });
const DynamicUploadDropzone = dynamic(() => import("@/components/UploadDropzone"), { ssr: false });
const DynamicUserProfile = dynamic(() => import("@/components/UserProfile"), { ssr: false });
import Navbar from "@/components/Navbar";
import PlainFolderTree from "@/components/PlainFolderTree";
import ContextMenu from "@/components/ContextMenu";
import Footer from "@/components/Footer";

interface User { id: string; email: string; name: string; createdAt: string; updatedAt: string; stats?: { totalFiles: number; totalSize: number; totalFolders: number; }; }
interface FolderData { id: string; name: string; parent: string | null; createdAt: string; }
interface FileData { id: string; name: string; size: number; mime: string; folderId: string | null; folderName?: string | null; createdAt: string; }
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
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all"><X className="w-4 h-4" /></button>
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
        <div className="p-6 border-b border-slate-700/50"><h3 className="text-lg font-semibold text-white">Create New Folder</h3></div>
        <div className="p-6">
          <input ref={inputRef} type="text" placeholder="Folder name" value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-modern w-full px-4 py-2.5 rounded-xl mb-4"
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm(name.trim())} />
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="btn-secondary px-4 py-2 rounded-lg text-sm">Cancel</button>
            <button onClick={() => onConfirm(name.trim())} disabled={!name.trim() || loading}
              className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50">
              {loading && <svg className="animate-spin h-4 w-4 inline mr-1.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ show, title, message, warning, loading, onCancel, onConfirm, confirmLabel = "Delete" }: {
  show: boolean; title: string; message: string; warning?: string; loading?: boolean;
  onCancel: () => void; onConfirm: () => void; confirmLabel?: string;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative modal-content w-full max-w-md p-6">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 text-center">{title}</h3>
        <p className="text-sm text-slate-300 mb-1 text-center">{message}</p>
        {warning && <p className="text-sm text-red-400/80 mb-6 text-center">{warning}</p>}
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} disabled={loading} className="btn-secondary px-5 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg hover:shadow-red-500/25 disabled:opacity-50 transition-all">
            {loading && <svg className="animate-spin h-4 w-4 inline mr-1.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ icon: Icon, label, value, sub, gradient }: { icon: any; label: string; value: string; sub?: string; gradient: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 group hover:border-slate-600/50 transition-all">
      <div className={`absolute inset-0 opacity-[0.03] ${gradient}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
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
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
      <input ref={(el) => { if (el) el.onkeydown = (e: any) => { if ((e.ctrlKey || e.metaKey) && e.key === "k") e.preventDefault(); }; }} type="text" placeholder="Search files... (Ctrl+K)" value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-modern w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-slate-800/50 border-slate-700/50 focus:border-indigo-500/50 focus:bg-slate-800/80 transition-all" />
      {value && (
        <button onClick={onClear} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
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
        <div key={i} className="rounded-2xl bg-slate-800/30 border border-slate-700/30 p-5">
          <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-3" />
          <div className="h-3 bg-slate-700/50 rounded w-1/2 mb-4" />
          <div className="h-8 bg-slate-700/50 rounded w-full" />
        </div>
      ))}
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
  const [showUpload, setShowUpload] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      const res = await fetch(`/api/files?${params}`);
      if (res.ok) {
        const data = await res.json();
        const result = data.files;
        fileCache.current.set(cacheKey, result);
        setFiles(result);
      }
    } catch { setError("Failed to load files"); }
    finally { setFilesLoading(false); }
  }, []);

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
        if (!authRes.ok) { router.push("/login"); return; }
        setUser(await authRes.json());
        if (foldersRes.ok) {
          const folderData = await foldersRes.json();
          setFolders(folderData);
        }
      } catch { router.push("/login"); }
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
      setToast({ type: "info", message: "Deleting folder..." });
      const res = await fetch(`/api/folders/${deleteModal.folder.id}`, { method: "DELETE" });
      if (res.ok) {
        setToast({ type: "success", message: "Folder deleted" });
        fileCache.current.clear();
        refreshFolders();
        if (selectedFolderId === deleteModal.folder.id) setSelectedFolderId(null);
      }
    } catch { setToast({ type: "error", message: "Failed to delete folder" }); }
    finally { setDeleteModal({ show: false }); setTimeout(() => setToast(null), 4000); }
  };

  const handleUserUpdate = (updatedUser: User) => { setUser(updatedUser); refreshData(); };

  const handleUpload = async (uploadedFiles: File[], folderId?: string | null) => {
    try {
      const results = await Promise.allSettled(uploadedFiles.map(async (file) => {
        const fd = new FormData(); fd.append("file", file); fd.append("folderId", (folderId ?? selectedFolderId) || "");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }
      }));
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        setToast({ type: "error", message: `${failed.length} file(s) failed to upload` });
        setTimeout(() => setToast(null), 4000);
      } else {
        setToast({ type: "success", message: `${uploadedFiles.length} file(s) uploaded` });
        setTimeout(() => setToast(null), 3000);
      }
      fileCache.current.clear();
      await loadFiles(selectedFolderId, debouncedSearch, false);
      setShowUpload(false);
    } catch { setToast({ type: "error", message: "Upload failed" }); setTimeout(() => setToast(null), 4000); }
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
        setToast({ type: "success", message: "File deleted" });
      }
    } catch { setToast({ type: "error", message: "Failed to delete file" }); }
    finally { setDeleting(false); setFileDeleteModal({ show: false }); setTimeout(() => setToast(null), 3000); }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/files/${fileId}/download`);
      if (res.ok) {
        const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = fileName;
        document.body.appendChild(a); a.click();
        window.URL.revokeObjectURL(url); document.body.removeChild(a);
      }
    } catch { /* ignore */ }
  };

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  const totalSize = user?.stats?.totalSize ?? 0;
  const totalFiles = user?.stats?.totalFiles ?? files.length;
  const totalFolders = user?.stats?.totalFolders ?? folders.length;
  const childFolders = selectedFolderId ? folders.filter(f => f.parent === selectedFolderId) : [];
  const currentFolderName = selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20 animate-pulse">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <div className="flex gap-1.5 justify-center">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-500/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen bg-[#0f172a] flex flex-col overflow-hidden">
      <Navbar user={user} onOpenUserProfile={() => setShowUserProfile(true)} />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`
          flex-shrink-0 bg-slate-900/40 border-r border-slate-800/50 flex flex-col relative
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "w-72" : "w-0 lg:w-16"}
          ${sidebarOpen ? "" : "overflow-hidden"}
          max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:h-full max-lg:z-40
          ${sidebarOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"}
        `}>
          {sidebarOpen ? (
            <div className="flex flex-col h-full min-w-72">
              <div className="p-4 border-b border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => setSidebarOpen(false)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-3 border-b border-slate-800/50">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => { setShowUpload(true); setSidebarOpen(false); }}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-300 hover:from-indigo-500/20 hover:to-purple-500/20 hover:border-indigo-500/30 transition-all text-sm font-medium min-h-[44px]">
                    <Upload className="w-4 h-4" /> Upload
                  </button>
                  <button onClick={() => { handleCreateFolder(selectedFolderId); setSidebarOpen(false); }}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50 transition-all text-sm font-medium min-h-[44px]">
                    <FolderPlus className="w-4 h-4" /> New
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Folders</h3>
                    <button onClick={() => refreshFolders()} disabled={foldersLoading} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-400 hover:bg-slate-800/50 transition-colors">
                      <RefreshCw className={`w-3.5 h-3.5 ${foldersLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                  {foldersLoading && folders.length === 0 ? (
                    <div className="space-y-2 px-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-10 rounded-lg bg-slate-800/30 animate-pulse" />
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
              <div className="p-3 border-t border-slate-800/50">
                <div className="flex flex-col gap-1">
                  <button onClick={() => { setShowUserProfile(true); setSidebarOpen(false); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all min-h-[44px]">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all min-h-[44px]">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center h-full py-4 gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-sm font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="w-8 border-t border-slate-700/50" />
              <button onClick={() => setShowUpload(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-indigo-300 hover:bg-slate-800/50 transition-all" title="Upload">
                <Upload className="w-4 h-4" />
              </button>
              <button onClick={() => handleCreateFolder(selectedFolderId)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all" title="New Folder">
                <FolderPlus className="w-4 h-4" />
              </button>
              <div className="flex-1" />
              <button onClick={() => setShowUserProfile(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all" title="Settings">
                <Settings className="w-4 h-4" />
              </button>
              <button onClick={handleLogout}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Sign Out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 rounded-r-xl bg-slate-800 border border-slate-700 border-l-0 flex items-center justify-center text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-all z-10 hidden lg:flex">
            {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex-shrink-0 border-b border-slate-800/50 bg-slate-900/30 backdrop-blur-xl">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden btn-ghost p-2 rounded-lg text-slate-400 hover:text-white">
                  <Sidebar className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <h1 className="text-xl font-bold text-white truncate">{currentFolderName || "All Files"}</h1>
                    {debouncedSearch && <span className="text-sm text-indigo-400 hidden sm:inline">&mdash; &ldquo;{debouncedSearch}&rdquo;</span>}
                  </div>
                  <p className="text-xs text-slate-400">
                    {selectedFolderId
                      ? `${files.length} file${files.length !== 1 ? "s" : ""}${childFolders.length > 0 ? ` · ${childFolders.length} sub-folder${childFolders.length !== 1 ? "s" : ""}` : ""}`
                      : `${totalFiles} file${totalFiles !== 1 ? "s" : ""} · ${totalFolders} folder${totalFolders !== 1 ? "s" : ""}`}
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
                  <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1">
                    {(["grid", "list"] as const).map((mode) => (
                      <button key={mode} onClick={() => setViewMode(mode)}
                        className={`p-2 rounded-lg transition-all ${viewMode === mode ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`} title={mode === "grid" ? "Grid view" : "List view"}>
                        {mode === "grid" ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <button onClick={refreshData} disabled={filesLoading || foldersLoading}
                    className="btn-secondary px-3 py-2 rounded-xl text-sm flex items-center gap-2 border-slate-700/50 hover:border-slate-600/50">
                    <RefreshCw className={`w-4 h-4 ${filesLoading || foldersLoading ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                  <button onClick={() => setShowUpload(true)}
                    className="btn-primary px-4 py-2 rounded-xl text-sm flex items-center gap-2">
                    <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Upload</span>
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
              <StatsCard icon={FileIcon} label="Files" value={totalFiles.toLocaleString()} gradient="bg-gradient-to-br from-blue-500 to-cyan-600" />
              <StatsCard icon={FolderIcon} label="Folders" value={totalFolders.toLocaleString()} gradient="bg-gradient-to-br from-purple-500 to-pink-600" />
              <StatsCard icon={HardDrive} label="Storage" value={formatSize(totalSize)} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
            </div>

            {error && (
              <div className="mx-6 mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 p-1"><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Sub-folders */}
            {childFolders.length > 0 && !debouncedSearch && (
              <div className="px-6 pt-5">
                <div className="flex items-center gap-2 mb-3">
                  <FolderIcon className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sub-folders</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {childFolders.map(child => (
                    <ContextMenu key={child.id}
                      items={[
                        { label: "Open", icon: <FolderIcon className="w-4 h-4" />, onClick: () => handleFolderSelect(child.id) },
                        { divider: true },
                        { label: "Create sub-folder", icon: <FolderPlus className="w-4 h-4" />, onClick: () => handleCreateFolder(child.id) },
                        { divider: true },
                        { label: "Rename", icon: <FileText className="w-4 h-4" />, onClick: () => { const name = prompt("Rename folder:", child.name); if (name && name.trim()) handleRenameFolder(child.id, name.trim()); } },
                        { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => handleDeleteFolder(child.id), danger: true },
                      ]}>
                      <div data-context-menu="true" onClick={() => handleFolderSelect(child.id)}
                        className="group relative flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-purple-500/30 hover:bg-slate-800/50 cursor-pointer transition-all">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center flex-shrink-0">
                          <FolderIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">{child.name}</p>
                          <p className="text-xs text-slate-400">{folders.filter(f => f.parent === child.id).length} sub-folders</p>
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
                  <div className="w-20 h-20 rounded-3xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-6">
                    <Cloud className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">
                    {debouncedSearch ? `No results for "${debouncedSearch}"` : selectedFolderId ? "This folder is empty" : "No files yet"}
                  </h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                    {debouncedSearch ? "Try a different search term or browse your folders." : selectedFolderId ? "Drag and drop files here or use the upload button to add files." : "Upload your first file to get started with FreeClouds."}
                  </p>
                  {!debouncedSearch && (
                    <div className="flex gap-3 justify-center">
                      <button onClick={() => setShowUpload(true)} className="btn-primary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Upload Files
                      </button>
                      <button onClick={() => handleCreateFolder(selectedFolderId)} className="btn-secondary px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">
                        <FolderPlus className="w-4 h-4" /> Create Folder
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {filesLoading && files.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Refreshing...
                    </div>
                  )}
                  <DynamicFileGrid files={files} loading={filesLoading}
                    onDownload={handleDownload} onDelete={handleDeleteFile}
                    viewMode={viewMode} onViewModeChange={setViewMode} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {spaceMenu && (
        <div className="fixed z-[100] min-w-[180px] py-1.5 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl shadow-black/30 backdrop-blur-xl"
          style={{ left: spaceMenu.x, top: spaceMenu.y }}
          onClick={() => setSpaceMenu(null)}>
          <button onClick={() => { setShowUpload(true); setSpaceMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors">
            <Upload className="w-4 h-4" /> Upload Files
          </button>
          <button onClick={() => { handleCreateFolder(selectedFolderId); setSpaceMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors">
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          <div className="my-1 border-t border-slate-700/50" />
          <button onClick={() => { refreshData(); setSpaceMenu(null); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      )}

      <Modal show={showUpload} onClose={() => setShowUpload(false)} title="Upload Files">
        <DynamicUploadDropzone onUpload={(files) => handleUpload(files, selectedFolderId)} folderId={selectedFolderId} />
      </Modal>
      <Modal show={showUserProfile} onClose={() => setShowUserProfile(false)} title="User Profile">
        <Suspense fallback={<div className="text-center py-4 text-slate-400">Loading...</div>}>
          <DynamicUserProfile isOpen={showUserProfile} onClose={() => setShowUserProfile(false)} user={user!} onUserUpdate={handleUserUpdate} />
        </Suspense>
      </Modal>

      <CreateFolderModal show={showCreateFolder} loading={creatingFolder} onClose={() => { setShowCreateFolder(false); setNewFolderName(""); }} onConfirm={confirmCreateFolder} />

      <ConfirmModal show={deleteModal.show} title="Delete Folder"
        message={`Permanently delete "${deleteModal.folder?.name}"?${deleteModal.subfolderCount && deleteModal.subfolderCount > 0 ? ` This also deletes ${deleteModal.subfolderCount} subfolder(s).` : ""}`}
        warning="This cannot be undone." onCancel={() => setDeleteModal({ show: false })} onConfirm={confirmDeleteFolder} />
      <ConfirmModal show={fileDeleteModal.show} title="Delete File" message={`Permanently delete "${fileDeleteModal.fileName}"?`}
        warning="This cannot be undone." loading={deleting} onCancel={() => setFileDeleteModal({ show: false })} onConfirm={confirmDeleteFile} />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
      <Footer />
    </div>
  );
}
