"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  FolderOpen,
  HardDrive,
  TrendingUp,
  Activity,
  Calendar,
  Download,
  Upload,
  Eye,
  MoreVertical,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface SystemStats {
  users: {
    total: number;
    active: number;
    admins: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    storage: {
      totalStorage: number;
      averageStorage: number;
      maxStorage: number;
    };
  };
  files: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    size: {
      totalSize: number;
      averageSize: number;
      maxSize: number;
    };
    typeDistribution: Array<{
      _id: string;
      count: number;
      totalSize: number;
    }>;
  };
  folders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
  };
  growth: {
    users: Array<{
      _id: { year: number; month: number; day: number };
      count: number;
    }>;
    files: Array<{
      _id: { year: number; month: number; day: number };
      count: number;
      totalSize: number;
    }>;
  };
  topUsers: Array<{
    _id: string;
    name: string;
    email: string;
    totalStorageUsed: number;
    totalFilesUploaded: number;
    createdAt: string;
    lastLoginAt?: string;
  }>;
  recentActivity: {
    users: Array<{
      _id: string;
      name: string;
      email: string;
      createdAt: string;
      role: string;
    }>;
    files: Array<{
      _id: string;
      name: string;
      type: string;
      size: number;
      createdAt: string;
      userId: {
        name: string;
        email: string;
      };
    }>;
  };
  system: {
    timestamp: string;
    totalStorage: number;
    totalEntities: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log("Admin dashboard: Starting to fetch stats...");
      const response = await fetch("/api/admin/stats");
      console.log("Admin dashboard: Stats response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("Admin dashboard: Stats data received:", data);
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error("Admin dashboard: Stats API error:", errorText);
        setError("Không thể tải thống kê hệ thống: " + response.status);
      }
    } catch (error) {
      console.error("Admin dashboard: Error fetching stats:", error);
      setError("Lỗi kết nối khi tải dữ liệu: " + error);
    } finally {
      console.log("Admin dashboard: Setting loading to false");
      setLoading(false);
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

  const getGrowthPercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không có dữ liệu thống kê</p>
      </div>
    );
  }

  const quickStats = [
    {
      title: "Tổng người dùng",
      value: stats.users.total,
      change: getGrowthPercentage(
        stats.users.thisMonth,
        stats.users.total - stats.users.thisMonth,
      ),
      icon: Users,
      color: "bg-blue-500",
      href: "/vi/admin/users",
    },
    {
      title: "Tổng file",
      value: stats.files.total,
      change: getGrowthPercentage(
        stats.files.thisMonth,
        stats.files.total - stats.files.thisMonth,
      ),
      icon: FileText,
      color: "bg-green-500",
      href: "/vi/admin/files",
    },
    {
      title: "Tổng thư mục",
      value: stats.folders.total,
      change: getGrowthPercentage(
        stats.folders.thisMonth,
        stats.folders.total - stats.folders.thisMonth,
      ),
      icon: FolderOpen,
      color: "bg-purple-500",
      href: "/vi/admin/folders",
    },
    {
      title: "Dung lượng đã sử dụng",
      value: formatFileSize(stats.files.size.totalSize),
      change: 0,
      icon: HardDrive,
      color: "bg-orange-500",
      href: "/vi/admin/analytics",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Tổng quan hệ thống
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              Cập nhật lần cuối: {formatDate(stats.system.timestamp)}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={fetchStats}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <Activity className="mr-2 h-4 w-4" />
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-8 h-8 ${stat.color} rounded-md flex items-center justify-center`}
                    >
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {typeof stat.value === "string"
                            ? stat.value
                            : stat.value.toLocaleString()}
                        </div>
                        {stat.change !== 0 && (
                          <div
                            className={`ml-2 flex items-baseline text-sm font-semibold ${
                              stat.change > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {stat.change > 0 ? "+" : ""}
                            {stat.change.toFixed(1)}%
                          </div>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's Activity and Storage Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Hoạt động hôm nay
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-gray-600">Người dùng mới</span>
              </div>
              <span className="text-lg font-semibold">{stats.users.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">File mới</span>
              </div>
              <span className="text-lg font-semibold">{stats.files.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FolderOpen className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-sm text-gray-600">Thư mục mới</span>
              </div>
              <span className="text-lg font-semibold">
                {stats.folders.today}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <HardDrive className="h-5 w-5 text-orange-500 mr-2" />
            Tổng quan dung lượng
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">Tổng dung lượng</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatFileSize(stats.system.totalStorage)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Dung lượng trung bình/user
              </div>
              <div className="text-lg font-semibold text-blue-600">
                {formatFileSize(stats.users.storage.averageStorage)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                User sử dụng nhiều nhất
              </div>
              <div className="text-lg font-semibold text-red-600">
                {formatFileSize(stats.users.storage.maxStorage)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Kích thước file trung bình
              </div>
              <div className="text-lg font-semibold text-green-600">
                {formatFileSize(stats.files.size.averageSize)}
              </div>
            </div>
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Phân bố loại file
          </h3>
          <div className="space-y-3">
            {stats.files.typeDistribution.slice(0, 5).map((type, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      [
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-yellow-500",
                        "bg-red-500",
                        "bg-purple-500",
                      ][index % 5]
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600 capitalize">
                    {type._id || "Khác"}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{type.count}</div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(type.totalSize)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Trạng thái hệ thống
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">Database</span>
              </div>
              <span className="text-sm text-green-600 font-medium">
                Hoạt động tốt
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">API Services</span>
              </div>
              <span className="text-sm text-green-600 font-medium">
                Hoạt động tốt
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">File Storage</span>
              </div>
              <span className="text-sm text-green-600 font-medium">
                Hoạt động tốt
              </span>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-md space-y-2">
              <div className="text-sm text-gray-600">
                <strong>Tổng thực thể:</strong>{" "}
                {stats.system.totalEntities.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Tổng dung lượng:</strong>{" "}
                {formatFileSize(stats.system.totalStorage)}
              </div>
              <div className="text-sm text-gray-600">
                <strong>File lớn nhất:</strong>{" "}
                {formatFileSize(stats.files.size.maxSize)}
              </div>
              <div className="text-sm text-gray-600">
                <strong>User dùng nhiều nhất:</strong>{" "}
                {formatFileSize(stats.users.storage.maxStorage)}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Loại file phổ biến:</strong>{" "}
                {stats.files.typeDistribution[0]?._id || "Không có"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Usage by Users */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <HardDrive className="h-5 w-5 text-orange-500 mr-2" />
            Sử dụng dung lượng theo người dùng
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats.topUsers.slice(0, 10).map((user, index) => {
              const percentage =
                stats.system.totalStorage > 0
                  ? Math.round(
                      (user.totalStorageUsed / stats.system.totalStorage) * 100,
                    )
                  : 0;
              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {user.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatFileSize(user.totalStorageUsed)} ({percentage}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            index === 0
                              ? "bg-red-500"
                              : index === 1
                                ? "bg-orange-500"
                                : index === 2
                                  ? "bg-yellow-500"
                                  : "bg-blue-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {user.totalFilesUploaded} files • {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.topUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Chưa có dữ liệu người dùng
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Người dùng mới nhất
            </h3>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {stats.recentActivity.users.slice(0, 5).map((user) => (
                <li key={user._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            user.role === "admin" ? "bg-red-100" : "bg-blue-100"
                          }`}
                        >
                          <Users
                            className={`w-4 h-4 ${
                              user.role === "admin"
                                ? "text-red-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {formatDate(user.createdAt)}
                      </div>
                      <div
                        className={`text-xs ${
                          user.role === "admin"
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 py-3 border-t border-gray-200">
              <Link
                href="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Xem tất cả người dùng →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Files */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              File upload mới nhất
            </h3>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {stats.recentActivity.files.slice(0, 5).map((file) => (
                <li key={file._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-48">
                          {file.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          bởi {file.userId.name} • {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-900">
                        {formatDate(file.createdAt)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {file.type}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 py-3 border-t border-gray-200">
              <Link
                href="/vi/admin/files"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Xem tất cả file →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users by Storage */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Top người dùng theo dung lượng
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người dùng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dung lượng sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số file
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tham gia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đăng nhập cuối
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.topUsers.slice(0, 10).map((user, index) => (
                <tr
                  key={user._id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatFileSize(user.totalStorageUsed || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(user.totalFilesUploaded || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLoginAt
                      ? formatDate(user.lastLoginAt)
                      : "Chưa đăng nhập"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
