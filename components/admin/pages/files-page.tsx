"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Trash2,
  Eye,
  RefreshCw,
  Users,
  HardDrive,
  FolderOpen,
  RotateCcw,
  Trash,
  X,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Lang, getDict } from "../i18n";
import {
  formatDate,
  PageHeader,
  ErrorBanner,
  TableLoading,
  TableEmpty,
  Badge,
  SearchInput,
  Pagination,
  ConfirmDialog,
} from "../ui";

interface AdminFile {
  id: string;
  name: string;
  size: number;
  formattedSize: string;
  mime: string;
  extension: string;
  fileId: string;
  folder: string | null;
  folderName: string | null;
  folderPath: string;
  owner: string;
  ownerName: string;
  ownerEmail: string;
  deletedAt: string | null;
  createdAt: string;
  isDeleted: boolean;
}

interface FilesPagination {
  currentPage: number;
  totalPages: number;
  totalFiles: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FilesTotals {
  totalFiles: number;
  totalSize: number;
}

export default function AdminFilesPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const base = lang === "vi" ? "/vi/admin" : "/admin";

  const [files, setFiles] = useState<AdminFile[]>([]);
  const [pagination, setPagination] = useState<FilesPagination>({
    currentPage: 1,
    totalPages: 1,
    totalFiles: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [totals, setTotals] = useState<FilesTotals>({ totalFiles: 0, totalSize: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [deleteType, setDeleteType] = useState<"soft" | "permanent">("soft");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchFiles = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
        includeDeleted: includeDeleted.toString(),
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (userFilter) params.append("userId", userFilter);

      const response = await fetch(`/api/admin/files?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data = await response.json();
      setFiles(data.files);
      setPagination(data.pagination);
      if (data.totals) setTotals(data.totals);
      setError(null);
    } catch (error) {
      console.error("Error fetching files:", error);
      setError(t.files.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    userFilter,
    includeDeleted,
    sortBy,
    sortOrder,
    pagination.currentPage,
  ]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

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
      setSelectedFiles(files.map((file) => file.id));
    }
  };

  const handleDeleteFiles = async () => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileIds: selectedFiles,
          permanent: deleteType === "permanent",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete files");
      }

      await fetchFiles();
      setSelectedFiles([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting files:", error);
      setError(t.files.errorDelete);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestoreFiles = async () => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/files", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileIds: selectedFiles,
          action: "restore",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore files");
      }

      await fetchFiles();
      setSelectedFiles([]);
      setShowRestoreModal(false);
    } catch (error) {
      console.error("Error restoring files:", error);
      setError(t.files.errorRestore);
    } finally {
      setActionLoading(false);
    }
  };

  const getFileTypeIcon = (mime: string) => {
    if (mime.startsWith("image/")) return "🖼️";
    if (mime.startsWith("video/")) return "🎥";
    if (mime.startsWith("audio/")) return "🎵";
    if (mime.includes("pdf")) return "📄";
    if (mime.includes("document") || mime.includes("word")) return "📝";
    if (mime.includes("spreadsheet") || mime.includes("excel")) return "📊";
    if (mime.includes("presentation") || mime.includes("powerpoint")) return "📺";
    if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return "📦";
    return "📄";
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setUserFilter("");
    setIncludeDeleted(false);
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = searchTerm || userFilter || includeDeleted;
  const stats = [
    { title: t.files.totalFiles, value: totals.totalFiles.toLocaleString(), icon: <FileText className="h-6 w-6 text-gray-400" /> },
    { title: t.files.selectedFiles, value: selectedFiles.length.toLocaleString(), icon: <HardDrive className="h-6 w-6 text-accent" /> },
    { title: t.files.activeFiles, value: files.filter((f) => !f.isDeleted).length.toLocaleString(), icon: <Users className="h-6 w-6 text-green-400" /> },
    { title: t.files.deletedFiles, value: files.filter((f) => f.isDeleted).length.toLocaleString(), icon: <Trash2 className="h-6 w-6 text-error" /> },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.files.title}
        subtitle={<span className="mt-2 text-foreground">{t.files.subtitle}</span>}
        actions={
          <button
            onClick={() => fetchFiles()}
            className="inline-flex items-center px-4 py-2 border border-line-hover rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-card-hover/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.files.refresh}
          </button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-card overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">{stat.icon}</div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted truncate">
                      {stat.title}
                    </dt>
                    <dd className="text-lg font-medium text-foreground">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ErrorBanner message={error} />

      {/* Filters */}
      <div className="bg-card shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <SearchInput
              value={searchTerm}
              onChange={(v) => {
                setSearchTerm(v);
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
              placeholder={t.files.searchPlaceholder}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => {
                  setIncludeDeleted(e.target.checked);
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
                className="h-4 w-4 text-accent focus:ring-accent border-line-hover rounded"
              />
              <span className="ml-2 text-sm text-foreground">
                {t.files.includeDeleted}
              </span>
            </label>
          </div>

          <div className="flex justify-end">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-line-hover shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-card hover:bg-card-hover/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                <X className="h-4 w-4 mr-2" />
                {t.files.reset}
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t.files.searchChip} {searchTerm}
              </span>
            )}
            {userFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t.files.userChip} {userFilter}
              </span>
            )}
            {includeDeleted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {t.files.includingDeleted}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <div className="bg-accent/10 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-accent mr-2" />
              <span className="text-sm font-medium text-blue-800">
                {t.files.filesSelected.replace("{n}", selectedFiles.length.toString())}
              </span>
            </div>
            <div className="flex flex-wrap space-x-2">
              {includeDeleted && (
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t.files.restore}
                </button>
              )}
              <button
                onClick={() => {
                  setDeleteType("soft");
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.files.softDelete}
              </button>
              <button
                onClick={() => {
                  setDeleteType("permanent");
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash className="h-4 w-4 mr-2" />
                {t.files.permanentDelete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Table */}
      <div className="bg-card shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-card">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === files.length && files.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-accent focus:ring-accent border-line-hover rounded"
                    />
                  </th>
                  {[
                    { label: t.files.fileCol, field: "name" },
                    { label: t.files.sizeCol, field: "size" },
                    { label: t.files.ownerCol, field: "ownerName" },
                    { label: t.files.folderCol, field: null },
                    { label: t.files.createdCol, field: "createdAt" },
                    { label: t.files.statusCol, field: null },
                    { label: t.files.actionsCol, field: null },
                  ].map((h) =>
                    h.field ? (
                      <th
                        key={h.label}
                        className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer hover:bg-card-hover"
                        onClick={() => handleSort(h.field as string)}
                      >
                        {h.label}
                      </th>
                    ) : (
                      <th
                        key={h.label}
                        className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider"
                      >
                        {h.label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-slate-700/50">
                {loading ? (
                  <TableLoading colSpan={8} />
                ) : files.length === 0 ? (
                  <TableEmpty colSpan={8} message={t.files.noFiles} />
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className={file.isDeleted ? "bg-error/10" : "hover:bg-card-hover/30"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          className="h-4 w-4 text-accent focus:ring-accent border-line-hover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-3">{getFileTypeIcon(file.mime)}</div>
                          <div>
                            <div className="text-sm font-medium text-foreground">
                              {file.name}
                            </div>
                            <div className="text-sm text-muted">
                              {file.mime}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {file.formattedSize}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {file.ownerName}
                          </div>
                          <div className="text-sm text-muted">
                            {file.ownerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {file.folderName ? (
                          <div className="flex items-center">
                            <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                            {file.folderName}
                          </div>
                        ) : (
                          <span className="text-muted">{t.files.root}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatDate(file.createdAt, lang)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge tone={file.isDeleted ? "inactive" : "active"}>
                          {file.isDeleted ? t.files.deleted : t.files.active}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`${base}/users/${file.owner}`}
                            className="text-accent hover:text-accent"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              lang={lang}
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalFiles}
              pageSize={20}
              label={t.files.totalFiles.toLowerCase()}
              onPageChange={(page) => fetchFiles(page)}
            />
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmDialog
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteFiles}
        icon={<Trash2 className="h-6 w-6 text-error" />}
        title={deleteType === "permanent" ? t.files.permanentDeleteTitle : t.files.deleteTitle}
        message={
          <p className="text-sm text-muted">
            {(deleteType === "permanent"
              ? t.files.deleteConfirmPermanent
              : t.files.deleteConfirmSoft
            ).replace("{n}", selectedFiles.length.toString())}
          </p>
        }
        confirmLabel={actionLoading ? t.files.deleting : deleteType === "permanent" ? t.files.permanentDelete : t.files.deleteTitle}
        cancelLabel={t.files.cancel}
      />

      {/* Restore Modal */}
      <ConfirmDialog
        open={showRestoreModal}
        onCancel={() => setShowRestoreModal(false)}
        onConfirm={handleRestoreFiles}
        icon={<RotateCcw className="h-6 w-6 text-green-400" />}
        title={t.files.restoreTitle}
        message={
          <p className="text-sm text-muted">
            {t.files.restoreConfirm.replace("{n}", selectedFiles.length.toString())}
          </p>
        }
        confirmLabel={actionLoading ? t.files.restoring : t.files.restore}
        cancelLabel={t.files.cancel}
        danger={false}
      />
    </div>
  );
}
