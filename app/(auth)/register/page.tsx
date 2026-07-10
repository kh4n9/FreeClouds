"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Cloud } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";

interface RegisterForm { name: string; email: string; password: string; confirmPassword: string; }
interface RegisterError { message: string; field?: string; }
interface ValidationState { name: boolean; email: boolean; password: boolean; confirmPassword: boolean; }

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterForm>({ name: "", email: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<RegisterError | null>(null);
  const [success, setSuccess] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ name: false, email: false, password: false, confirmPassword: false });
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) router.push("/dashboard");
      } catch {}
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
    if (value.trim()) {
      setValidation(prev => ({ ...prev, [name]: true }));
    }
  };

  const validateForm = (): RegisterError | null => {
    if (!form.name.trim()) return { message: "Name is required / Vui lòng nhập tên", field: "name" };
    if (form.name.trim().length < 2) return { message: "Name must be at least 2 characters / Tên phải có ít nhất 2 ký tự", field: "name" };
    if (!form.email.trim()) return { message: "Email is required / Vui lòng nhập email", field: "email" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) return { message: "Invalid email format / Email không hợp lệ", field: "email" };
    if (!form.password) return { message: "Password is required / Vui lòng nhập mật khẩu", field: "password" };
    if (form.password.length < 6) return { message: "Password must be at least 6 characters / Mật khẩu phải có ít nhất 6 ký tự", field: "password" };
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      return { message: "Password must contain uppercase, lowercase, and number / Mật khẩu phải có chữ hoa, chữ thường và số", field: "password" };
    if (!form.confirmPassword) return { message: "Please confirm your password / Vui lòng xác nhận mật khẩu", field: "confirmPassword" };
    if (form.password !== form.confirmPassword) return { message: "Passwords do not match / Mật khẩu không khớp", field: "confirmPassword" };
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) { setError(err); document.getElementById(err.field!)?.focus(); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError({ message: data.message || "Registration failed" });
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError({ message: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="modal-content p-10 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Registration Successful!</h2>
          <p className="text-slate-400 mb-4">Tạo tài khoản thành công!</p>
          <p className="text-sm text-slate-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Cloud className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-slate-400">Join Free Clouds today</p>
            <p className="text-sm text-slate-600 mt-1 italic">Tạo tài khoản Free Clouds miễn phí</p>
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
                  Full Name / Họ và tên
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input id="name" name="name" type="text" autoComplete="name" required
                    value={form.name} onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-4 py-3 rounded-xl ${error?.field === "name" ? "border-red-500/50 bg-red-500/5" : ""}`}
                    placeholder="Enter your name" disabled={loading} />
                </div>
                {error?.field === "name" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address / Địa chỉ Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input id="email" name="email" type="email" autoComplete="email" required
                    value={form.email} onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-4 py-3 rounded-xl ${error?.field === "email" ? "border-red-500/50 bg-red-500/5" : ""}`}
                    placeholder="Enter your email" disabled={loading} />
                </div>
                {error?.field === "email" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                  Password / Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input id="password" name="password" type={showPassword ? "text" : "password"}
                    autoComplete="new-password" required value={form.password} onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${error?.field === "password" ? "border-red-500/50 bg-red-500/5" : ""}`}
                    placeholder="Enter your password" disabled={loading} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error?.field === "password" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password / Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input id="confirmPassword" name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" required
                    value={form.confirmPassword} onChange={handleChange}
                    className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${error?.field === "confirmPassword" ? "border-red-500/50 bg-red-500/5" : ""}`}
                    placeholder="Confirm your password" disabled={loading} />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {error?.field === "confirmPassword" && <p className="mt-1 text-sm text-red-400">{error.message}</p>}
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : "Create Account / Tạo tài khoản"}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                  Sign in / Đăng nhập
                </Link>
              </p>
              <p className="text-xs text-slate-600 italic">Đã có tài khoản? Đăng nhập ngay!</p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              ← Back to Home / Về trang chủ
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
