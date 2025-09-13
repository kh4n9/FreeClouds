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

interface LoginForm {
  email: string;
  password: string;
}

interface LoginError {
  message: string;
  field?: string;
}

export default function LoginPage() {
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        router.push("/dashboard");
      }
    } catch (error) {
      // User not logged in, continue with login page
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!form.email.trim()) {
      setError({ message: "Email is required", field: "email" });
      return false;
    }

    if (!form.email.includes("@")) {
      setError({ message: "Please enter a valid email address", field: "email" });
      return false;
    }

    if (!form.password.trim()) {
      setError({ message: "Password is required", field: "password" });
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful, redirect to dashboard
        router.push("/dashboard");
      } else {
        // Handle login error
        setError({
          message: data.error || "Login failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setError({
        message: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      {/* Enhanced SEO Head */}
      <Head>
        <title>Sign In - Free Clouds | Secure Cloud Storage Login</title>
        <meta name="description" content="Sign in to your Free Clouds account and access your secure cloud storage. Fast, reliable, and secure file management with enterprise-grade security." />
        <meta name="keywords" content="login, sign in, cloud storage login, free clouds login, secure login, file storage access" />
        <link rel="canonical" href={`${BASE_URL}/login`} />
        <meta property="og:title" content="Sign In - Free Clouds | Secure Cloud Storage Login" />
        <meta property="og:description" content="Sign in to your Free Clouds account and access your secure cloud storage." />
        <meta property="og:url" content={`${BASE_URL}/login`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      {/* Structured Data */}
      <Script
        id="login-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateBreadcrumbs([
            { name: 'Home', url: '/' },
            { name: 'Sign In', url: '/login' }
          ]))
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
          <p className="text-gray-600">Sign in to your Free Clouds account</p>
          <p className="text-sm text-gray-500 mt-1 italic">Đăng nhập vào tài khoản Free Clouds của bạn</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Global Error */}
            {error && !error.field && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" role="alert">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-700">{error.message}</p>
                  <p className="text-xs text-red-600 mt-1 italic">Vui lòng kiểm tra lại thông tin đăng nhập</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address / Địa chỉ Email
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
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              {error?.field === "email" && (
                <p className="mt-1 text-sm text-red-600">{error.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password / Mật khẩu
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
                  placeholder="Enter your password"
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
              aria-label="Sign in to your account"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In... / Đang đăng nhập...
                </div>
              ) : (
                "Sign In / Đăng nhập"
              )}
            </button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 text-center space-y-3">
            <div>
              <a
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="Reset your password"
              >
                Forgot your password? / Quên mật khẩu?
              </a>
            </div>
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <a
                href="/register"
                className="text-blue-600 hover:text-blue-500 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
                aria-label="Create new account"
              >
                Sign up / Đăng ký
              </a>
            </p>
            <p className="text-xs text-gray-500 mt-2 italic">
              Chưa có tài khoản? Tạo tài khoản miễn phí ngay!
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-3 py-2"
            aria-label="Go back to homepage"
          >
            ← Back to Home / Về trang chủ
          </a>
        </div>
      </div>
      </div>

      <Footer />
      </div>
    </>
  );
}
