"use client";

import { useEffect, useState } from "react";
import { Shield, Zap, Users, ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Head from "next/head";
import Script from "next/script";
import Footer from "../components/Footer";
import {
  generateMetadata,
  generateWebApplicationStructuredData,
  generateBreadcrumbs,
} from "@/lib/seo/utils";
import { BASE_URL } from "@/lib/seo/config";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (user) {
    // Redirect to dashboard if already logged in
    window.location.href = "/dashboard";
    return null;
  }

  const structuredData = generateWebApplicationStructuredData("en");
  const breadcrumbData = generateBreadcrumbs([{ name: "Home", url: "/" }]);

  return (
    <>
      {/* Enhanced SEO Head */}
      <Head>
        <title>
          Free Clouds - Secure Cloud Storage & File Sharing Platform
        </title>
        <meta
          name="description"
          content="Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security. 50MB file limit, unlimited folders, blazing-fast access."
        />
        <meta
          name="keywords"
          content="cloud storage, file sharing, free storage, telegram storage, secure file upload, online storage, file management, cloud backup"
        />
        <link rel="canonical" href={BASE_URL} />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Free Clouds - Secure Cloud Storage & File Sharing Platform"
        />
        <meta
          property="og:description"
          content="Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security."
        />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:image" content={`${BASE_URL}/logo-with-text.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Free Clouds - Secure Cloud Storage & File Sharing Platform"
        />
        <meta
          name="twitter:description"
          content="Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security."
        />
        <meta name="twitter:image" content={`${BASE_URL}/logo-with-text.png`} />
      </Head>

      {/* Structured Data */}
      <Script
        id="homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([structuredData, breadcrumbData]),
        }}
      />

      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm" role="banner">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.svg"
                  alt="Free Clouds - Secure Cloud Storage Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                  priority
                />
                <h1 className="text-2xl font-bold text-gray-900">
                  Free Clouds
                </h1>
              </div>
              <nav
                className="flex items-center gap-4"
                role="navigation"
                aria-label="Main navigation"
              >
                <a
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-3 py-2"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </a>
                <a
                  href="/register"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Create new account"
                >
                  Get Started
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section
          className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20"
          role="main"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Your Files,
                <span className="text-blue-600"> Anywhere</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Store, organize, and access your files securely in the cloud.
                Powered by Telegram&apos;s robust infrastructure with
                enterprise-grade security.
                <span className="block mt-2 text-lg">
                  🇻🇳{" "}
                  <em>
                    Lưu trữ an toàn, truy cập mọi lúc mọi nơi với Free Clouds
                  </em>
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/register"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Start using Free Clouds for free"
                >
                  Start for Free / Bắt Đầu Miễn Phí
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#features"
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Learn more about Free Clouds features"
                >
                  Learn More / Tìm Hiểu Thêm
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="py-20 bg-white"
          aria-labelledby="features-heading"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2
                id="features-heading"
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Everything you need for file storage
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Simple, secure, and reliable cloud storage with all the features
                you expect.
                <span className="block mt-2 text-lg text-gray-500">
                  <em>
                    Đơn giản, an toàn và đáng tin cậy với đầy đủ tính năng bạn
                    cần
                  </em>
                </span>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <article className="text-center p-6">
                <div
                  className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  aria-hidden="true"
                >
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Secure & Private
                </h3>
                <p className="text-gray-600 mb-2">
                  Your files are encrypted and stored securely. Only you have
                  access to your data.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Bảo mật và riêng tư tuyệt đối
                </p>
              </article>

              <article className="text-center p-6">
                <div
                  className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  aria-hidden="true"
                >
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Lightning Fast
                </h3>
                <p className="text-gray-600 mb-2">
                  Upload and download files at blazing speeds with our optimized
                  infrastructure.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Tốc độ nhanh như chớp
                </p>
              </article>

              <article className="text-center p-6">
                <div
                  className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  aria-hidden="true"
                >
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Easy Organization
                </h3>
                <p className="text-gray-600 mb-2">
                  Organize your files with folders and find what you need
                  quickly with search.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Tổ chức file dễ dàng
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="pricing-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2
                id="pricing-heading"
                className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
              >
                Simple, transparent pricing
              </h2>
              <p className="text-xl text-gray-600 mb-2">
                Start for free, upgrade when you need more.
              </p>
              <p className="text-lg text-gray-500 italic">
                Bắt đầu miễn phí, nâng cấp khi cần thiết
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-600">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Free Plan{" "}
                  <span className="text-lg text-gray-500">/ Gói Miễn Phí</span>
                </h3>
                <div className="text-4xl font-bold text-blue-600 mb-6">
                  $0<span className="text-lg text-gray-500">/month</span>
                </div>

                <ul className="space-y-4 mb-8 text-left max-w-sm mx-auto">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>50MB file size limit</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Unlimited folders</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Secure file storage</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>File organization</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Search functionality</span>
                  </li>
                </ul>

                <a
                  href="/register"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Start using Free Clouds for free"
                >
                  Get Started Free / Bắt Đầu Miễn Phí
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2
              id="cta-heading"
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Ready to get started?
            </h2>
            <p className="text-xl text-blue-100 mb-4">
              Join thousands of users who trust Free Clouds with their files.
            </p>
            <p className="text-lg text-blue-200 mb-8 italic">
              Tham gia cùng hàng nghìn người dùng tin tưởng Free Clouds
            </p>
            <a
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Create your Free Clouds account"
            >
              Create Account / Tạo Tài Khoản
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
