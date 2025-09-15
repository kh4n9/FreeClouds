"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  HardDrive,
  FileText,
  FolderOpen,
  Activity,
  Edit,
  Trash2,
  ArrowLeft,
  MoreVertical,
  Download,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  totalFilesUploaded: number;
  totalStorageUsed: number;
  createdAt: string;
  lastLoginAt?: string;
  updatedAt: string;
  stats: {
    totalFiles: number;
    totalSize: number;
    totalFolders: number;
    typeDistribution: { [key: string]: { count: number; size: number } };
  };
  recentFiles: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    createdAt: string;
  }>;
}

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } else if (response.status === 404) {
        setError("Không tìm thấy người dùng");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Không thể tải thông tin người dùng");
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
      setError("Lỗi kết nối khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      if (response.ok) {
        setUser((prev) =>
          prev ? { ...prev, isActive: !prev.isActive } : null,
        );
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Không thể cập nhật trạng thái người dùng");
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      setError("Lỗi kết nối khi cập nhật trạng thái");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRole = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      const newRole = user.role === "admin" ? "user" : "admin";

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: newRole,
        }),
      });

      if (response.ok) {
        setUser((prev) => (prev ? { ...prev, role: newRole } : null));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Không thể cập nhật vai trò người dùng");
      }
    } catch (error) {
      console.error("Error toggling user role:", error);
      setError("Lỗi kết nối khi cập nhật vai trò");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/users");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Không thể xóa người dùng");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Lỗi kết nối khi xóa người dùng");
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Hôm nay";
    if (diffInDays === 1) return "Hôm qua";
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} tuần trước`;
    return `${Math.floor(diffInDays / 30)} tháng trước`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Link
            href="/admin/users"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại danh sách
          </Link>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy thông tin người dùng</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users"
            className="flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại danh sách
          </Link>
          <div className="text-gray-300">|</div>
          <h1 className="text-2xl font-bold text-gray-900">
            Chi tiết người dùng
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/users/${userId}/edit`}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className={`h-20 w-20 rounded-full flex items-center justify-center ${
                  user.role === "admin" ? "bg-red-100" : "bg-blue-100"
                }`}
              >
                {user.role === "admin" ? (
                  <Shield className="h-10 w-10 text-red-600" />
                ) : (
                  <User className="h-10 w-10 text-blue-600" />
                )}
              </div>
            </div>
            <div className="ml-6 flex-1">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h2>
                <span
                  className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                </span>
                <span
                  className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                </span>
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Mail className="mr-1 h-4 w-4" />
                {user.email}
              </div>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <Calendar className="mr-1 h-4 w-4" />
                Tham gia {formatDate(user.createdAt)}
              </div>
              {user.lastLoginAt && (
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock className="mr-1 h-4 w-4" />
                  Đăng nhập cuối: {getRelativeTime(user.lastLoginAt)}
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${
                  user.isActive
                    ? "border-red-300 text-red-700 bg-white hover:bg-red-50"
                    : "border-green-300 text-green-700 bg-white hover:bg-green-50"
                } disabled:opacity-50`}
              >
                {user.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Vô hiệu hóa
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Kích hoạt
                  </>
                )}
              </button>
              <button
                onClick={handleToggleRole}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
              >
                <Shield className="mr-2 h-4 w-4" />
                {user.role === "admin" ? "Hủy admin" : "Làm admin"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng file
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user.stats.totalFiles.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng thư mục
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user.stats.totalFolders.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HardDrive className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Dung lượng sử dụng
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatFileSize(user.totalStorageUsed || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Kích thước trung bình
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {user.stats.totalFiles > 0
                      ? formatFileSize(
                          user.stats.totalSize / user.stats.totalFiles,
                        )
                      : "0 B"}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* File Type Distribution */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Phân bố loại file
            </h3>
          </div>
          <div className="p-6">
            {Object.keys(user.stats.typeDistribution).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(user.stats.typeDistribution)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .slice(0, 10)
                  .map(([type, data], index) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-3 ${
                            [
                              "bg-blue-500",
                              "bg-green-500",
                              "bg-yellow-500",
                              "bg-red-500",
                              "bg-purple-500",
                              "bg-pink-500",
                              "bg-indigo-500",
                              "bg-gray-500",
                              "bg-orange-500",
                              "bg-teal-500",
                            ][index % 10]
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {type || "Không xác định"}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {data.count} file
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(data.size)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Chưa có file nào</p>
            )}
          </div>
        </div>

        {/* Recent Files */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">File gần đây</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {user.recentFiles.length > 0 ? (
              user.recentFiles.map((file) => (
                <div key={file.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                          {file.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatFileSize(file.size)} •{" "}
                          {getRelativeTime(file.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {file.type}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">Chưa có file nào</p>
              </div>
            )}
          </div>
          {user.recentFiles.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <Link
                href={`/vi/admin/files?user=${userId}`}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Xem tất cả file của người dùng →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-5">
                Xóa người dùng
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Bạn có chắc chắn muốn xóa người dùng{" "}
                  <strong>{user.name}</strong>? Tất cả dữ liệu của người dùng
                  này bao gồm {user.stats.totalFiles} file và{" "}
                  {user.stats.totalFolders} thư mục sẽ bị xóa vĩnh viễn.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteUser}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                  >
                    {actionLoading ? "Đang xóa..." : "Xóa"}
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
