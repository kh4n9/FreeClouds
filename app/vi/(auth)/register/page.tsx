"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Cloud } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface RegisterError {
  message: string;
  field?: string;
}

interface ValidationState {
  name: boolean;
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
}

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RegisterError | null>(null);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      // User not logged in, continue with register page
    }
  };

  const validation: ValidationState = {
    name: form.name.trim().length >= 2,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email),
    password: form.password.length >= 6,
    confirmPassword: form.password === form.confirmPassword && form.confirmPassword.length > 0,
  };

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setError({ message: "Vui lòng nhập tên của bạn", field: "name" });
      return false;
    }

    if (form.name.trim().length < 2) {
      setError({ message: "Tên phải có ít nhất 2 ký tự", field: "name" });
      return false;
    }

    if (!form.email.trim()) {
      setError({ message: "Vui lòng nhập địa chỉ email", field: "email" });
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError({ message: "Vui lòng nhập địa chỉ email hợp lệ", field: "email" });
      return false;
    }

    if (!form.password) {
      setError({ message: "Vui lòng nhập mật khẩu", field: "password" });
      return false;
    }

    if (form.password.length < 6) {
      setError({ message: "Mật khẩu phải có ít nhất 6 ký tự", field: "password" });
      return false;
    }

    if (!form.confirmPassword) {
      setError({ message: "Vui lòng xác nhận mật khẩu", field: "confirmPassword" });
      return false;
    }

    if (form.password !== form.confirmPassword) {
      setError({ message: "Mật khẩu không khớp", field: "confirmPassword" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, redirect to dashboard
        router.push("/dashboard");
      } else {
        // Handle registration error
        if (data.details) {
          // Handle validation errors from server
          const firstError = data.details[0];
          setError({
            message: firstError.message,
            field: firstError.field,
          });
        } else {
          setError({
            message: data.error || "Đăng ký thất bại. Vui lòng thử lại.",
          });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError({
        message: "Lỗi mạng. Vui lòng kiểm tra kết nối và thử lại.",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "" };
    if (password.length < 6) return { strength: 1, label: "Yếu" };
    if (password.length < 8) return { strength: 2, label: "Trung bình" };
    if (password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 4, label: "Mạnh" };
    }
    return { strength: 3, label: "Khá" };
  };

  const passwordStrength = getPasswordStrength(form.password);

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cloud className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Tạo Tài Khoản</h1>
        <p className="text-slate-400">Tham gia Free Clouds và lưu trữ file an toàn ngay hôm nay</p>
      </div>

      <div className="modal-content p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && !error.field && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error.message}</p>
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Họ và Tên
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input id="name" name="name" type="text" autoComplete="name" required
                value={form.name} onChange={handleInputChange}
                className={`input-modern w-full pl-10 pr-10 py-3 rounded-xl ${
                  error?.field === "name"
                    ? "border-red-500/50 bg-red-500/5"
                    : validation.name && form.name
                    ? "border-emerald-500/50"
                    : ""
                }`}
                placeholder="Nhập họ và tên của bạn" disabled={loading} />
              {validation.name && form.name && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
              )}
            </div>
            {error?.field === "name" && (
              <p className="mt-1 text-sm text-red-400">{error.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input id="email" name="email" type="email" autoComplete="email" required
                value={form.email} onChange={handleInputChange}
                className={`input-modern w-full pl-10 pr-10 py-3 rounded-xl ${
                  error?.field === "email"
                    ? "border-red-500/50 bg-red-500/5"
                    : validation.email && form.email
                    ? "border-emerald-500/50"
                    : ""
                }`}
                placeholder="Nhập địa chỉ email của bạn" disabled={loading} />
              {validation.email && form.email && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
              )}
            </div>
            {error?.field === "email" && (
              <p className="mt-1 text-sm text-red-400">{error.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input id="password" name="password" type={showPassword ? "text" : "password"}
                autoComplete="new-password" required value={form.password} onChange={handleInputChange}
                className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${
                  error?.field === "password"
                    ? "border-red-500/50 bg-red-500/5"
                    : validation.password && form.password
                    ? "border-emerald-500/50"
                    : ""
                }`}
                placeholder="Tạo mật khẩu" disabled={loading} />
              <button type="button" onClick={() => togglePasswordVisibility('password')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {form.password && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Độ mạnh mật khẩu</span>
                  <span className={`font-medium ${
                    passwordStrength.strength === 1 ? 'text-red-400' :
                    passwordStrength.strength === 2 ? 'text-amber-400' :
                    passwordStrength.strength === 3 ? 'text-sky-400' :
                    passwordStrength.strength === 4 ? 'text-emerald-400' : ''
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1">
                  <div
                    className={`h-1 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 1 ? 'bg-red-500 w-1/4' :
                      passwordStrength.strength === 2 ? 'bg-amber-500 w-2/4' :
                      passwordStrength.strength === 3 ? 'bg-sky-500 w-3/4' :
                      passwordStrength.strength === 4 ? 'bg-emerald-500 w-full' : 'w-0'
                    }`}
                  />
                </div>
              </div>
            )}

            {error?.field === "password" && (
              <p className="mt-1 text-sm text-red-400">{error.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password" required value={form.confirmPassword} onChange={handleInputChange}
                className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${
                  error?.field === "confirmPassword"
                    ? "border-red-500/50 bg-red-500/5"
                    : validation.confirmPassword && form.confirmPassword
                    ? "border-emerald-500/50"
                    : ""
                }`}
                placeholder="Xác nhận mật khẩu của bạn" disabled={loading} />
              <button type="button" onClick={() => togglePasswordVisibility('confirmPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {validation.confirmPassword && form.confirmPassword && (
                <CheckCircle className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
              )}
            </div>
            {error?.field === "confirmPassword" && (
              <p className="mt-1 text-sm text-red-400">{error.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !Object.values(validation).every(Boolean)}
            className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang tạo tài khoản...
              </span>
            ) : "Tạo Tài Khoản"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-400">
            Đã có tài khoản?{" "}
            <Link href="/vi/login" className="text-sky-400 hover:text-sky-300 font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link href="/vi" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          ← Về trang chủ
        </Link>
      </div>
    </AuthShell>
  );
}
