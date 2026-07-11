"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
}

interface EditForm {
  name: string;
  email: string;
  role: "user" | "admin";
  isActive: boolean;
  password: string;
  confirmPassword: string;
}

interface FormError {
  field: string;
  message: string;
}

export default function AdminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [form, setForm] = useState<EditForm>({
    name: "",
    email: "",
    role: "user",
    isActive: true,
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormError[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

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
        setForm({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          isActive: userData.isActive,
          password: "",
          confirmPassword: "",
        });
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear specific field errors
    setErrors((prev) => prev.filter((err) => err.field !== name));
    setError(null);
    setSuccess(false);
  };

  const validateForm = (): boolean => {
    const newErrors: FormError[] = [];

    // Name validation
    if (!form.name.trim()) {
      newErrors.push({ field: "name", message: "Tên không được để trống" });
    } else if (form.name.trim().length < 2) {
      newErrors.push({ field: "name", message: "Tên phải có ít nhất 2 ký tự" });
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.push({ field: "email", message: "Email không được để trống" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.push({ field: "email", message: "Email không hợp lệ" });
    }

    // Password validation (only if password is provided)
    if (form.password) {
      if (form.password.length < 8) {
        newErrors.push({
          field: "password",
          message: "Mật khẩu phải có ít nhất 8 ký tự",
        });
      }

      if (form.password !== form.confirmPassword) {
        newErrors.push({
          field: "confirmPassword",
          message: "Xác nhận mật khẩu không khớp",
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
      const updateData: any = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        role: form.role,
        isActive: form.isActive,
      };

      // Only include password if it's provided
      if (form.password) {
        updateData.password = form.password;
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

        // Update local user state
        setUser((prev) => (prev ? { ...prev, ...updatedUser.user } : null));

        // Clear password fields
        setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));

        // Auto-redirect after success
        setTimeout(() => {
          router.push(`/admin/users/${userId}`);
        }, 2000);
      } else {
        const errorData = await response.json();

        if (response.status === 409) {
          setErrors([
            {
              field: "email",
              message: "Email này đã được sử dụng bởi người dùng khác",
            },
          ]);
        } else {
          setError(
            errorData.error || "Không thể cập nhật thông tin người dùng",
          );
        }
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Lỗi kết nối khi cập nhật thông tin");
    } finally {
      setSaving(false);
    }
  };

  const getFieldError = (field: string): string | null => {
    const error = errors.find((err) => err.field === field);
    return error ? error.message : null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
            href="/admin/users"
            className="flex items-center text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại danh sách
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
            href={`/admin/users/${userId}`}
            className="flex items-center text-sm text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại chi tiết
          </Link>
          <div className="text-gray-300">|</div>
          <h1 className="text-2xl font-bold text-white">
            Chỉnh sửa người dùng
          </h1>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-500/10 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-300">
              Cập nhật thông tin thành công! Đang chuyển hướng...
            </span>
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
                Thông tin hiện tại
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
                      <User className="h-6 w-6 text-indigo-400" />
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
                      Vai trò
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      Trạng thái
                    </dt>
                    <dd className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-slate-100"
                        }`}
                      >
                        {user.isActive ? "Hoạt động" : "Vô hiệu hóa"}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      Tổng file
                    </dt>
                    <dd className="mt-1 text-sm text-white">
                      {(user.totalFilesUploaded || 0).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-slate-400">
                      Dung lượng
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
                Chỉnh sửa thông tin
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-200 mb-2"
                  >
                    Họ và tên *
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
                      placeholder="Nhập họ và tên"
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
                    Địa chỉ email *
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
                      placeholder="Nhập địa chỉ email"
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
                    Vai trò *
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={form.role}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-slate-600/50 rounded-md bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="user">Người dùng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                {/* Status Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Trạng thái tài khoản
                  </label>
                  <div className="flex items-center">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-indigo-400 focus:ring-blue-500 border-slate-600/50 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 flex items-center text-sm text-white"
                    >
                      {form.isActive ? (
                        <>
                          <UserCheck className="mr-1 h-4 w-4 text-green-500" />
                          Tài khoản đang hoạt động
                        </>
                      ) : (
                        <>
                          <UserX className="mr-1 h-4 w-4 text-red-500" />
                          Tài khoản bị vô hiệu hóa
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* Password Section */}
                <div className="pt-6 border-t border-slate-700/50">
                  <h4 className="text-md font-medium text-white mb-4">
                    Đổi mật khẩu (tùy chọn)
                  </h4>

                  {/* Password Field */}
                  <div className="mb-4">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-slate-200 mb-2"
                    >
                      Mật khẩu mới
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
                        placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
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
                      Xác nhận mật khẩu mới
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
                        placeholder="Nhập lại mật khẩu mới"
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
                    Để trống nếu không muốn thay đổi mật khẩu
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700/50">
                  <Link
                    href={`/admin/users/${userId}`}
                    className="px-4 py-2 border border-slate-600/50 rounded-md shadow-sm shadow-black/10 text-sm font-medium text-slate-200 bg-slate-800/50 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Hủy
                  </Link>
                  <button
                    type="submit"
                    disabled={saving || success}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm shadow-black/10 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay đổi
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
