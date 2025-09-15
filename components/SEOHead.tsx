"use client";

import Head from "next/head";
import Script from "next/script";
import {
  generateMetadata,
  generateWebApplicationStructuredData,
  generateBreadcrumbs,
} from "@/lib/seo/utils";
import { BASE_URL } from "@/lib/seo/config";
import type { Language, PageType } from "@/lib/seo/utils";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  language?: Language;
  page?: PageType;
  noIndex?: boolean;
  canonical?: string;
  breadcrumbs?: BreadcrumbItem[];
  structuredData?: any;
  additionalMetaTags?: Record<string, string>;
  hreflangLinks?: Array<{
    hrefLang: string;
    href: string;
  }>;
}

export default function SEOHead({
  title,
  description,
  keywords,
  image = `${BASE_URL}/logo-with-text.png`,
  url,
  language = "en",
  page,
  noIndex = false,
  canonical,
  breadcrumbs = [],
  structuredData,
  additionalMetaTags = {},
  hreflangLinks = [],
}: SEOHeadProps) {
  const metadata = generateMetadata({
    language,
    page,
    title,
    description,
    keywords,
    image,
    url,
    noIndex,
    canonical,
  });

  const webAppStructuredData = generateWebApplicationStructuredData(language);
  const breadcrumbData =
    breadcrumbs.length > 0 ? generateBreadcrumbs(breadcrumbs) : null;

  // Combine all structured data
  const allStructuredData = [
    webAppStructuredData,
    ...(breadcrumbData ? [breadcrumbData] : []),
    ...(structuredData ? [structuredData] : []),
  ].filter(Boolean);

  // Default hreflang links if not provided
  const defaultHreflangLinks =
    hreflangLinks.length > 0
      ? hreflangLinks
      : [
          {
            hrefLang: "en",
            href: `${BASE_URL}/en${url || ""}`,
          },
          {
            hrefLang: "vi",
            href: `${BASE_URL}/vi${url || ""}`,
          },
          {
            hrefLang: "x-default",
            href: `${BASE_URL}${url || ""}`,
          },
        ];

  return (
    <>
      <Head>
        {/* Primary Meta Tags */}
        <title>{metadata.title}</title>
        <meta name="title" content={metadata.title as string} />
        <meta name="description" content={metadata.description as string} />
        <meta
          name="keywords"
          content={(metadata.keywords as string[])?.join(", ")}
        />

        {/* Robots */}
        <meta name="robots" content={metadata.robots as string} />

        {/* Canonical URL */}
        {canonical && <link rel="canonical" href={canonical} />}

        {/* Language alternatives */}
        {defaultHreflangLinks.map((link) => (
          <link
            key={link.hrefLang}
            rel="alternate"
            hrefLang={link.hrefLang}
            href={link.href}
          />
        ))}

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url || BASE_URL} />
        <meta
          property="og:title"
          content={metadata.openGraph?.title as string}
        />
        <meta
          property="og:description"
          content={metadata.openGraph?.description as string}
        />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={metadata.title as string} />
        <meta
          property="og:site_name"
          content={metadata.openGraph?.siteName as string}
        />
        <meta
          property="og:locale"
          content={language === "vi" ? "vi_VN" : "en_US"}
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={url || BASE_URL} />
        <meta
          name="twitter:title"
          content={metadata.twitter?.title as string}
        />
        <meta
          name="twitter:description"
          content={metadata.twitter?.description as string}
        />
        <meta name="twitter:image" content={image} />
        <meta name="twitter:image:alt" content={metadata.title as string} />
        <meta name="twitter:creator" content="@freeclouds" />
        <meta name="twitter:site" content="@freeclouds" />

        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Free Clouds" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Author and Publisher */}
        <meta name="author" content="Hoàng Minh Khang" />
        <meta name="creator" content="Hoàng Minh Khang" />
        <meta name="publisher" content="Free Clouds" />

        {/* Additional custom meta tags */}
        {Object.entries(additionalMetaTags).map(([name, content]) => (
          <meta key={name} name={name} content={content} />
        ))}

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="//api.telegram.org" />
        <link rel="dns-prefetch" href="//mongodb.com" />

        {/* Favicons */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      {/* Structured Data */}
      {allStructuredData.length > 0 && (
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              allStructuredData.length === 1
                ? allStructuredData[0]
                : allStructuredData,
            ),
          }}
        />
      )}
    </>
  );
}

// Specialized SEO components for different page types
export function HomePageSEO({ language = "en" }: { language?: Language }) {
  return (
    <SEOHead
      title={
        language === "vi"
          ? "Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File"
          : "Free Clouds - Secure Cloud Storage & File Sharing Platform"
      }
      description={
        language === "vi"
          ? "Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp. Giới hạn file 50MB, thư mục không giới hạn."
          : "Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security. 50MB file limit, unlimited folders, blazing-fast access."
      }
      language={language}
      url={BASE_URL}
      breadcrumbs={[
        { name: language === "vi" ? "Trang Chủ" : "Home", url: "/" },
      ]}
    />
  );
}

export function LoginPageSEO({ language = "en" }: { language?: Language }) {
  return (
    <SEOHead
      title={
        language === "vi"
          ? "Đăng Nhập - Free Clouds | Truy Cập Lưu Trữ Đám Mây An Toàn"
          : "Sign In - Free Clouds | Secure Cloud Storage Login"
      }
      description={
        language === "vi"
          ? "Đăng nhập vào tài khoản Free Clouds và truy cập lưu trữ đám mây an toàn. Quản lý file nhanh chóng, đáng tin cậy và bảo mật."
          : "Sign in to your Free Clouds account and access your secure cloud storage. Fast, reliable, and secure file management with enterprise-grade security."
      }
      language={language}
      page="login"
      url={`${BASE_URL}/login`}
      noIndex={true}
      breadcrumbs={[
        { name: language === "vi" ? "Trang Chủ" : "Home", url: "/" },
        { name: language === "vi" ? "Đăng Nhập" : "Sign In", url: "/login" },
      ]}
    />
  );
}

export function RegisterPageSEO({ language = "en" }: { language?: Language }) {
  return (
    <SEOHead
      title={
        language === "vi"
          ? "Tạo Tài Khoản - Free Clouds | Đăng Ký Lưu Trữ Đám Mây Miễn Phí"
          : "Create Account - Free Clouds | Free Cloud Storage Registration"
      }
      description={
        language === "vi"
          ? "Tạo tài khoản Free Clouds miễn phí và bắt đầu lưu trữ file an toàn. Nhận giới hạn file 50MB và thư mục không giới hạn."
          : "Create your free Free Clouds account and start storing files securely. Get 50MB file limit and unlimited folders with enterprise-grade security."
      }
      language={language}
      page="register"
      url={`${BASE_URL}/register`}
      breadcrumbs={[
        { name: language === "vi" ? "Trang Chủ" : "Home", url: "/" },
        { name: language === "vi" ? "Đăng Ký" : "Sign Up", url: "/register" },
      ]}
    />
  );
}

export function DashboardPageSEO({ language = "en" }: { language?: Language }) {
  return (
    <SEOHead
      title={
        language === "vi"
          ? "Bảng Điều Khiển - Free Clouds | Quản Lý File Đám Mây"
          : "Dashboard - Free Clouds | Cloud File Management"
      }
      description={
        language === "vi"
          ? "Quản lý file và thư mục trong bảng điều khiển Free Clouds. Tải lên, tổ chức và truy cập file từ mọi nơi."
          : "Manage your files and folders in Free Clouds dashboard. Upload, organize, and access your files from anywhere with secure cloud storage."
      }
      language={language}
      page="dashboard"
      url={`${BASE_URL}/dashboard`}
      noIndex={true}
      breadcrumbs={[
        { name: language === "vi" ? "Trang Chủ" : "Home", url: "/" },
        {
          name: language === "vi" ? "Bảng Điều Khiển" : "Dashboard",
          url: "/dashboard",
        },
      ]}
    />
  );
}

export function ForgotPasswordPageSEO({
  language = "en",
}: {
  language?: Language;
}) {
  return (
    <SEOHead
      title={
        language === "vi"
          ? "Đặt Lại Mật Khẩu - Free Clouds | Khôi Phục Tài Khoản"
          : "Reset Password - Free Clouds | Account Recovery"
      }
      description={
        language === "vi"
          ? "Đặt lại mật khẩu tài khoản Free Clouds một cách an toàn. Khôi phục quyền truy cập vào file của bạn nhanh chóng và bảo mật."
          : "Reset your Free Clouds account password securely. Recover access to your files quickly and safely with our secure password recovery system."
      }
      language={language}
      page="forgotPassword"
      url={`${BASE_URL}/forgot-password`}
      noIndex={true}
      breadcrumbs={[
        { name: language === "vi" ? "Trang Chủ" : "Home", url: "/" },
        {
          name: language === "vi" ? "Đặt Lại Mật Khẩu" : "Reset Password",
          url: "/forgot-password",
        },
      ]}
    />
  );
}
