"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Trash2,
  Eye,
  MoreVertical,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  HardDrive,
  FolderOpen,
  AlertTriangle,
  RotateCcw,
  Trash,
  X,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface File {
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

interface FilesResponse {
  files: File[];
  pagination: FilesPagination;
}

export default function AdminFilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pagination, setPagination] = useState<FilesPagination>({
    currentPage: 1,
    totalPages: 1,
    totalFiles: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
    fetchFiles();
  }, [
    searchTerm,
    userFilter,
    includeDeleted,
    sortBy,
    sortOrder,
    pagination.currentPage,
  ]);

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

      if (searchTerm) params.append("search", searchTerm);
      if (userFilter) params.append("userId", userFilter);

      const response = await fetch(`/api/admin/files?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      const data: FilesResponse = await response.json();
      setFiles(data.files);
      setPagination(data.pagination);
      setError(null);
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Không thể tải danh sách file");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchFiles(1);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(files.map(file => file.id));
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
      setError("Không thể xóa file");
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
      setError("Không thể khôi phục file");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    setUserFilter("");
    setIncludeDeleted(false);
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const hasActiveFilters = searchTerm || userFilter || includeDeleted;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Quản lý File</h1>
          <p className="mt-2 text-slate-300">
            Quản lý tất cả file trong hệ thống
          </p>
        </div>
        <button
          onClick={() => fetchFiles()}
          className="inline-flex items-center px-4 py-2 border border-slate-600/50 rounded-md shadow-sm shadow-black/10 text-sm font-medium text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-400 truncate">
                    Tổng File
                  </dt>
                  <dd className="text-lg font-medium text-white">
                    {pagination.totalFiles.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HardDrive className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-400 truncate">
                    File Đã Chọn
                  </dt>
                  <dd className="text-lg font-medium text-white">
                    {selectedFiles.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-400 truncate">
                    File Hoạt Động
                  </dt>
                  <dd className="text-lg font-medium text-white">
                    {files.filter(f => !f.isDeleted).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-400 truncate">
                    File Đã Xóa
                  </dt>
                  <dd className="text-lg font-medium text-white">
                    {files.filter(f => f.isDeleted).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-md bg-red-500/10 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-500/10 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800/50 shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <form onSubmit={handleSearch} className="flex space-x-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-600/50 rounded-md leading-5 bg-slate-800/80 placeholder-slate-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tìm kiếm file..."
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tìm kiếm
              </button>
            </form>
          </div>

          {/* Include Deleted Toggle */}
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => setIncludeDeleted(e.target.checked)}
                className="h-4 w-4 text-indigo-400 focus:ring-blue-500 border-slate-600/50 rounded"
              />
              <span className="ml-2 text-sm text-slate-200">Bao gồm file đã xóa</span>
            </label>
          </div>

          {/* Reset Filters */}
          <div className="flex justify-end">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center px-3 py-2 border border-slate-600/50 shadow-sm shadow-black/10 text-sm leading-4 font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <X className="h-4 w-4 mr-2" />
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Tìm kiếm: {searchTerm}
              </span>
            )}
            {userFilter && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Người dùng: {userFilter}
              </span>
            )}
            {includeDeleted && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Bao gồm file đã xóa
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedFiles.length > 0 && (
        <div className="bg-blue-500/10 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-indigo-400 mr-2" />
              <span className="text-sm font-medium text-blue-800">
                {selectedFiles.length} file đã được chọn
              </span>
            </div>
            <div className="flex space-x-2">
              {includeDeleted && (
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Khôi phục
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
                Xóa tạm thời
              </button>
              <button
                onClick={() => {
                  setDeleteType("permanent");
                  setShowDeleteModal(true);
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash className="h-4 w-4 mr-2" />
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Table */}
      <div className="bg-slate-800/50 shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === files.length && files.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-indigo-400 focus:ring-blue-500 border-slate-600/50 rounded"
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("name")}
                  >
                    File
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("size")}
                  >
                    Kích thước
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("ownerName")}
                  >
                    Chủ sở hữu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Thư mục
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort("createdAt")}
                  >
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-slate-400">
                      Không tìm thấy file nào
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr key={file.id} className={file.isDeleted ? "bg-red-500/10" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          className="h-4 w-4 text-indigo-400 focus:ring-blue-500 border-slate-600/50 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-lg mr-3">{getFileTypeIcon(file.mime)}</div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {file.name}
                            </div>
                            <div className="text-sm text-slate-400">
                              {file.mime}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {file.formattedSize}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {file.ownerName}
                          </div>
                          <div className="text-sm text-slate-400">
                            {file.ownerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {file.folderName ? (
                          <div className="flex items-center">
                            <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                            {file.folderName}
                          </div>
                        ) : (
                          <span className="text-slate-400">Gốc</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {formatDate(file.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {file.isDeleted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Đã xóa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/vi/admin/users/${file.owner}`}
                            className="text-indigo-400 hover:text-blue-900"
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between border-t border-slate-700/50 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => fetchFiles(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-4 py-2 border border-slate-600/50 text-sm font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <button
                  onClick={() => fetchFiles(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600/50 text-sm font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tiếp
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-200">
                    Hiển thị trang{" "}
                    <span className="font-medium">{pagination.currentPage}</span>{" "}
                    trong{" "}
                    <span className="font-medium">{pagination.totalPages}</span>{" "}
                    ({pagination.totalFiles} tổng file)
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm shadow-black/10 -space-x-px">
                    <button
                      onClick={() => fetchFiles(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600/50 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => fetchFiles(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600/50 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg shadow-black/20 rounded-md bg-slate-800/50">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white mt-2">
                {deleteType === "permanent" ? "Xóa vĩnh viễn" : "Xóa"} File
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-slate-400">
                  Bạn có chắc chắn muốn {deleteType === "permanent" ? "xóa vĩnh viễn " : "xóa "}
                  {selectedFiles.length} file?
                  {deleteType === "permanent"
                    ? " Hành động này không thể hoàn tác."
                    : " Bạn có thể khôi phục chúng sau."
                  }
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDeleteFiles}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm shadow-black/10 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Đang xóa..." :
                   deleteType === "permanent" ? "Xóa vĩnh viễn" : "Xóa"}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                  className="mt-3 px-4 py-2 bg-gray-300 text-slate-100 text-base font-medium rounded-md w-full shadow-sm shadow-black/10 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg shadow-black/20 rounded-md bg-slate-800/50">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <RotateCcw className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-white mt-2">
                Khôi phục File
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-slate-400">
                  Bạn có chắc chắn muốn khôi phục {selectedFiles.length} file?
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleRestoreFiles}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm shadow-black/10 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Đang khôi phục..." : "Khôi phục"}
                </button>
                <button
                  onClick={() => setShowRestoreModal(false)}
                  disabled={actionLoading}
                  className="mt-3 px-4 py-2 bg-gray-300 text-slate-100 text-base font-medium rounded-md w-full shadow-sm shadow-black/10 hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
