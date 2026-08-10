"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Clock,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { Lang, getDict } from "../i18n";
import {
  formatFileSize,
  formatDate,
  ConfirmDialog,
} from "../ui";

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

export default function AdminUserDetailPage({
  lang,
  userId,
}: {
  lang: Lang;
  userId: string;
}) {
  const t = getDict(lang);
  const base = lang === "vi" ? "/vi/admin" : "/admin";
  const router = useRouter();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setError(null);
      } else if (response.status === 404) {
        setError(t.userDetail.notFound);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.userDetail.errorLoad);
      }
    } catch {
      setError(t.common.connectionError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
        setError(errorData.error || t.userDetail.errorStatus);
      }
    } catch {
      setError(t.common.connectionError);
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
        setError(errorData.error || t.userDetail.errorRole);
      }
    } catch {
      setError(t.common.connectionError);
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
        router.push(`${base}/users`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.userDetail.errorDelete);
      }
    } catch {
      setError(t.common.connectionError);
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return t.userDetail.today;
    if (diffInDays === 1) return t.userDetail.yesterday;
    if (diffInDays < 7)
      return t.userDetail.daysAgo.replace("{n}", diffInDays.toString());
    if (diffInDays < 30)
      return t.userDetail.weeksAgo.replace(
        "{n}",
        Math.floor(diffInDays / 7).toString(),
      );
    return t.userDetail.monthsAgo.replace(
      "{n}",
      Math.floor(diffInDays / 30).toString(),
    );
  };

  const colorClasses = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-sky-500",
    "bg-gray-500",
    "bg-orange-500",
    "bg-teal-500",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center">
          <Link
            href={`${base}/users`}
            className="flex items-center text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t.userDetail.backToList}
          </Link>
        </div>
        <div className="bg-error/10 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-error mr-2" />
            <span className="text-error">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">{t.userDetail.noInfo}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`${base}/users`}
            className="flex items-center text-sm text-muted hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t.userDetail.backToList}
          </Link>
          <div className="text-gray-300">|</div>
          <h1 className="text-2xl font-bold text-foreground">
            {t.userDetail.title}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href={`${base}/users/${userId}/edit`}
            className="inline-flex items-center px-3 py-2 border border-line-hover shadow-sm shadow-black/10 text-sm leading-4 font-medium rounded-md text-foreground bg-card hover:bg-card-hover"
          >
            <Edit className="mr-2 h-4 w-4" />
            {t.userDetail.edit}
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-3 py-2 border border-red-500/50 shadow-sm shadow-black/10 text-sm leading-4 font-medium rounded-md text-error bg-card hover:bg-error/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t.userDetail.delete}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-error/10 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-error" />
            <div className="ml-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-card shadow rounded-lg overflow-hidden">
        <div className="px-6 py-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div
                className={`h-20 w-20 rounded-full flex items-center justify-center ${
                  user.role === "admin" ? "bg-red-100" : "bg-blue-100"
                }`}
              >
                {user.role === "admin" ? (
                  <Shield className="h-10 w-10 text-error" />
                ) : (
                  <User className="h-10 w-10 text-accent" />
                )}
              </div>
            </div>
            <div className="ml-6 flex-1">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-foreground">
                  {user.name}
                </h2>
                <span
                  className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === "admin"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {user.role === "admin"
                    ? t.common.administrator
                    : t.common.user}
                </span>
                <span
                  className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-card-hover text-sub"
                  }`}
                >
                  {user.isActive ? t.common.active : t.common.inactive}
                </span>
              </div>
              <div className="mt-1 flex items-center text-sm text-muted">
                <Mail className="mr-1 h-4 w-4" />
                {user.email}
              </div>
              <div className="mt-1 flex items-center text-sm text-muted">
                <Calendar className="mr-1 h-4 w-4" />
                {t.userDetail.joinedLabel}{" "}
                {formatDate(user.createdAt, lang)}
              </div>
              {user.lastLoginAt && (
                <div className="mt-1 flex items-center text-sm text-muted">
                  <Clock className="mr-1 h-4 w-4" />
                  {t.userDetail.lastLogin} {getRelativeTime(user.lastLoginAt)}
                </div>
              )}
            </div>
            <div className="flex flex-col space-y-2">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`inline-flex items-center px-3 py-2 border shadow-sm shadow-black/10 text-sm leading-4 font-medium rounded-md ${
                  user.isActive
                    ? "border-red-500/50 text-error bg-card hover:bg-error/10"
                    : "border-green-500/50 text-green-300 bg-card hover:bg-green-500/10"
                } disabled:opacity-50`}
              >
                {user.isActive ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    {t.userDetail.deactivate}
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    {t.userDetail.activate}
                  </>
                )}
              </button>
              <button
                onClick={handleToggleRole}
                disabled={actionLoading}
                className="inline-flex items-center px-3 py-2 border border-accent/50 shadow-sm shadow-black/10 text-sm leading-4 font-medium rounded-md text-accent bg-card hover:bg-accent/10 disabled:opacity-50"
              >
                <Shield className="mr-2 h-4 w-4" />
                {user.role === "admin"
                  ? t.userDetail.removeAdmin
                  : t.userDetail.makeAdmin}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted truncate">
                    {t.userDetail.totalFiles}
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {user.stats.totalFiles.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted truncate">
                    {t.userDetail.totalFolders}
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {user.stats.totalFolders.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HardDrive className="h-8 w-8 text-accent" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted truncate">
                    {t.userDetail.storageUsed}
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {formatFileSize(user.totalStorageUsed || 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted truncate">
                    {t.userDetail.avgSize}
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
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
        <div className="bg-card shadow rounded-lg">
          <div className="px-6 py-4 border-b border-line">
            <h3 className="text-lg font-medium text-foreground">
              {t.userDetail.fileTypeDist}
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
                            colorClasses[index % colorClasses.length]
                          }`}
                        ></div>
                        <span className="text-sm font-medium text-foreground capitalize">
                          {type || t.userDetail.unknownType}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {t.userDetail.filesCount.replace(
                            "{n}",
                            data.count.toString(),
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          {formatFileSize(data.size)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-muted text-center py-4">
                {t.userDetail.noFiles}
              </p>
            )}
          </div>
        </div>

        {/* Recent Files */}
        <div className="bg-card shadow rounded-lg">
          <div className="px-6 py-4 border-b border-line">
            <h3 className="text-lg font-medium text-foreground">
              {t.userDetail.recentFiles}
            </h3>
          </div>
          <div className="divide-y divide-slate-700/50">
            {user.recentFiles.length > 0 ? (
              user.recentFiles.map((file) => (
                <div key={file.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground truncate max-w-48">
                          {file.name}
                        </div>
                        <div className="text-sm text-muted">
                          {formatFileSize(file.size)} •{" "}
                          {getRelativeTime(file.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted capitalize">
                      {file.type || t.userDetail.unknownType}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-muted">{t.userDetail.noFiles}</p>
              </div>
            )}
          </div>
          {user.recentFiles.length > 0 && (
            <div className="px-6 py-3 border-t border-line">
              <Link
                href={`${base}/files?user=${userId}`}
                className="text-sm text-accent hover:text-accent font-medium"
              >
                {t.userDetail.viewAllUserFiles}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        icon={<Trash2 className="h-6 w-6 text-error" />}
        title={t.userDetail.deleteUser}
        message={
          <p className="text-sm text-muted">
            {t.userDetail.deleteConfirm
              .replace("{name}", user.name)
              .replace("{files}", user.stats.totalFiles.toString())
              .replace("{folders}", user.stats.totalFolders.toString())}
          </p>
        }
        confirmLabel={
          actionLoading ? t.userDetail.deleting : t.userDetail.delete
        }
        cancelLabel={t.common.cancel}
      />
    </div>
  );
}
