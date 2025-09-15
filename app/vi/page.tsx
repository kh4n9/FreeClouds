"use client";

import { useEffect, useState } from "react";
import { Shield, Zap, Users, ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import Head from "next/head";
import Script from "next/script";
import Footer from "../../components/Footer";
import { generateMetadata, generateWebApplicationStructuredData, generateBreadcrumbs } from "@/lib/seo/utils";
import { BASE_URL } from "@/lib/seo/config";

interface User {
  id: string;
  email: string;
  name: string;
}

export default function VietnameseHomePage() {
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

  const structuredData = generateWebApplicationStructuredData('vi');
  const breadcrumbData = generateBreadcrumbs([
    { name: 'Trang Chủ', url: '/vi' }
  ]);

  return (
    <>
      {/* Enhanced SEO Head */}
      <Head>
        <title>Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File</title>
        <meta name="description" content="Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp. Giới hạn file 50MB, thư mục không giới hạn." />
        <meta name="keywords" content="lưu trữ đám mây, chia sẻ file, lưu trữ miễn phí, telegram storage, tải file an toàn, lưu trữ trực tuyến, quản lý file, sao lưu đám mây" />
        <link rel="canonical" href={`${BASE_URL}/vi`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File" />
        <meta property="og:description" content="Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp." />
        <meta property="og:url" content={`${BASE_URL}/vi`} />
        <meta property="og:image" content={`${BASE_URL}/logo-with-text.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File" />
        <meta name="twitter:description" content="Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp." />
        <meta name="twitter:image" content={`${BASE_URL}/logo-with-text.png`} />
      </Head>

      {/* Structured Data */}
      <Script
        id="homepage-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([structuredData, breadcrumbData])
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
                  alt="Free Clouds - Logo Lưu Trữ Đám Mây An Toàn"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                  priority
                />
                <h1 className="text-2xl font-bold text-gray-900">Free Clouds</h1>
              </div>
              <nav className="flex items-center gap-4" role="navigation" aria-label="Điều hướng chính">
                <a
                  href="/vi/login"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-3 py-2"
                  aria-label="Đăng nhập vào tài khoản của bạn"
                >
                  Đăng Nhập
                </a>
                <a
                  href="/vi/register"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Tạo tài khoản mới"
                >
                  Bắt Đầu
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20" role="main">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                File Của Bạn,
                <span className="text-blue-600"> Mọi Nơi</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Lưu trữ, tổ chức và truy cập file của bạn một cách an toàn trên đám mây.
                Được hỗ trợ bởi hạ tầng mạnh mẽ của Telegram với bảo mật cấp doanh nghiệp.
                <span className="block mt-2 text-lg">
                  🇻🇳 <em>Made in Vietnam - Sản phẩm Việt Nam</em>
                </span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/vi/register"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Bắt đầu sử dụng Free Clouds miễn phí"
                >
                  Bắt Đầu Miễn Phí
                  <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#features"
                  className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Tìm hiểu thêm về tính năng Free Clouds"
                >
                  Tìm Hiểu Thêm
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-white" aria-labelledby="features-heading">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Mọi thứ bạn cần để lưu trữ file
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Lưu trữ đám mây đơn giản, an toàn và đáng tin cậy với đầy đủ tính năng bạn mong đợi.
                <span className="block mt-2 text-lg text-gray-500">
                  <em>Simple, secure, and reliable cloud storage with all the features you expect</em>
                </span>
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <article className="text-center p-6">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Bảo Mật & Riêng Tư
                </h3>
                <p className="text-gray-600 mb-2">
                  File của bạn được mã hóa và lưu trữ an toàn. Chỉ bạn mới có quyền truy cập dữ liệu của mình.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Secure & Private
                </p>
              </article>

              <article className="text-center p-6">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                  <Zap className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Tốc Độ Nhanh Chóng
                </h3>
                <p className="text-gray-600 mb-2">
                  Tải lên và tải xuống file với tốc độ nhanh như chớp nhờ hạ tầng được tối ưu hóa.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Lightning Fast
                </p>
              </article>

              <article className="text-center p-6">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                  <Users className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Tổ Chức Dễ Dàng
                </h3>
                <p className="text-gray-600 mb-2">
                  Tổ chức file với thư mục và tìm kiếm những gì bạn cần một cách nhanh chóng.
                </p>
                <p className="text-sm text-gray-500 italic">
                  Easy Organization
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-gray-50" aria-labelledby="pricing-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 id="pricing-heading" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Giá cả đơn giản, minh bạch
              </h2>
              <p className="text-xl text-gray-600 mb-2">
                Bắt đầu miễn phí, nâng cấp khi bạn cần thêm.
              </p>
              <p className="text-lg text-gray-500 italic">
                Start for free, upgrade when you need more
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-blue-600">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Gói Miễn Phí <span className="text-lg text-gray-500">/ Free Plan</span>
                </h3>
                <div className="text-4xl font-bold text-blue-600 mb-6">
                  0₫<span className="text-lg text-gray-500">/tháng</span>
                </div>

              <ul className="space-y-4 mb-8 text-left max-w-sm mx-auto">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Giới hạn file 50MB</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Thư mục không giới hạn</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Lưu trữ file an toàn</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Tổ chức file</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span>Chức năng tìm kiếm</span>
                </li>
              </ul>

                <a
                  href="/vi/register"
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg inline-block focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Bắt đầu sử dụng Free Clouds miễn phí"
                >
                  Bắt Đầu Miễn Phí
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600" aria-labelledby="cta-heading">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold text-white mb-4">
              Sẵn sàng bắt đầu?
            </h2>
            <p className="text-xl text-blue-100 mb-4">
              Tham gia cùng hàng nghìn người dùng tin tưởng Free Clouds với file của họ.
            </p>
            <p className="text-lg text-blue-200 mb-8 italic">
              Join thousands of users who trust Free Clouds with their files
            </p>
            <a
              href="/vi/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Tạo tài khoản Free Clouds của bạn"
            >
              Tạo Tài Khoản
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
