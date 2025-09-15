"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Head from "next/head";
import Script from "next/script";
import Footer from "@/components/Footer";
import { generateMetadata, generateBreadcrumbs } from "@/lib/seo/utils";
import { BASE_URL } from "@/lib/seo/config";
import {
  useAuth,
  validateLoginForm,
  createInputChangeHandler,
  redirectToPage,
  type LoginForm,
  type LoginError,
} from "@/utils/auth-helpers";

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
        redirectToPage("/dashboard");
      }
    };
    checkExistingAuth();
  }, [checkAuth]);

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
      redirectToPage("/dashboard");
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

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-full shadow-lg">
                  <Image
                    src="/logo.svg"
                    alt="Free Clouds Logo"
                    width={32}
                    height={32}
                    className="w-8 h-8"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chào mừng trở lại
              </h1>
              <p className="text-gray-600">
                Đăng nhập vào tài khoản Free Clouds của bạn
              </p>
              <p className="text-sm text-gray-500 mt-1 italic">
                Sign in to your Free Clouds account
              </p>
            </div>

            {/* Login Form */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Global Error */}
                {error && !error.field && (
                  <div
                    className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
                    role="alert"
                  >
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-700">{error.message}</p>
                      <p className="text-xs text-red-600 mt-1 italic">
                        Please check your login information
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Địa chỉ Email / Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        error?.field === "email"
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Nhập địa chỉ email của bạn"
                      disabled={loading}
                    />
                  </div>
                  {error?.field === "email" && (
                    <p className="mt-1 text-sm text-red-600">{error.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mật khẩu / Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={form.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        error?.field === "password"
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Nhập mật khẩu của bạn"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      disabled={loading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {error?.field === "password" && (
                    <p className="mt-1 text-sm text-red-600">{error.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  aria-label="Đăng nhập vào tài khoản của bạn"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang đăng nhập...
                    </div>
                  ) : (
                    "Đăng Nhập"
                  )}
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 text-center space-y-3">
                <div>
                  <a
                    href="/vi/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                    aria-label="Đặt lại mật khẩu của bạn"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <p className="text-sm text-gray-600">
                  Chưa có tài khoản?{" "}
                  <a
                    href="/vi/register"
                    className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                    aria-label="Tạo tài khoản mới"
                  >
                    Đăng ký ngay
                  </a>
                </p>
                <p className="text-xs text-gray-500 mt-2 italic">
                  Don't have an account? Create a free account now!
                </p>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <a
                href="/vi"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-3 py-2"
                aria-label="Quay về trang chủ"
              >
                ← Về trang chủ
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
