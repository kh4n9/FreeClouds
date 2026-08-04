"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Cloud } from "lucide-react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Script from "next/script";
import AuthShell from "@/components/AuthShell";
import { generateBreadcrumbs } from "@/lib/seo/utils";
import { BASE_URL } from "@/lib/seo/config";
import {
  useAuth,
  validateLoginForm,
  createInputChangeHandler,
  getSafeRedirect,
  type LoginForm,
  type LoginError,
} from "@/utils/auth-helpers";

const getRedirectParam = () =>
  new URLSearchParams(window.location.search).get("redirect");

export default function VietnameseLoginPage() {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, setError, checkAuth, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkExistingAuth = async () => {
      const user = await checkAuth();
      if (user) {
        router.replace(
          getSafeRedirect(
            getRedirectParam(),
            user.role === "admin" ? "/vi/admin" : "/dashboard",
          ),
        );
      }
    };
    checkExistingAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = createInputChangeHandler(setForm, setError);

  const validateVietnameseForm = (form: LoginForm): LoginError | null => {
    if (!form.email.trim()) {
      return { message: "Email là bắt buộc", field: "email" };
    }

    if (!form.email.includes("@")) {
      return {
        message: "Vui lòng nhập địa chỉ email hợp lệ",
        field: "email",
      };
    }

    if (!form.password.trim()) {
      return { message: "Mật khẩu là bắt buộc", field: "password" };
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateVietnameseForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const user = await login(form);
    if (user) {
      router.replace(
        getSafeRedirect(
          getRedirectParam(),
          user.role === "admin" ? "/vi/admin" : "/dashboard",
        ),
      );
    } else if (!error) {
      // Set Vietnamese error message if login failed but no specific error was set
      setError({
        message: "Đăng nhập thất bại. Vui lòng thử lại.",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {/* Enhanced SEO Head */}
      <Head>
        <title>Đăng Nhập - Free Clouds | Lưu Trữ Đám Mây An Toàn</title>
        <meta
          name="description"
          content="Đăng nhập vào tài khoản Free Clouds và truy cập lưu trữ đám mây an toàn. Quản lý file nhanh chóng, đáng tin cậy và bảo mật cấp doanh nghiệp."
        />
        <meta
          name="keywords"
          content="đăng nhập, sign in, đăng nhập cloud storage, free clouds login, đăng nhập an toàn, truy cập file storage"
        />
        <link rel="canonical" href={`${BASE_URL}/vi/login`} />
        <meta
          property="og:title"
          content="Đăng Nhập - Free Clouds | Lưu Trữ Đám Mây An Toàn"
        />
        <meta
          property="og:description"
          content="Đăng nhập vào tài khoản Free Clouds và truy cập lưu trữ đám mây an toàn."
        />
        <meta property="og:url" content={`${BASE_URL}/vi/login`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Structured Data */}
      <Script
        id="login-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbs([
              { name: "Trang Chủ", url: "/vi" },
              { name: "Đăng Nhập", url: "/vi/login" },
            ]),
          ),
        }}
      />

      <AuthShell>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cloud className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Chào mừng trở lại
          </h1>
          <p className="text-slate-400">
            Đăng nhập vào tài khoản Free Clouds của bạn
          </p>
        </div>

        <div className="modal-content p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && !error.field && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error.message}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input id="email" name="email" type="email" autoComplete="email" required
                  value={form.email} onChange={handleInputChange}
                  className={`input-modern w-full pl-10 pr-4 py-3 rounded-xl ${
                    error?.field === "email" ? "border-red-500/50 bg-red-500/5" : ""
                  }`}
                  placeholder="Nhập địa chỉ email của bạn" disabled={loading} />
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
                  autoComplete="current-password" required value={form.password}
                  onChange={handleInputChange}
                  className={`input-modern w-full pl-10 pr-12 py-3 rounded-xl ${
                    error?.field === "password" ? "border-red-500/50 bg-red-500/5" : ""
                  }`}
                  placeholder="Nhập mật khẩu của bạn" disabled={loading} />
                <button type="button" onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error?.field === "password" && (
                <p className="mt-1 text-sm text-red-400">{error.message}</p>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang đăng nhập...
                </span>
              ) : "Đăng Nhập"}
            </button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <a href="/vi/forgot-password" className="text-sm text-sky-400 hover:text-sky-300 font-medium">
              Quên mật khẩu?
            </a>
            <p className="text-sm text-slate-400">
              Chưa có tài khoản?{" "}
              <a href="/vi/register" className="text-sky-400 hover:text-sky-300 font-medium">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/vi" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Về trang chủ
          </a>
        </div>
      </AuthShell>
    </>
  );
}
