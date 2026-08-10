"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Trash2,
  FileText,
  CheckCircle,
  RotateCcw,
  Layers,
} from "lucide-react";
import { Lang, getDict } from "../i18n";
import {
  formatFileSize,
  formatDate,
  PageHeader,
  ErrorBanner,
  TableLoading,
  TableEmpty,
  Pagination,
  ConfirmDialog,
} from "../ui";

interface TrashFile {
  id: string;
  name: string;
  displayName: string | null;
  size: number;
  mime: string;
  chunked: boolean;
  totalChunks: number;
  deletedAt: string;
  trashExpiresAt: string | null;
  owner: {
    id: string | null;
    name: string;
    email: string | null;
  };
}

export default function AdminTrashPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);

  const [files, setFiles] = useState<TrashFile[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTrash = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/trash?page=${page}&limit=20`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch trash");
      }

      const data = await response.json();
      setFiles(data.files);
      setPagination({
        currentPage: data.page || 1,
        totalPages: data.totalPages || 1,
        total: data.total || 0,
      });
      setError(null);
    } catch {
      setError(t.trash.errorLoad);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTrash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage]);

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

  const handleAction = async (action: "restore" | "delete") => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/admin/trash", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileIds: selectedFiles,
          action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t.trash.errorAction);
      }

      setSelectedFiles([]);
      setShowRestoreModal(false);
      setShowDeleteModal(false);
      await fetchTrash();
    } catch {
      setError(t.trash.errorAction);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = [
    {
      title: t.trash.totalFiles,
      value: pagination.total.toLocaleString(),
      icon: <Trash2 className="h-6 w-6 text-error" />,
    },
    {
      title: t.trash.selectedFiles,
      value: selectedFiles.length.toLocaleString(),
      icon: <CheckCircle className="h-6 w-6 text-accent" />,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.trash.title}
        subtitle={
          <span className="mt-2 text-foreground">{t.trash.subtitle}</span>
        }
        actions={
          <button
            onClick={() => fetchTrash()}
            className="inline-flex items-center px-4 py-2 border border-line-hover rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-card-hover/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t.trash.refresh}
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

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <div className="bg-accent/10 border border-accent/25 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-accent mr-2" />
              <span className="text-sm font-medium text-accent">
                {t.trash.filesSelected.replace(
                  "{n}",
                  selectedFiles.length.toString(),
                )}
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowRestoreModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-200 bg-green-600/20 hover:bg-green-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t.trash.restore}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-error bg-error/20 hover:bg-error/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t.trash.permanentDelete}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.trash.fileCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.trash.sizeCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.trash.typeCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.trash.ownerCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.trash.deletedCol}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    {t.trash.expiresCol}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-slate-700/50">
                {loading ? (
                  <TableLoading colSpan={7} />
                ) : files.length === 0 ? (
                  <TableEmpty colSpan={7} message={t.trash.noFiles} />
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className="hover:bg-card-hover/30">
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
                          <FileText className="h-5 w-5 text-error mr-3 shrink-0" />
                          <div className="text-sm font-medium text-foreground truncate max-w-56">
                            {file.name}
                          </div>
                          {file.chunked && (
                            <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                              <Layers className="h-3 w-3 mr-0.5" />
                              {t.trash.chunked}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {file.mime || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">
                          {file.owner.name}
                        </div>
                        {file.owner.email && (
                          <div className="text-xs text-muted">
                            {file.owner.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                        {formatDate(file.deletedAt, lang)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                        {file.trashExpiresAt
                          ? formatDate(file.trashExpiresAt, lang)
                          : t.trash.never}
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
              totalItems={pagination.total}
              pageSize={20}
              label={t.trash.totalFiles.toLowerCase()}
              onPageChange={(page) => fetchTrash(page)}
            />
          )}
        </div>
      </div>

      {/* Restore Modal */}
      <ConfirmDialog
        open={showRestoreModal}
        onCancel={() => setShowRestoreModal(false)}
        onConfirm={() => handleAction("restore")}
        icon={<RotateCcw className="h-6 w-6 text-green-400" />}
        title={t.trash.restoreTitle}
        message={
          <p className="text-sm text-muted">
            {t.trash.restoreConfirm.replace(
              "{n}",
              selectedFiles.length.toString(),
            )}
          </p>
        }
        confirmLabel={
          actionLoading ? t.trash.restoring : t.trash.restore
        }
        cancelLabel={t.trash.cancel}
      />

      {/* Permanent Delete Modal */}
      <ConfirmDialog
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={() => handleAction("delete")}
        icon={<Trash2 className="h-6 w-6 text-error" />}
        title={t.trash.deleteTitle}
        message={
          <p className="text-sm text-muted">
            {t.trash.deleteConfirm.replace(
              "{n}",
              selectedFiles.length.toString(),
            )}
          </p>
        }
        confirmLabel={
          actionLoading ? t.trash.deleting : t.trash.permanentDelete
        }
        cancelLabel={t.trash.cancel}
      />
    </div>
  );
}
