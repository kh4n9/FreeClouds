"use client";

import { useEffect, useState } from "react";
import {
  FolderOpen,
  Trash2,
  Eye,
  RefreshCw,
  FileText,
  X,
  CheckCircle,
  Folder,
} from "lucide-react";
import Link from "next/link";
import { Lang, getDict } from "../i18n";
import {
  formatDate,
  PageHeader,
  ErrorBanner,
  TableLoading,
  TableEmpty,
  SearchInput,
  Pagination,
  ConfirmDialog,
} from "../ui";

interface FolderData {
  id: string;
  name: string;
  parent: string | null;
  parentName: string | null;
  isRootFolder: boolean;
  owner: string;
  ownerName: string;
  ownerEmail: string;
  fileCount: number;
  subfolderCount: number;
  totalItems: number;
  createdAt: string;
}

interface FoldersPagination {
  currentPage: number;
  totalPages: number;
  totalFolders: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface FoldersTotals {
  totalFolders: number;
  totalFiles: number;
  totalItems: number;
}

export default function AdminFoldersPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const base = lang === "vi" ? "/vi/admin" : "/admin";

  const [folders, setFolders] = useState<FolderData[]>([]);
  const [pagination, setPagination] = useState<FoldersPagination>({
    currentPage: 1,
    totalPages: 1,
    totalFolders: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [totals, setTotals] = useState<FoldersTotals>({
    totalFolders: 0,
    totalFiles: 0,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRecursive, setDeleteRecursive] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchFolders = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sortBy,
        sortOrder,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (userFilter) params.append("userId", userFilter);

      const response = await fetch(`/api/admin/folders?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch folders");
      }

      const data = await response.json();
      setFolders(data.folders);
      setPagination(data.pagination);
      if (data.totals) setTotals(data.totals);
      setError(null);
    } catch (error) {
      console.error("Error fetching folders:", error);
      setError(t.folders.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    userFilter,
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

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId],
    );
  };

  const handleSelectAll = () => {
    if (selectedFolders.length === folders.length) {
      setSelectedFolders([]);
    } else {
      setSelectedFolders(folders.map((folder) => folder.id));
    }
  };

  const handleDeleteFolders = async () => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/folders", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderIds: selectedFolders,
          recursive: deleteRecursive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete folders");
      }

      const result = await response.json();

      if (result.errors && result.errors.length > 0) {
        setError(`${t.folders.errorDelete}: ${result.errors.join(", ")}`);
      }

      await fetchFolders();
      setSelectedFolders([]);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting folders:", error);
      setError(t.folders.errorDelete);
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setUserFilter("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = searchTerm || userFilter;
  const stats = [
    {
      title: t.folders.totalFolders,
      value: totals.totalFolders.toLocaleString(),
      icon: <FolderOpen className="h-6 w-6 text-gray-400" />,
    },
    {
      title: t.folders.selectedFolders,
      value: selectedFolders.length.toLocaleString(),
      icon: <CheckCircle className="h-6 w-6 text-accent" />,
    },
    {
      title: t.folders.totalFiles,
      value: totals.totalFiles.toLocaleString(),
      icon: <FileText className="h-6 w-6 text-green-400" />,
    },
    {
      title: t.folders.totalSubfolders,
      value: folders
        .reduce((sum, f) => sum + f.subfolderCount, 0)
        .toLocaleString(),
      icon: <Folder className="h-6 w-6 text-accent" />,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.folders.title}
        subtitle={<span className="mt-2 text-foreground">{t.folders.subtitle}</span>}
        actions={
          <button
            onClick={() => fetchFolders()}
            className="inline-flex items-center px-4 py-2 border border-line-hover rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-card-hover/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.folders.refresh}
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
              placeholder={t.folders.searchPlaceholder}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-line-hover shadow-sm text-sm leading-4 font-medium rounded-md text-foreground bg-card hover:bg-card-hover/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
              >
                <X className="h-4 w-4 mr-2" />
                {t.folders.reset}
              </button>
            )}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {t.folders.searchChip} {searchTerm}
              </span>
            )}
            {userFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {t.folders.userChip} {userFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedFolders.length > 0 && (
        <div className="bg-accent/10 border border-blue-200 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-accent mr-2" />
              <span className="text-sm font-medium text-blue-800">
                {t.folders.foldersSelected.replace("{n}", selectedFolders.length.toString())}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.folders.deleteFolders}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folders Table */}
      <div className="bg-card shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-card">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFolders.length === folders.length && folders.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-accent focus:ring-accent border-line-hover rounded"
                    />
                  </th>
                  {[
                    { label: t.folders.folderNameCol, field: "name" },
                    { label: t.folders.locationCol, field: null },
                    { label: t.folders.ownerCol, field: "ownerName" },
                    { label: t.folders.contentsCol, field: null },
                    { label: t.folders.createdCol, field: "createdAt" },
                    { label: t.folders.actionsCol, field: null },
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
                  <TableLoading colSpan={7} />
                ) : folders.length === 0 ? (
                  <TableEmpty colSpan={7} message={t.folders.noFolders} />
                ) : (
                  folders.map((folder) => (
                    <tr key={folder.id} className="hover:bg-card-hover/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFolders.includes(folder.id)}
                          onChange={() => handleSelectFolder(folder.id)}
                          className="h-4 w-4 text-accent focus:ring-accent border-line-hover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FolderOpen className="h-5 w-5 text-blue-500 mr-3" />
                          <div className="text-sm font-medium text-foreground">
                            {folder.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <div className="flex items-center">
                          {folder.isRootFolder || !folder.parentName ? (
                            <span className="text-muted italic">
                              {t.folders.root}
                            </span>
                          ) : (
                            <span className="text-foreground">
                              {folder.parentName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {folder.ownerName}
                          </div>
                          <div className="text-sm text-muted">
                            {folder.ownerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-green-500 mr-1" />
                            <span>
                              {t.folders.filesLabel.replace("{n}", folder.fileCount.toString())}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Folder className="h-4 w-4 text-accent mr-1" />
                            <span>
                              {t.folders.foldersLabel.replace("{n}", folder.subfolderCount.toString())}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatDate(folder.createdAt, lang)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`${base}/users/${folder.owner}`}
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
              totalItems={pagination.totalFolders}
              pageSize={20}
              label={t.folders.totalFolders.toLowerCase()}
              onPageChange={(page) => fetchFolders(page)}
            />
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <ConfirmDialog
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteFolders}
        icon={<Trash2 className="h-6 w-6 text-error" />}
        title={t.folders.deleteTitle}
        message={
          <div className="text-sm text-muted">
            <p>
              {t.folders.deleteConfirm.replace("{n}", selectedFolders.length.toString())}
            </p>
            <label className="flex items-center mt-4">
              <input
                type="checkbox"
                checked={deleteRecursive}
                onChange={(e) => setDeleteRecursive(e.target.checked)}
                className="h-4 w-4 text-error focus:ring-red-500 border-line-hover rounded"
              />
              <span className="ml-2 text-sm text-foreground">
                {t.folders.deleteRecursive}
              </span>
            </label>
          </div>
        }
        confirmLabel={actionLoading ? t.folders.deleting : t.folders.deleteTitle}
        cancelLabel={t.folders.cancel}
      />
    </div>
  );
}
