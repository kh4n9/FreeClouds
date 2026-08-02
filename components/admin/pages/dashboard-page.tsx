"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Users,
  FileText,
  FolderOpen,
  HardDrive,
  TrendingUp,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { Lang, getDict } from "../i18n";
import { formatFileSize, formatDate, LoadingSpinner } from "../ui";

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

export default function AdminDashboardPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const base = lang === "vi" ? "/vi/admin" : "/admin";

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setError(null);
      } else {
        setError(`${t.dashboard.noStatsData} (${response.status})`);
      }
    } catch (error) {
      console.error("Admin dashboard fetch error:", error);
      setError(t.common.connectionError);
    } finally {
      setLoading(false);
    }
  }, [t.common.connectionError, t.dashboard.noStatsData]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const getGrowthPercentage = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  if (loading) return <LoadingSpinner label={t.common.loading} />;

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-200 rounded-lg p-4">
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
        <p className="text-slate-400">{t.dashboard.noStatsData}</p>
      </div>
    );
  }

  const quickStats = [
    {
      title: t.dashboard.totalUsers,
      value: stats.users.total,
      change: getGrowthPercentage(
        stats.users.thisMonth,
        stats.users.total - stats.users.thisMonth,
      ),
      icon: Users,
      color: "bg-blue-500",
      href: `${base}/users`,
    },
    {
      title: t.dashboard.totalFiles,
      value: stats.files.total,
      change: getGrowthPercentage(
        stats.files.thisMonth,
        stats.files.total - stats.files.thisMonth,
      ),
      icon: FileText,
      color: "bg-green-500",
      href: `${base}/files`,
    },
    {
      title: t.dashboard.totalFolders,
      value: stats.folders.total,
      change: getGrowthPercentage(
        stats.folders.thisMonth,
        stats.folders.total - stats.folders.thisMonth,
      ),
      icon: FolderOpen,
      color: "bg-purple-500",
      href: `${base}/folders`,
    },
    {
      title: t.dashboard.storageUsed,
      value: formatFileSize(stats.files.size.totalSize),
      change: 0,
      icon: HardDrive,
      color: "bg-orange-500",
      href: `${base}/analytics`,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
            {t.dashboard.title}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-slate-400">
              <Calendar className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              {t.dashboard.lastUpdate} {formatDate(stats.system.timestamp, lang)}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={fetchStats}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 hover:bg-blue-500"
          >
            <Activity className="mr-2 h-4 w-4" />
            {t.dashboard.refreshData}
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <div className="bg-slate-800/50 overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
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
                      <dt className="text-sm font-medium text-slate-400 truncate">
                        {stat.title}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-white">
                          {typeof stat.value === "string"
                            ? stat.value
                            : stat.value.toLocaleString()}
                        </div>
                        {stat.change !== 0 && (
                          <div
                            className={`ml-2 flex items-baseline text-sm font-semibold ${
                              stat.change > 0 ? "text-green-400" : "text-red-400"
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
        <div className="bg-slate-800/50 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            {t.dashboard.todayActivity}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm text-slate-300">
                  {t.dashboard.newUsers}
                </span>
              </div>
              <span className="text-lg font-semibold">{stats.users.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm text-slate-300">
                  {t.dashboard.newFiles}
                </span>
              </div>
              <span className="text-lg font-semibold">{stats.files.today}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FolderOpen className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-sm text-slate-300">
                  {t.dashboard.newFolders}
                </span>
              </div>
              <span className="text-lg font-semibold">
                {stats.folders.today}
              </span>
            </div>
          </div>
        </div>

        {/* Storage Overview */}
        <div className="bg-slate-800/50 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <HardDrive className="h-5 w-5 text-orange-500 mr-2" />
            {t.dashboard.storageOverview}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">
                {t.dashboard.totalStorage}
              </div>
              <div className="text-lg font-semibold text-white">
                {formatFileSize(stats.system.totalStorage)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">
                {t.dashboard.avgPerUser}
              </div>
              <div className="text-lg font-semibold text-indigo-400">
                {formatFileSize(stats.users.storage.averageStorage)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">
                {t.dashboard.maxUserUsage}
              </div>
              <div className="text-lg font-semibold text-red-400">
                {formatFileSize(stats.users.storage.maxStorage)}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-300">
                {t.dashboard.avgFileSize}
              </div>
              <div className="text-lg font-semibold text-green-400">
                {formatFileSize(stats.files.size.averageSize)}
              </div>
            </div>
          </div>
        </div>

        {/* File Type Distribution */}
        <div className="bg-slate-800/50 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            {t.dashboard.fileTypeDistribution}
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
                  <span className="text-sm text-slate-300 capitalize">
                    {type._id || t.dashboard.other}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{type.count}</div>
                  <div className="text-xs text-slate-400">
                    {formatFileSize(type.totalSize)}
                  </div>
                </div>
              </div>
            ))}
            {stats.files.typeDistribution.length === 0 && (
              <div className="text-center py-4 text-sm text-slate-400">
                {t.dashboard.noStatsData}
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-slate-800/50 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            {t.dashboard.systemHealth}
          </h3>
          <div className="space-y-4">
            {[t.dashboard.database, t.dashboard.apiServices, t.dashboard.fileStorage].map(
              (service) => (
                <div key={service} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span className="text-sm text-slate-300">{service}</span>
                  </div>
                  <span className="text-sm text-green-400 font-medium">
                    {t.dashboard.operational}
                  </span>
                </div>
              ),
            )}
            <div className="mt-4 p-3 bg-slate-800/30 rounded-md space-y-2">
              <div className="text-sm text-slate-300">
                <strong>{t.dashboard.totalEntities}</strong>{" "}
                {stats.system.totalEntities.toLocaleString()}
              </div>
              <div className="text-sm text-slate-300">
                <strong>{t.dashboard.totalStorage}</strong>{" "}
                {formatFileSize(stats.system.totalStorage)}
              </div>
              <div className="text-sm text-slate-300">
                <strong>{t.dashboard.largestFile}</strong>{" "}
                {formatFileSize(stats.files.size.maxSize)}
              </div>
              <div className="text-sm text-slate-300">
                <strong>{t.dashboard.mostActiveUser}</strong>{" "}
                {formatFileSize(stats.users.storage.maxStorage)}
              </div>
              <div className="text-sm text-slate-300">
                <strong>{t.dashboard.topFileType}</strong>{" "}
                {stats.files.typeDistribution[0]?._id || t.dashboard.none}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Usage by Users */}
      <div className="bg-slate-800/50 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-medium text-white flex items-center">
            <HardDrive className="h-5 w-5 text-orange-500 mr-2" />
            {t.dashboard.storageByUser}
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
                <div key={user._id} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-400">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {user.name}
                        </span>
                        <span className="text-sm text-slate-400">
                          {formatFileSize(user.totalStorageUsed)} ({percentage}
                          %)
                        </span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-2">
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
                      <div className="text-xs text-slate-400 mt-1">
                        {user.totalFilesUploaded} {t.dashboard.filesLabel} •{" "}
                        {user.email}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.topUsers.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                {t.dashboard.noUserData}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <div className="bg-slate-800/50 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-lg font-medium text-white">
              {t.dashboard.recentUsers}
            </h3>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-slate-700/50">
              {stats.recentActivity.users.slice(0, 5).map((user) => (
                <li key={user._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            user.role === "admin"
                              ? "bg-red-100"
                              : "bg-blue-500/20"
                          }`}
                        >
                          <Users
                            className={`w-4 h-4 ${
                              user.role === "admin"
                                ? "text-red-400"
                                : "text-indigo-400"
                            }`}
                          />
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
                    <div className="text-right">
                      <div className="text-sm text-white">
                        {formatDate(user.createdAt, lang)}
                      </div>
                      <div
                        className={`text-xs ${
                          user.role === "admin"
                            ? "text-red-400"
                            : "text-indigo-400"
                        }`}
                      >
                        {user.role === "admin"
                          ? t.common.administrator
                          : t.common.user}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 py-3 border-t border-slate-700/50">
              <Link
                href={`${base}/users`}
                className="text-sm text-indigo-400 hover:text-blue-500 font-medium"
              >
                {t.dashboard.viewAllUsers}
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Files */}
        <div className="bg-slate-800/50 shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h3 className="text-lg font-medium text-white">
              {t.dashboard.recentFiles}
            </h3>
          </div>
          <div className="overflow-hidden">
            <ul className="divide-y divide-slate-700/50">
              {stats.recentActivity.files.slice(0, 5).map((file) => (
                <li key={file._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                          <FileText className="w-4 h-4 text-green-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white truncate max-w-48">
                          {file.name}
                        </div>
                        <div className="text-sm text-slate-400">
                          {t.dashboard.byUser} {file.userId.name} •{" "}
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">
                        {formatDate(file.createdAt, lang)}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {file.type}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 py-3 border-t border-slate-700/50">
              <Link
                href={`${base}/files`}
                className="text-sm text-indigo-400 hover:text-blue-500 font-medium"
              >
                {t.dashboard.viewAllFiles}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users by Storage */}
      <div className="bg-slate-800/50 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-slate-700/50">
          <h3 className="text-lg font-medium text-white">
            {t.dashboard.topUsersByStorage}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-800/50">
              <tr>
                {[
                  t.dashboard.userCol,
                  t.dashboard.storageCol,
                  t.dashboard.filesCol,
                  t.dashboard.joinedCol,
                  t.dashboard.lastLoginCol,
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
              {stats.topUsers.slice(0, 10).map((user, index) => (
                <tr
                  key={user._id}
                  className={
                    index % 2 === 0 ? "bg-slate-800/50" : "bg-slate-800/30"
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-400">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {formatFileSize(user.totalStorageUsed || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {(user.totalFilesUploaded || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {formatDate(user.createdAt, lang)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {user.lastLoginAt
                      ? formatDate(user.lastLoginAt, lang)
                      : t.common.never}
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
