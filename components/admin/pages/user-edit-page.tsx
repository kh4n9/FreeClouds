"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Shield,
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  HardDrive,
} from "lucide-react";
import Link from "next/link";
import { Lang, getDict } from "../i18n";
import { formatFileSize } from "../ui";

interface UserDetail {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  totalFilesUploaded: number;
  totalStorageUsed: number;
  storageLimit: number | null;
  createdAt: string;
  lastLoginAt?: string;
}

interface EditForm {
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  password: string;
  confirmPassword: string;
  storageLimit: string;
}

interface FormError {
  field: string;
  message: string;
}

export default function AdminUserEditPage({
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
  const [form, setForm] = useState<EditForm>({
    name: "",
    email: "",
    role: "user",
    isActive: true,
    password: "",
    confirmPassword: "",
    storageLimit: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setForm({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
          password: "",
          confirmPassword: "",
          storageLimit:
            userData.storageLimit && userData.storageLimit > 0
              ? String(userData.storageLimit / (1024 * 1024 * 1024))
              : "",
        });
        setError(null);
      } else if (response.status === 404) {
        setError(t.userEdit.errorLoad);
      } else {
        const errorData = await response.json();
        setError(errorData.error || t.userEdit.errorLoad);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => prev.filter((err) => err.field !== name));
    setError(null);
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    if (!form.name.trim()) {
      newErrors.push({ field: "name", message: t.userEdit.fullNameRequired });
    } else if (form.name.trim().length < 2) {
      newErrors.push({ field: "name", message: t.userEdit.fullNameMin });
    }

    if (!form.email.trim()) {
      newErrors.push({ field: "email", message: t.userEdit.emailRequired });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.push({ field: "email", message: t.userEdit.emailInvalid });
    }

    if (form.password) {
      if (form.password.length < 8) {
        newErrors.push({ field: "password", message: t.userEdit.passwordMin });
      }

      if (form.password !== form.confirmPassword) {
        newErrors.push({
          field: "confirmPassword",
          message: t.userEdit.passwordMismatch,
        });
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updateData: Record<string, string | boolean | number | null> = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        role: form.role,
        isActive: form.isActive,
      };

      if (form.password) {
        updateData.password = form.password;
      }

      if (form.storageLimit.trim() === "") {
        updateData.storageLimit = null;
      } else {
        const gb = parseFloat(form.storageLimit);
        if (isNaN(gb) || gb <= 0) {
          setErrors([
            {
              field: "storageLimit",
              message: t.userEdit.storageLimitHint,
            },
          ]);
          setSaving(false);
          return;
        }
        updateData.storageLimit = Math.floor(gb * 1024 * 1024 * 1024);
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setSuccess(true);

        setUser((prev) => (prev ? { ...prev, ...updatedUser.user } : null));

        setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));

        setTimeout(() => {
          router.push(`${base}/users/${userId}`);
        }, 2000);
      } else {
        const errorData = await response.json();

        if (response.status === 409) {
          setErrors([
            {
              field: "email",
              message: t.userEdit.emailTaken,
            },
          ]);
        } else {
          setError(errorData.error || t.userEdit.errorUpdate);
        }
      }
    } catch {
      setError(t.common.connectionError);
    } finally {
      setSaving(false);
    }
  };

  const getFieldError = (field: string): string | null => {
    const error = errors.find((err) => err.field === field);
    return error ? error.message : null;
  };

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
            className="flex items-center text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t.userDetail.backToList}
          </Link>
        </div>
        <div className="bg-red-500/10 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`${base}/users/${userId}`}
            className="flex items-center text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t.userEdit.backToDetail}
          </Link>
          <div className="text-gray-300">|</div>
          <h1 className="text-2xl font-bold text-white">
            {t.userEdit.title}
          </h1>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-300">{t.userEdit.success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-300">{error}</span>
          </div>
        </div>
      )}

      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">
                {t.userEdit.currentInfo}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      user.role === "admin" ? "bg-red-100" : "bg-blue-100"
                    }`}
                  >
                    {user.role === "admin" ? (
                      <Shield className="h-6 w-6 text-red-400" />
                    ) : (
                      <User className="h-6 w-6 text-sky-400" />
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-slate-400">{user.email}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      {t.userEdit.roleLabel}
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "admin"
                          ? t.common.administrator
                          : t.common.user}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      {t.userEdit.statusLabel}
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-slate-100"
                        }`}
                      >
                        {user.isActive ? t.common.active : t.common.inactive}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      {t.userEdit.totalFiles}
                    </dt>
                    <dd className="mt-1 text-sm text-white">
                      {(user.totalFilesUploaded || 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      {t.userEdit.storage}
                    </dt>
                    <dd className="mt-1 text-sm text-white">
                      {formatFileSize(user.totalStorageUsed || 0)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-6">
                {t.userEdit.editInfo}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    {t.userEdit.fullName}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError("name")
                          ? "border-red-500/50 text-red-900 placeholder-red-300"
                          : "border-slate-600/50"
                      }`}
                      placeholder={t.userEdit.fullNamePlaceholder}
                    />
                  </div>
                  {getFieldError("name") && (
                    <p className="mt-1 text-sm text-red-400">
                      {getFieldError("name")}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    {t.userEdit.email}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError("email")
                          ? "border-red-500/50 text-red-900 placeholder-red-300"
                          : "border-slate-600/50"
                      }`}
                      placeholder={t.userEdit.emailPlaceholder}
                    />
                  </div>
                  {getFieldError("email") && (
                    <p className="mt-1 text-sm text-red-400">
                      {getFieldError("email")}
                    </p>
                  )}
                </div>

                {/* Role Field */}
                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    {t.userEdit.roleField}
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">{t.common.user}</option>
                    <option value="admin">{t.common.administrator}</option>
                  </select>
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    {t.userEdit.accountStatus}
                  </label>
                  <div className="flex items-center">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-sky-400 focus:ring-blue-500 border-slate-600/50 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 flex items-center text-sm text-white"
                    >
                      {form.isActive ? (
                        <>
                          <UserCheck className="mr-1 h-4 w-4 text-green-500" />
                          {t.userEdit.activeDesc}
                        </>
                      ) : (
                        <>
                          <UserX className="mr-1 h-4 w-4 text-red-500" />
                          {t.userEdit.inactiveDesc}
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Storage Limit Field */}
                <div>
                  <label
                    htmlFor="storageLimit"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    {t.userEdit.storageLimit}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HardDrive className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="storageLimit"
                      name="storageLimit"
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.storageLimit}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        getFieldError("storageLimit")
                          ? "border-red-500/50 text-red-900 placeholder-red-300"
                          : "border-slate-600/50"
                      }`}
                      placeholder={t.userEdit.storageLimitPlaceholder}
                    />
                  </div>
                  {getFieldError("storageLimit") && (
                    <p className="mt-1 text-sm text-red-400">
                      {getFieldError("storageLimit")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">
                    {t.userEdit.storageLimitHint}
                  </p>
                </div>

                {/* Password Section */}
                <div className="pt-6 border-t border-slate-700/50">
                  <h4 className="text-md font-medium text-white mb-4">
                    {t.userEdit.changePassword}
                  </h4>

                  {/* Password Field */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      {t.userEdit.newPassword}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-12 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          getFieldError("password")
                            ? "border-red-500/50 text-red-900 placeholder-red-300"
                            : "border-slate-600/50"
                        }`}
                        placeholder={t.userEdit.newPasswordPlaceholder}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {getFieldError("password") && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldError("password")}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      {t.userEdit.confirmPassword}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-12 py-2 border rounded-md leading-5 bg-slate-800/80 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          getFieldError("confirmPassword")
                            ? "border-red-500/50 text-red-900 placeholder-red-300"
                            : "border-slate-600/50"
                        }`}
                        placeholder={t.userEdit.confirmPlaceholder}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {getFieldError("confirmPassword") && (
                      <p className="mt-1 text-sm text-red-400">
                        {getFieldError("confirmPassword")}
                      </p>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    {t.userEdit.passwordHint}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700/50">
                  <Link
                    href={`${base}/users/${userId}`}
                    className="px-4 py-2 border border-slate-600/50 rounded-md shadow-sm shadow-black/10 text-sm font-medium text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {t.userEdit.cancel}
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || success}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm shadow-black/10 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t.userEdit.saving}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t.userEdit.save}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
