"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  HardDrive,
  FileText,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  totalFilesUploaded: number;
  totalStorageUsed: number;
  totalFolders: number;
  createdAt: string;
  lastLoginAt?: string;
}

interface UsersPagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsersResponse {
  users: User[];
  pagination: UsersPagination;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<UsersPagination>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createErrors, setCreateErrors] = useState<{ [key: string]: string }>(
    {},
  );

  useEffect(() => {
    fetchUsers();
  }, [
    searchTerm,
    roleFilter,
    statusFilter,
    sortBy,
    sortOrder,
    pagination.currentPage,
  ]);

  const fetchUsers = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data: UsersResponse = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Không thể tải danh sách người dùng");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Lỗi kết nối khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setShowDeleteModal(false);
        setUserToDelete(null);
        // Refresh the list to update pagination
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Không thể xóa người dùng");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Lỗi kết nối khi xóa người dùng");
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
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        export: "true",
      });

      const response = await fetch(`/api/admin/users/export?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting users:", error);
    }
  };

  const handleCreateFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific errors
    if (createErrors[name]) {
      setCreateErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors: { [key: string]: string } = {};

    if (!createForm.name.trim()) {
      errors.name = "Tên không được để trống";
    }

    if (!createForm.email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!createForm.password) {
      errors.password = "Mật khẩu không được để trống";
    } else if (createForm.password.length < 8) {
      errors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setCreateLoading(true);
    setCreateErrors({});

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        const result = await response.json();
        setShowCreateModal(false);
        setCreateForm({ name: "", email: "", password: "", role: "user" });
        fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setCreateErrors({ email: "Email này đã được sử dụng" });
        } else {
          setCreateErrors({
            general: errorData.error || "Không thể tạo người dùng",
          });
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setCreateErrors({ general: "Lỗi kết nối khi tạo người dùng" });
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
            Quản lý người dùng
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-slate-400">
              <Users className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              Tổng cộng {pagination.totalUsers} người dùng
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:ml-4 md:mt-0">
          <button
            onClick={exportUsers}
            className="inline-flex items-center rounded-md bg-slate-800/50 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 ring-1 ring-inset ring-gray-300 hover:bg-slate-800/30"
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </button>
          <button
            onClick={() => fetchUsers()}
            className="inline-flex items-center rounded-md bg-slate-800/50 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 ring-1 ring-inset ring-gray-300 hover:bg-slate-800/30"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 hover:bg-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserX className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-slate-800/50 shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm theo tên hoặc email..."
                value={searchTerm}
                onChange={handleSearch}
                className="block w-full pl-10 pr-3 py-2 border border-slate-600/50 rounded-md leading-5 bg-slate-800/80 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={handleRoleFilter}
              className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">🔍 Tất cả vai trò</option>
              <option value="user">👤 Người dùng thường</option>
              <option value="admin">👨‍💼 Quản trị viên</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={handleStatusFilter}
              className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">🔍 Tất cả trạng thái</option>
              <option value="active">✅ Đang hoạt động</option>
              <option value="inactive">❌ Đã vô hiệu hóa</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field || "createdAt");
                setSortOrder(order || "desc");
              }}
              className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="totalStorageUsed-desc">Dung lượng cao nhất</option>
              <option value="totalFilesUploaded-desc">Nhiều file nhất</option>
              <option value="totalFolders-desc">Nhiều thư mục nhất</option>
            </select>
          </div>

          {/* Reset Filters Button and Results Counter */}
          <div className="lg:col-span-4 flex items-center justify-between">
            <div className="text-sm text-slate-300">
              📊 Hiển thị {users.length} / {pagination.totalUsers} người dùng
              {(searchTerm ||
                roleFilter !== "all" ||
                statusFilter !== "all") && (
                <span className="ml-2 text-indigo-400">(đã lọc)</span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("all");
                setStatusFilter("all");
                setSortBy("createdAt");
                setSortOrder("desc");
                setPagination((prev) => ({ ...prev, currentPage: 1 }));
              }}
              className="inline-flex items-center px-3 py-2 border border-slate-600/50 shadow-sm shadow-black/10 text-sm leading-4 font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={
                !searchTerm &&
                roleFilter === "all" &&
                statusFilter === "all" &&
                sortBy === "createdAt" &&
                sortOrder === "desc"
              }
            >
              <Filter className="mr-2 h-4 w-4" />
              🔄 Đặt lại bộ lọc
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
          <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-800/30">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-slate-200">
                Bộ lọc đang áp dụng:
              </span>
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  🔍 Tìm kiếm: "{searchTerm}"
                </span>
              )}
              {roleFilter !== "all" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {roleFilter === "admin"
                    ? "👨‍💼 Quản trị viên"
                    : "👤 Người dùng thường"}
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {statusFilter === "active"
                    ? "✅ Đang hoạt động"
                    : "❌ Đã vô hiệu hóa"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.length === users.length && users.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-indigo-400 focus:ring-blue-500 border-slate-600/50 rounded"
                  />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("name")}
                >
                  Người dùng
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("role")}
                >
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("totalStorageUsed")}
                >
                  Dung lượng
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("totalFilesUploaded")}
                >
                  Files
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("totalFolders")}
                >
                  Thư mục
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("createdAt")}
                >
                  Tham gia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Đăng nhập cuối
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Hành động</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="h-4 w-4 text-indigo-400 focus:ring-blue-500 border-slate-600/50 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              user.role === "admin"
                                ? "bg-red-100"
                                : "bg-blue-100"
                            }`}
                          >
                            {user.role === "admin" ? (
                              <Shield className="h-5 w-5 text-red-400" />
                            ) : (
                              <Users className="h-5 w-5 text-indigo-400" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-slate-800/50 text-slate-100"
                        }`}
                      >
                        {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {formatFileSize(user.totalStorageUsed || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(user.totalFilesUploaded || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {(user.totalFolders || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {user.lastLoginAt
                        ? formatDate(user.lastLoginAt)
                        : "Chưa đăng nhập"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-indigo-400 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/users/${user.id}/edit`}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-400 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-slate-800/50 px-4 py-3 flex items-center justify-between border-t border-slate-700/50 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => fetchUsers(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="relative inline-flex items-center px-4 py-2 border border-slate-600/50 text-sm font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => fetchUsers(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-600/50 text-sm font-medium rounded-md text-slate-200 bg-slate-800/50 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-200">
                Hiển thị{" "}
                <span className="font-medium">
                  {(pagination.currentPage - 1) * 20 + 1}
                </span>{" "}
                đến{" "}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * 20, pagination.totalUsers)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-medium">{pagination.totalUsers}</span>{" "}
                người dùng
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm shadow-black/10 -space-x-px">
                <button
                  onClick={() => fetchUsers(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-600/50 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Page numbers */}
                {Array.from(
                  { length: Math.min(5, pagination.totalPages) },
                  (_, i) => {
                    const pageNum = Math.max(1, pagination.currentPage - 2) + i;
                    if (pageNum > pagination.totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchUsers(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pageNum === pagination.currentPage
                            ? "z-10 bg-blue-500/10 border-blue-500 text-indigo-400"
                            : "bg-slate-800/50 border-slate-600/50 text-slate-400 hover:bg-slate-800/30"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  },
                )}

                <button
                  onClick={() => fetchUsers(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-600/50 bg-slate-800/50 text-sm font-medium text-slate-400 hover:bg-slate-800/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-md shadow-lg shadow-black/20 rounded-md bg-slate-800/50">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                <Plus className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-medium text-white mt-4 mb-6">
                Thêm người dùng mới
              </h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="createName"
                  className="block text-sm font-medium text-slate-200 mb-1"
                >
                  Họ và tên *
                </label>
                <input
                  id="createName"
                  name="name"
                  type="text"
                  required
                  value={createForm.name}
                  onChange={handleCreateFormChange}
className={`block w-full px-3 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                     createErrors.name ? "border-red-300" : "border-slate-600/50"
                  }`}
                  placeholder="Nhập họ và tên"
                />
                {createErrors.name && (
                  <p className="mt-1 text-sm text-red-400">
                    {createErrors.name}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="createEmail"
                  className="block text-sm font-medium text-slate-200 mb-1"
                >
                  Địa chỉ email *
                </label>
                <input
                  id="createEmail"
                  name="email"
                  type="email"
                  required
                  value={createForm.email}
                  onChange={handleCreateFormChange}
className={`block w-full px-3 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                     createErrors.email ? "border-red-300" : "border-slate-600/50"
                  }`}
                  placeholder="Nhập địa chỉ email"
                />
                {createErrors.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {createErrors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="createPassword"
                  className="block text-sm font-medium text-slate-200 mb-1"
                >
                  Mật khẩu *
                </label>
                <input
                  id="createPassword"
                  name="password"
                  type="password"
                  required
                  value={createForm.password}
                  onChange={handleCreateFormChange}
className={`block w-full px-3 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                     createErrors.password ? "border-red-300" : "border-slate-600/50"
                  }`}
                  placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
                />
                {createErrors.password && (
                  <p className="mt-1 text-sm text-red-400">
                    {createErrors.password}
                  </p>
                )}
              </div>

              {/* Role Field */}
              <div>
                <label
                  htmlFor="createRole"
                  className="block text-sm font-medium text-slate-200 mb-1"
                >
                  Vai trò *
                </label>
                <select
                  id="createRole"
                  name="role"
                  value={createForm.role}
                  onChange={handleCreateFormChange}
                  className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="user">Người dùng</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>

              {/* Error Message */}
              {createErrors.general && (
                <div className="bg-red-500/10 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{createErrors.general}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? "Đang tạo..." : "Tạo người dùng"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({
                      name: "",
                      email: "",
                      password: "",
                      role: "user",
                    });
                    setCreateErrors({});
                  }}
                  disabled={createLoading}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg shadow-black/20 rounded-md bg-slate-800/50">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-lg font-medium text-white mt-5">
                Xóa người dùng
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-slate-400">
                  Bạn có chắc chắn muốn xóa người dùng{" "}
                  <strong>{userToDelete.name}</strong>? Tất cả dữ liệu của người
                  dùng này sẽ bị xóa vĩnh viễn.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDeleteUser(userToDelete)}
                    className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md shadow-sm shadow-black/10 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Xóa
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setUserToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm shadow-black/10 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
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
