"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  Download,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Lang, getDict } from "../i18n";
import {
  formatFileSize,
  formatDate,
  PageHeader,
  ErrorBanner,
  TableLoading,
  TableEmpty,
  Badge,
  SearchInput,
  SelectFilter,
  ResetFiltersButton,
  ActiveFilterChips,
  Pagination,
  Modal,
  ConfirmDialog,
} from "../ui";

interface AdminUser {
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

export default function AdminUsersPage({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const base = lang === "vi" ? "/vi/admin" : "/admin";

  const [users, setUsers] = useState<AdminUser[]>([]);
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
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
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search: debouncedSearch,
        role: roleFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.users.errorLoad);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(t.common.connectionError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    roleFilter,
    statusFilter,
    sortBy,
    sortOrder,
    pagination.currentPage,
  ]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
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

  const handleDeleteUser = async (user: AdminUser) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        setShowDeleteModal(false);
        setUserToDelete(null);
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.users.errorDelete);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(t.common.connectionError);
    }
  };

  const exportUsers = async () => {
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        lang,
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

    if (createErrors[name]) {
      setCreateErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { [key: string]: string } = {};

    if (!createForm.name.trim()) {
      errors.name = t.users.fullNameRequired;
    }

    if (!createForm.email.trim()) {
      errors.email = t.users.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = t.users.emailInvalid;
    }

    if (!createForm.password) {
      errors.password = t.users.passwordRequired;
    } else if (createForm.password.length < 8) {
      errors.password = t.users.passwordMin;
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
        setShowCreateModal(false);
        setCreateForm({ name: "", email: "", password: "", role: "user" });
        fetchUsers();
      } else {
        const errorData = await response.json();
        if (response.status === 409) {
          setCreateErrors({ email: t.users.errorDuplicate });
        } else {
          setCreateErrors({
            general: errorData.error || t.users.errorCreate,
          });
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setCreateErrors({ general: t.common.connectionError });
    } finally {
      setCreateLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const hasFilters =
    searchTerm !== "" ||
    roleFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc";

  const sortOptions = [
    { value: "createdAt-desc", label: t.users.newest },
    { value: "createdAt-asc", label: t.users.oldest },
    { value: "name-asc", label: t.users.nameAZ },
    { value: "name-desc", label: t.users.nameZA },
    { value: "totalStorageUsed-desc", label: t.users.highestStorage },
    { value: "totalFilesUploaded-desc", label: t.users.mostFiles },
    { value: "totalFolders-desc", label: t.users.mostFolders },
  ];

  const activeChips = [];
  if (roleFilter !== "all") {
    activeChips.push({
      label: roleFilter === "admin" ? t.users.adminRole : t.users.regularUser,
      className: "bg-purple-100 text-purple-800",
    });
  }
  if (statusFilter !== "all") {
    activeChips.push({
      label:
        statusFilter === "active"
          ? t.users.activeStatus
          : t.users.inactiveStatus,
      className: "bg-green-100 text-green-800",
    });
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t.users.title}
        icon={<Users className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />}
        subtitle={
          <>
            {t.users.totalUsers} {pagination.totalUsers}{" "}
            {t.users.totalUsersSuffix}
          </>
        }
        actions={
          <>
            <button
              onClick={exportUsers}
              className="inline-flex items-center rounded-md bg-slate-800/50 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 ring-1 ring-inset ring-gray-300 hover:bg-slate-800/30"
            >
              <Download className="mr-2 h-4 w-4" />
              {t.users.exportExcel}
            </button>
            <button
              onClick={() => fetchUsers()}
              className="inline-flex items-center rounded-md bg-slate-800/50 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 ring-1 ring-inset ring-gray-300 hover:bg-slate-800/30"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t.common.refresh}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-black/10 hover:bg-blue-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.users.addUser}
            </button>
          </>
        }
      />

      <ErrorBanner message={error} />

      {/* Filters and Search */}
      <div className="bg-slate-800/50 shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SearchInput
              value={searchTerm}
              onChange={handleSearch}
              placeholder={t.users.searchPlaceholder}
            />

            <SelectFilter
              value={roleFilter}
              onChange={handleRoleFilter}
              options={[
                { value: "all", label: t.users.allRoles },
                { value: "user", label: t.users.regularUser },
                { value: "admin", label: t.users.adminRole },
              ]}
            />

            <SelectFilter
              value={statusFilter}
              onChange={handleStatusFilter}
              options={[
                { value: "all", label: t.users.allStatuses },
                { value: "active", label: t.users.activeStatus },
                { value: "inactive", label: t.users.inactiveStatus },
              ]}
            />

            <SelectFilter
              value={`${sortBy}-${sortOrder}`}
              onChange={(value) => {
                const [field, order] = value.split("-");
                setSortBy(field || "createdAt");
                setSortOrder(order || "desc");
              }}
              options={sortOptions}
            />
          </div>

          <div className="lg:col-span-4 flex items-center justify-between mt-4">
            <div className="text-sm text-slate-300">
              📊 {t.common.showing} {users.length} {t.common.of}{" "}
              {pagination.totalUsers} {t.users.showingUsers}
              {(searchTerm ||
                roleFilter !== "all" ||
                statusFilter !== "all") && (
                <span className="ml-2 text-indigo-400">{t.common.filtered}</span>
              )}
            </div>
            <ResetFiltersButton lang={lang} onClick={resetFilters} disabled={!hasFilters} />
          </div>
        </div>

        {(searchTerm || roleFilter !== "all" || statusFilter !== "all") && (
          <ActiveFilterChips
            lang={lang}
            searchTerm={searchTerm}
            chips={activeChips}
          />
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
                  {t.users.userHeader}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("role")}
                >
                  {t.users.roleHeader}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t.users.statusHeader}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("totalStorageUsed")}
                >
                  {t.users.storage}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("totalFilesUploaded")}
                >
                  {t.users.filesHeader}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("totalFolders")}
                >
                  {t.users.foldersHeader}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort("createdAt")}
                >
                  {t.users.joinedHeader}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  {t.users.lastLoginHeader}
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">{t.common.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800/50 divide-y divide-slate-700/50">
              {loading ? (
                <TableLoading colSpan={10} />
              ) : users.length === 0 ? (
                <TableEmpty colSpan={10} message={t.users.noUsers} />
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
                      <Badge tone={user.role === "admin" ? "admin" : "info"}>
                        {user.role === "admin"
                          ? t.common.administrator
                          : t.common.user}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={user.isActive ? "active" : "inactive"}>
                        {user.isActive ? t.common.active : t.common.inactive}
                      </Badge>
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
                      {formatDate(user.createdAt, lang)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {user.lastLoginAt
                        ? formatDate(user.lastLoginAt, lang)
                        : t.common.never}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`${base}/users/${user.id}`}
                          className="text-indigo-400 hover:text-blue-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`${base}/users/${user.id}/edit`}
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

        <Pagination
          lang={lang}
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalUsers}
          pageSize={20}
          label={t.users.showingUsers}
          onPageChange={(page) => fetchUsers(page)}
        />
      </div>

      {/* Create User Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateForm({ name: "", email: "", password: "", role: "user" });
          setCreateErrors({});
        }}
        title={t.users.addNewUser}
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label
              htmlFor="createName"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              {t.users.fullName}
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
              placeholder={t.users.fullNamePlaceholder}
            />
            {createErrors.name && (
              <p className="mt-1 text-sm text-red-400">{createErrors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="createEmail"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              {t.users.email}
            </label>
            <div className="relative">
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
                placeholder={t.users.emailPlaceholder}
              />
            </div>
            {createErrors.email && (
              <p className="mt-1 text-sm text-red-400">{createErrors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="createPassword"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              {t.users.password}
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
              placeholder={t.users.passwordPlaceholder}
            />
            {createErrors.password && (
              <p className="mt-1 text-sm text-red-400">
                {createErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="createRole"
              className="block text-sm font-medium text-slate-200 mb-1"
            >
              {t.users.roleField}
            </label>
            <select
              id="createRole"
              name="role"
              value={createForm.role}
              onChange={handleCreateFormChange}
              className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">{t.common.user}</option>
              <option value="admin">{t.common.administrator}</option>
            </select>
          </div>

          {createErrors.general && (
            <div className="bg-red-500/10 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{createErrors.general}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={createLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createLoading ? t.common.creating : t.users.createUser}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                setCreateForm({ name: "", email: "", password: "", role: "user" });
                setCreateErrors({});
              }}
              disabled={createLoading}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={showDeleteModal && !!userToDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        onConfirm={() => userToDelete && handleDeleteUser(userToDelete)}
        icon={<Trash2 className="h-6 w-6 text-red-400" />}
        title={t.users.deleteUser}
        message={
          <p className="text-sm text-slate-400">
            {t.users.deleteConfirm.replace(
              "{name}",
              userToDelete?.name || "",
            )}
          </p>
        }
        confirmLabel={t.common.delete}
        cancelLabel={t.common.cancel}
      />
    </div>
  );
}
