"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Trash2,
  File,
  Image,
  Video,
  Music,
  Archive,
  FileText,
  MoreVertical,
  Search,
  Grid,
  List,
  Code,
  Database,
  Presentation,
  Sheet,
  BookOpen,
  Eye,
  Filter,
  Box,
  Ruler,
  Palette,
  Type,
  Settings,
  Lock,
  GitBranch,
  Link2,
  Folder,
  Star,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  History,
  ScanLine,
} from "lucide-react";
import {
  getFileTypeInfo,
  isImageFile,
  formatFileSize,
  formatDate,
  getFileColorClasses,
} from "@/lib/file-utils";
import dynamic from "next/dynamic";
const DynamicFilePreview = dynamic(() => import("./FilePreview"), {
  ssr: false,
});
import PreviewIndicator, { PreviewStatusBadge } from "./PreviewIndicator";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";
import ContextMenu, { type ContextMenuAction } from "./ContextMenu";
import { ListStagger, ListStaggerItem } from "./motion/Reveal";

interface FileData {
  id: string;
  name: string;
  displayName?: string;
  size: number;
  mime: string;
  folderId: string | null;
  folderName?: string | null;
  createdAt: string;
  originalExt?: string | null;
  favorite?: boolean;
}

interface FileGridProps {
  files: FileData[];
  loading?: boolean;
  onDownload: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onShare?: (file: FileData) => void;
  onMove?: (file: FileData) => void;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
  onToggleFavorite?: (file: FileData) => void;
  onOpenFolder?: (folderId: string | null) => void;
  onVersions?: (file: FileData) => void;
  onScan?: (files: FileData[]) => void;
}

interface FileItemProps {
  file: FileData;
  viewMode: "grid" | "list";
  onDownload: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onShare: ((file: FileData) => void) | undefined;
  onMove: ((file: FileData) => void) | undefined;
  onPreview: (file: FileData) => void;
  onToggleFavorite: ((file: FileData) => void) | undefined;
  onOpenFolder: ((folderId: string | null) => void) | undefined;
  onVersions: ((file: FileData) => void) | undefined;
  // New props for bulk selection support
  selected?: boolean;
  onToggleSelect?: (fileId: string) => void;
}

function getFileIcon(fileName: string, mimeType: string) {
  const fileInfo = getFileTypeInfo(fileName, mimeType);
  const { color } = getFileColorClasses(fileName, mimeType);

  const iconProps = `w-8 h-8 ${color}`;

  switch (fileInfo.icon) {
    case "Image":
      return <Image className={iconProps} />;
    case "Video":
      return <Video className={iconProps} />;
    case "Music":
      return <Music className={iconProps} />;
    case "FileText":
      return <FileText className={iconProps} />;
    case "Sheet":
      return <Sheet className={iconProps} />;
    case "Presentation":
      return <Presentation className={iconProps} />;
    case "Code":
      return <Code className={iconProps} />;
    case "Database":
      return <Database className={iconProps} />;
    case "BookOpen":
      return <BookOpen className={iconProps} />;
    case "Archive":
      return <Archive className={iconProps} />;
    case "Box":
      return <Box className={iconProps} />;
    case "Ruler":
      return <Ruler className={iconProps} />;
    case "Palette":
      return <Palette className={iconProps} />;
    case "Type":
      return <Type className={iconProps} />;
    case "Settings":
      return <Settings className={iconProps} />;
    case "Lock":
      return <Lock className={iconProps} />;
    case "GitBranch":
      return <GitBranch className={iconProps} />;
    default:
      return <File className={iconProps} />;
  }
}

function getFileTypeColorClasses(fileName: string, mimeType: string): string {
  const { bgColor, borderColor } = getFileColorClasses(fileName, mimeType);
  return `${borderColor} ${bgColor}`;
}

function FileItem({
  file,
  viewMode,
  onDownload,
  onDelete,
  onShare,
  onMove,
  onPreview,
  onToggleFavorite,
  onOpenFolder,
  selected = false,
  onToggleSelect,
  onVersions,
}: FileItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const { t } = useTranslation();

  const displayName = file.displayName || file.name;
  const isImage = isImageFile(displayName, file.mime);
  const fileInfo = getFileTypeInfo(displayName, file.mime);

  const handleDownload = () => {
    onDownload(file.id, displayName);
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    // Delegate confirmation to parent (in-app modal). Parent will show a nicer confirmation UI.
    onDelete(file.id);
    setIsMenuOpen(false);
  };

  const handleShare = () => {
    onShare?.(file);
    setIsMenuOpen(false);
  };

  const handleMove = () => {
    onMove?.(file);
    setIsMenuOpen(false);
  };

  const handleToggleFavorite = () => {
    onToggleFavorite?.(file);
    setIsMenuOpen(false);
  };

  const handleOpenFolder = () => {
    if (file.folderId) onOpenFolder?.(file.folderId);
    setIsMenuOpen(false);
  };

  const handleVersions = () => {
    onVersions?.(file);
    setIsMenuOpen(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handlePreview = () => {
    onPreview(file);
  };

  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(file.id);
    }
  };

  // Load image thumbnail automatically for images
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (isImage && !imageUrl && !imageLoading) {
      const loadImageThumbnail = async () => {
        setImageLoading(true);
        try {
          const response = await fetch(`/api/files/${file.id}/download`);
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setImageUrl(url);
          }
        } catch (error) {
          console.error("Failed to load image thumbnail:", error);
        } finally {
          setImageLoading(false);
        }
      };

      // Small delay to avoid loading all images at once
      timer = setTimeout(loadImageThumbnail, Math.random() * 1000);
    }

    // Always return a cleanup function so all code paths return a value
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [file.id, isImage, imageUrl, imageLoading]);

  // Cleanup blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const contextMenuItems: ContextMenuAction[] = [
    { label: "Preview", icon: <Eye className="w-4 h-4" />, onClick: handlePreview },
    { label: "Download", icon: <Download className="w-4 h-4" />, onClick: handleDownload },
    { label: "Share", icon: <Link2 className="w-4 h-4" />, onClick: handleShare },
    { label: "Move", icon: <Folder className="w-4 h-4" />, onClick: handleMove },
    { label: "Version History", icon: <History className="w-4 h-4" />, onClick: handleVersions },
    { divider: true },
    {
      label: file.favorite ? "Remove from Favorites" : "Add to Favorites",
      icon: <Star className={`w-4 h-4 ${file.favorite ? "text-warning" : ""}`} />,
      onClick: handleToggleFavorite,
    },
    ...(file.folderId && onOpenFolder
      ? [
          {
            label: "Open containing folder",
            icon: <FolderOpen className="w-4 h-4" />,
            onClick: handleOpenFolder,
          },
        ]
      : []),
    { divider: true },
    {
      label: "Copy Name", icon: <FileText className="w-4 h-4" />, onClick: () => {
        navigator.clipboard.writeText(displayName);
      }
    },
    { divider: true },
    { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: handleDelete, danger: true },
  ];

  if (viewMode === "grid") {
    return (
      <ContextMenu items={contextMenuItems}>
        <div data-context-menu="true"
          className={`group relative bg-white/5 border border-white/10 rounded-xl p-4 hover:border-accent/30 hover:bg-white/[0.07] transition-all cursor-pointer ${selected ? "ring-2 ring-blue-500/50 border-accent/30" : ""}`}
          onClick={handlePreview}
        >
          {/* Selection checkbox (top-left) */}
          <div className="absolute top-2.5 left-2.5 z-20">
            <input
              type="checkbox"
              checked={!!selected}
              onClick={handleCheckboxClick}
              onChange={() => {}}
              className="h-4 w-4 rounded border-line bg-accent text-white focus:ring-accent/50"
              aria-label={`Select ${file.displayName || file.name}`}
            />
          </div>

          {/* File Icon or Image Preview */}
          <div className="flex justify-center mb-3 relative">
            {isImage && imageUrl ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                <img src={imageUrl} alt={file.displayName || file.name} className="w-full h-full object-cover" />
              </div>
            ) : isImage ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 bg-card flex items-center justify-center">
                {imageLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-400 border-t-transparent" />
                ) : (
                  <Image className="w-8 h-8 text-accent" />
                )}
              </div>
            ) : (
              getFileIcon(displayName, file.mime)
            )}
          </div>

          {/* File Type Badge */}
          <div className="absolute top-2.5 left-8">
            <span className="text-[10px] px-2 py-0.5 bg-card backdrop-blur-sm rounded-full font-medium text-muted border border-line">
              {fileInfo.description}
            </span>
          </div>

          {/* File Name */}
          <h3 className="text-sm font-medium text-foreground truncate mb-1" title={file.displayName || file.name}>
            {file.displayName || file.name}
          </h3>

          {/* File Info */}
          <div className="text-xs text-muted space-y-0.5">
            <div className="flex items-center justify-between">
              <span>{formatFileSize(file.size)}</span>
            </div>
            <div>{formatDate(file.createdAt)}</div>
          </div>

          {/* More button */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            {onToggleFavorite && (
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
                className={`p-1.5 rounded-lg transition-all border border-line ${file.favorite ? "bg-amber-500/15 text-warning" : "bg-card backdrop-blur-sm text-muted hover:text-warning hover:bg-card-hover sm:opacity-0 sm:group-hover:opacity-100"}`}
                title={file.favorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Star className={`w-3.5 h-3.5 ${file.favorite ? "fill-amber-400" : ""}`} />
              </button>
            )}
            <button
              onClick={handleMenuToggle}
              className="sm:opacity-0 sm:group-hover:opacity-100 p-1.5 bg-card backdrop-blur-sm rounded-lg hover:bg-card-hover border border-line transition-all"
            >
              <MoreVertical className="w-3.5 h-3.5 text-muted" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-line rounded-xl shadow-xl z-10 py-1 backdrop-blur-xl">
                    {contextMenuItems.map((item, i) => (
                  item.divider ? (
                    <div key={i} className="my-1 border-t border-line" />
                  ) : (
                    <button key={i} onClick={(e) => { e.stopPropagation(); item.onClick?.(); setIsMenuOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${item.danger ? "text-error hover:bg-error/10" : "text-foreground hover:bg-card-hover"}`}>
                      {item.icon}{item.label}
                    </button>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </ContextMenu>
    );
  }

  // List view
  return (
    <ContextMenu items={contextMenuItems}>
      <div
        className={`group flex items-center gap-3 p-3 border-b border-line hover:bg-white/[0.03] transition-colors cursor-pointer ${selected ? "bg-blue-500/5" : ""}`}
        onClick={handlePreview}
      >
        {/* Selection checkbox */}
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            checked={!!selected}
            onClick={(e) => { e.stopPropagation(); handleCheckboxClick(e); }}
            onChange={() => {}}
            className="h-4 w-4 rounded border-line bg-accent text-white focus:ring-accent/50"
            aria-label={`Select ${file.displayName || file.name}`}
          />
        </div>

        {/* File Icon or Image Thumbnail */}
        <div className="flex-shrink-0 relative">
          {isImage && imageUrl ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
              <img src={imageUrl} alt={file.displayName || file.name} className="w-full h-full object-cover" />
            </div>
          ) : isImage ? (
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-card flex items-center justify-center">
              {imageLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-400 border-t-transparent" />
              ) : (
                <Image className="w-6 h-6 text-accent" />
              )}
            </div>
          ) : (
            getFileIcon(file.name, file.mime)
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-foreground truncate flex-1" title={file.displayName || file.name}>
              {file.displayName || file.name}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted mt-0.5">
            <span>{formatFileSize(file.size)}</span>
            <span>{formatDate(file.createdAt)}</span>
            {file.folderName && <span className="text-accent">in {file.folderName}</span>}
          </div>
        </div>

        {/* Hover action buttons */}
        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {onToggleFavorite && (
            <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(); }}
              className={`p-2 rounded-lg transition-all ${file.favorite ? "text-warning hover:bg-card-hover" : "text-muted hover:text-warning hover:bg-card-hover"}`}
              title={file.favorite ? "Remove from Favorites" : "Add to Favorites"}>
              <Star className={`w-4 h-4 ${file.favorite ? "fill-amber-400" : ""}`} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); handlePreview(); }}
            className="p-2 text-muted hover:text-accent hover:bg-card-hover rounded-lg transition-all">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDownload(file.id, file.name); }}
            className="p-2 text-muted hover:text-accent hover:bg-card-hover rounded-lg transition-all">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
            className="p-2 text-muted hover:text-error hover:bg-card-hover rounded-lg transition-all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </ContextMenu>
  );
}

export default function FileGrid({
  files,
  loading = false,
  onDownload,
  onDelete,
  onShare,
  onMove,
  onSearch,
  searchQuery = "",
  viewMode = "grid",
  onViewModeChange,
  onToggleFavorite,
  onOpenFolder,
  onVersions,
  onScan,
}: FileGridProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Bulk selection state
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  // Download / progress state for bulk archive creation
  const [downloading, setDownloading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [downloadTotalBytes, setDownloadTotalBytes] = useState<number | null>(
    null,
  );

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map((f) => f.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;

    const confirmed = window.confirm(`Delete ${selectedFiles.length} file(s)? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch("/api/files/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedFiles }),
      });

      if (res.ok) {
        setSelectedFiles([]);
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to delete files");
      }
    } catch {
      alert("Failed to delete files");
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFiles.length === 0) return;

    setDownloading(true);
    setProgressVisible(true);
    setProgressMessage("Preparing archive...");
    setDownloadProgress(null);
    setDownloadedBytes(0);
    setDownloadTotalBytes(null);

    // Compute estimated total using per-file sizes (metadata available in `files`)
    const selectedMeta = files.filter((f) => selectedFiles.includes(f.id));
    const estimatedTotal =
      selectedMeta.reduce((s, f) => s + (f.size || 0), 0) || 1;
    const overhead = selectedMeta.length * 1024 * 10; // ~10KB overhead per file for zip metadata
    const estimatedTotalWithOverhead = estimatedTotal + overhead;

    // Use estimated total as initial displayed total while server may not provide content-length
    setDownloadTotalBytes(estimatedTotalWithOverhead);

    try {
      const response = await fetch("/api/files/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedFiles }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Failed to create archive");
        setProgressVisible(false);
        setDownloading(false);
        return;
      }

      // Server accepted request; update message
      setProgressMessage("Server is compressing files...");

      const contentLengthHeader = response.headers.get("content-length");
      const serverTotal = contentLengthHeader
        ? parseInt(contentLengthHeader, 10)
        : null;

      // If server provides a content-length, prefer it as the authoritative total.
      // Otherwise we'll continue to use our estimated total.
      const effectiveTotal =
        serverTotal && !isNaN(serverTotal)
          ? serverTotal
          : estimatedTotalWithOverhead;

      if (serverTotal && !isNaN(serverTotal)) {
        setDownloadTotalBytes(serverTotal);
      } else {
        // keep the estimated total shown
        setDownloadTotalBytes(estimatedTotalWithOverhead);
      }

      // Stream the response body to show progress while downloading the zip
      if (!response.body) {
        // Fallback: read blob at once
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `files-${new Date().toISOString().split("T")[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setSelectedFiles([]);
        setProgressVisible(false);
        setDownloading(false);
        return;
      }

      setProgressMessage("Downloading archive...");

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          setDownloadedBytes(received);

          // Use effectiveTotal (serverTotal if available, otherwise estimatedTotalWithOverhead)
          if (effectiveTotal && effectiveTotal > 0) {
            const percent = Math.round((received / effectiveTotal) * 100);
            setDownloadProgress(Math.min(100, percent));
            if (serverTotal && !isNaN(serverTotal)) {
              setProgressMessage(`Downloading archive... ${percent}%`);
            } else {
              // indicate this is an estimate based on file sizes
              setProgressMessage(
                `Downloading archive... ${percent}% (estimated)`,
              );
            }
          } else {
            // Shouldn't happen because we set estimated total, but fallback anyway
            setDownloadProgress(null);
            setProgressMessage(
              `Downloading archive... (${(received / 1024 / 1024).toFixed(2)} MB received)`,
            );
          }
        }
      }

      // Combine chunks into a blob
      // Combine chunks into a single Uint8Array and create a Blob from its ArrayBuffer.
      // This avoids passing SharedArrayBuffer values directly into the Blob constructor
      // which can cause type incompatibilities in strict TypeScript configurations.
      const combinedArray = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        combinedArray.set(chunk, offset);
        offset += chunk.length;
      }
      const combined = new Blob([combinedArray.buffer], {
        type: response.headers.get("content-type") || "application/zip",
      });
      const url = URL.createObjectURL(combined);
      const a = document.createElement("a");
      a.href = url;
      a.download = `files-${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSelectedFiles([]);
      setProgressVisible(false);
    } catch (err) {
      console.error("Bulk download failed:", err);
      alert("Bulk download failed");
      setProgressVisible(false);
    } finally {
      setDownloading(false);
      // reset progress after a short delay so the UI doesn't flicker
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadedBytes(0);
        setDownloadTotalBytes(null);
      }, 400);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(localSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearchQuery, onSearch]);

  // Sync local query when the prop changes externally (dashboard SearchBar)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Filter files by type
  const filteredFiles = files.filter((file) => {
    if (selectedFilter === "all") return true;
    const fname = file.displayName || file.name;
    const fileInfo = getFileTypeInfo(fname, file.mime);
    return fileInfo.category === selectedFilter;
  });

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "name") {
      cmp = (a.displayName || a.name).localeCompare(b.displayName || b.name, undefined, { sensitivity: "base" });
    } else if (sortBy === "size") {
      cmp = a.size - b.size;
    } else {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return sortOrder === "asc" ? cmp : -cmp;
  });

  const sortOptions = [
    { value: "date", label: "Date" },
    { value: "name", label: "Name" },
    { value: "size", label: "Size" },
  ];

  // Get file type counts
  const fileTypeCounts = files.reduce(
    (acc, file) => {
      const fname = file.displayName || file.name;
      const fileInfo = getFileTypeInfo(fname, file.mime);
      acc[fileInfo.category] = (acc[fileInfo.category] || 0) + 1;
      acc.all = (acc.all || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const filterOptions = [
    { value: "all", label: "All Files", count: fileTypeCounts.all || 0 },
    { value: "image", label: "Images", count: fileTypeCounts.image || 0 },
    { value: "video", label: "Videos", count: fileTypeCounts.video || 0 },
    { value: "audio", label: "Audio", count: fileTypeCounts.audio || 0 },
    {
      value: "document",
      label: "Documents",
      count: fileTypeCounts.document || 0,
    },
    { value: "code", label: "Code", count: fileTypeCounts.code || 0 },
    { value: "3d", label: "3D & CAD", count: fileTypeCounts["3d"] || 0 },
    { value: "design", label: "Design", count: fileTypeCounts.design || 0 },
    { value: "font", label: "Fonts", count: fileTypeCounts.font || 0 },
    { value: "data", label: "Data", count: fileTypeCounts.data || 0 },
    { value: "archive", label: "Archives", count: fileTypeCounts.archive || 0 },
    { value: "system", label: "System", count: fileTypeCounts.system || 0 },
    { value: "other", label: "Other", count: fileTypeCounts.other || 0 },
  ].filter((option) => option.count > 0);

  const handleFilePreview = useCallback((file: FileData) => {
    setPreviewFile(file);
    setShowPreview(true);
  }, []);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewFile(null);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-card-hover rounded mb-4"></div>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                : "space-y-1"
            }
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className={
                  viewMode === "grid"
                    ? "h-32 bg-card-hover rounded-lg"
                    : "h-16 bg-card-hover rounded"
                }
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-line">
        <div className="flex items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search files..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-card/70 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-foreground placeholder-slate-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <div className="flex items-center border border-line bg-card/70 rounded-lg">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-l-lg hover:bg-card-hover transition-colors text-foreground"
              >
                <ArrowUpDown className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {sortOptions.find((opt) => opt.value === sortBy)?.label || "Date"}
                </span>
              </button>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-2 rounded-r-lg border-l border-line text-muted hover:text-accent transition-colors"
                title={sortOrder === "asc" ? "Ascending" : "Descending"}
              >
                {sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-line rounded-lg shadow-xl z-10 py-1 backdrop-blur-xl">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-card-hover first:rounded-t-lg last:rounded-b-lg ${
                      sortBy === option.value
                        ? "bg-blue-500/15 text-accent"
                        : "text-foreground"
                    }`}
                  >
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 px-3 py-2 border border-line bg-card/70 rounded-lg hover:bg-card-hover transition-colors text-foreground"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {filterOptions.find((opt) => opt.value === selectedFilter)
                  ?.label || "All Files"}
              </span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-line rounded-lg shadow-xl z-10 py-1 backdrop-blur-xl">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedFilter(option.value);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-card-hover first:rounded-t-lg last:rounded-b-lg ${
                      selectedFilter === option.value
                        ? "bg-blue-500/15 text-accent"
                        : "text-foreground"
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="text-xs text-muted bg-card-hover px-2 py-0.5 rounded-full">
                      {option.count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle + Bulk Download */}
          {onViewModeChange && (
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-card rounded-lg p-1">
                <button
                  onClick={() => onViewModeChange("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-500/20 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onViewModeChange("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-500/20 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const selected = files.filter(
                      (f) =>
                        selectedFiles.includes(f.id) &&
                        isImageFile(f.name, f.mime),
                    );
                    if (selected.length > 0 && onScan) onScan(selected);
                  }}
                  disabled={selectedFiles.length === 0}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    selectedFiles.length > 0 && onScan
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "bg-card text-muted cursor-not-allowed border border-line"
                  }`}
                  title="Scan selected images"
                >
                  <ScanLine className="w-4 h-4" />
                  Scan
                </button>
                <button
                  onClick={handleBulkDownload}
                  disabled={selectedFiles.length === 0}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    selectedFiles.length > 0
                      ? "bg-accent text-white hover:bg-accent-hover"
                      : "bg-card text-muted cursor-not-allowed border border-line"
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Download selected ({selectedFiles.length})
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedFiles.length === 0}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                    selectedFiles.length > 0
                      ? "bg-error text-white hover:bg-error/90"
                      : "bg-card text-muted cursor-not-allowed border border-line"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <button
                  onClick={handleSelectAll}
                  className="px-2 py-1 rounded text-sm bg-card text-foreground hover:bg-card-hover border border-line"
                  title="Select all"
                >
                  {selectedFiles.length === files.length && files.length > 0
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {sortedFiles.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <File className="w-12 h-12 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No files found
              </h3>
              <p className="text-muted">
                {localSearchQuery
                  ? `No files match "${localSearchQuery}"`
                  : selectedFilter !== "all"
                    ? `No ${filterOptions.find((opt) => opt.value === selectedFilter)?.label.toLowerCase()} found`
                    : "Upload some files to get started"}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {viewMode === "grid" ? (
              <ListStagger className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedFiles.map((file) => (
                  <ListStaggerItem key={file.id}>
                    <FileItem
                      file={file}
                      viewMode={viewMode}
                      onDownload={onDownload}
                      onDelete={onDelete}
                      onShare={onShare}
                      onMove={onMove}
                      onPreview={handleFilePreview}
                      onToggleFavorite={onToggleFavorite}
                      onOpenFolder={onOpenFolder}
                      onVersions={onVersions}
                      selected={selectedFiles.includes(file.id)}
                      onToggleSelect={handleSelectFile}
                    />
                  </ListStaggerItem>
                ))}
              </ListStagger>
            ) : (
              <ListStagger className="bg-white/5 border border-line rounded-lg overflow-hidden">
                {sortedFiles.map((file) => (
                  <ListStaggerItem key={file.id}>
                    <FileItem
                      file={file}
                      viewMode={viewMode}
                      onDownload={onDownload}
                      onDelete={onDelete}
                      onShare={onShare}
                      onMove={onMove}
                      onPreview={handleFilePreview}
                      onToggleFavorite={onToggleFavorite}
                      onOpenFolder={onOpenFolder}
                      onVersions={onVersions}
                      selected={selectedFiles.includes(file.id)}
                      onToggleSelect={handleSelectFile}
                    />
                  </ListStaggerItem>
                ))}
              </ListStagger>
            )}
          </div>
        )}
      </div>

      {/* File Preview Modal (dynamically loaded to avoid serializable-props warnings) */}
      <DynamicFilePreview
        key={previewFile?.id || "no-file"}
        file={previewFile}
        isOpen={showPreview}
        onClose={closePreview}
        onDownload={onDownload}
      />

      {/* Bulk download progress modal */}
      {progressVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="modal-content rounded-2xl w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="flex-0">
                <svg
                  className="animate-spin h-6 w-6 text-blue-500"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  ></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-foreground mb-1">
                  Preparing download
                </h3>
                <p className="text-sm text-muted mb-3">{progressMessage}</p>

                <div className="w-full bg-card-hover rounded h-3 overflow-hidden">
                  {downloadProgress !== null ? (
                    <div
                      className="h-3 bg-accent transition-all"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  ) : (
                    <div
                      className="h-3 bg-accent animate-pulse"
                      style={{ width: "40%" }}
                    />
                  )}
                </div>

                {downloadTotalBytes ? (
                  <div className="text-xs text-muted mt-2">
                    {(downloadedBytes / 1024 / 1024).toFixed(2)} MB /{" "}
                    {(downloadTotalBytes / 1024 / 1024).toFixed(2)} MB
                  </div>
                ) : (
                  <div className="text-xs text-muted mt-2">
                    {(downloadedBytes / 1024 / 1024).toFixed(2)} MB received
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  // allow user to close the modal while download continues in background,
                  // but keep the downloading state (they can re-open by re-initiating)
                  setProgressVisible(false);
                }}
                className="px-4 py-2 bg-card rounded-xl hover:bg-card-hover text-sm text-foreground border border-line"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
