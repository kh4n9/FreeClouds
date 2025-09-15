import { Metadata } from "next";
import {
  seoConfig,
  pagesSEO,
  structuredData,
  generateBreadcrumbData,
  BASE_URL,
  SITE_NAME,
} from "./config";

export type Language = "en" | "vi";
export type PageType = "login" | "register" | "dashboard" | "forgotPassword";

interface GenerateMetadataProps {
  language?: Language;
  page?: PageType;
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noIndex?: boolean;
  canonical?: string;
}

export function generateMetadata({
  language = "en",
  page,
  title,
  description,
  keywords,
  image = `${BASE_URL}/logo-with-text.png`,
  url = BASE_URL,
  noIndex = false,
  canonical,
}: GenerateMetadataProps = {}): Metadata {
  const config = seoConfig[language];
  const pageConfig = page ? pagesSEO[language][page] : null;

  const finalTitle = title || pageConfig?.title || config.title;
  const finalDescription =
    description || pageConfig?.description || config.description;
  const finalKeywords = keywords || config.keywords;

  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    authors: [{ name: "Free Clouds Team" }, { name: "Hoàng Minh Khang" }],
    creator: "Hoàng Minh Khang",
    publisher: "Free Clouds",
    robots: noIndex ? "noindex, nofollow" : "index, follow",

    // Canonical URL
    alternates: canonical
      ? {
          canonical: canonical,
        }
      : null,

    // Open Graph
    openGraph: {
      type: "website",
      locale: language === "vi" ? "vi_VN" : "en_US",
      url: url,
      title: finalTitle,
      description: finalDescription,
      siteName: SITE_NAME,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: finalTitle,
        },
      ],
    },

    // Twitter
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      images: [image],
      creator: "@freeclouds",
      site: "@freeclouds",
    },

    // Additional meta tags
    other: {
      "theme-color": "#3b82f6",
      "msapplication-TileColor": "#3b82f6",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "format-detection": "telephone=no",
    },

    // Verification tags (add your verification codes)
    verification: {
      // google: 'your-google-verification-code',
      // yandex: 'your-yandex-verification-code',
      // bing: 'your-bing-verification-code',
    },
  };
}

export function generateStructuredData(language: Language = "en") {
  const config = seoConfig[language];

  return {
    ...structuredData,
    name: language === "vi" ? "Free Clouds - Lưu Trữ Đám Mây" : "Free Clouds",
    description: config.description,
    inLanguage: language === "vi" ? "vi-VN" : "en-US",
  };
}

export function generateWebApplicationStructuredData(
  language: Language = "en",
) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: language === "vi" ? "Free Clouds - Lưu Trữ Đám Mây" : "Free Clouds",
    url: BASE_URL,
    description: seoConfig[language].description,
    applicationCategory: "ProductivityApplication",
    operatingSystem: "Web Browser, Windows, macOS, Linux, iOS, Android",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    permissions: "Read/Write access to files",
    inLanguage: language === "vi" ? "vi-VN" : "en-US",

    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },

    featureList:
      language === "vi"
        ? [
            "Lưu trữ đám mây",
            "Chia sẻ file",
            "Tổ chức file",
            "Tải lên bảo mật",
            "Truy cập đa nền tảng",
            "Quản lý thư mục",
            "Xem trước file",
            "Tìm kiếm file",
          ]
        : [
            "Cloud Storage",
            "File Sharing",
            "File Organization",
            "Secure Upload",
            "Cross-platform Access",
            "Folder Management",
            "File Preview",
            "File Search",
          ],

    screenshot: `${BASE_URL}/screenshots/dashboard-main.png`,

    author: {
      "@type": "Person",
      name: "Hoàng Minh Khang",
      url: "https://github.com/hoangminhkhang",
    },

    publisher: {
      "@type": "Organization",
      name: "Free Clouds",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/logo-with-text.png`,
        width: 400,
        height: 400,
      },
    },
  };
}

export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Free Clouds",
    url: BASE_URL,
    logo: `${BASE_URL}/logo-with-text.png`,
    description: "Free secure cloud storage and file sharing platform",
    foundingDate: "2024",

    founder: {
      "@type": "Person",
      name: "Hoàng Minh Khang",
    },

    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      availableLanguage: ["English", "Vietnamese"],
    },

    sameAs: [
      // Add social media URLs when available
      // 'https://twitter.com/freeclouds',
      // 'https://facebook.com/freeclouds',
      // 'https://github.com/hoangminhkhang/free-clouds'
    ],
  };
}

export function generateBreadcrumbs(
  items: Array<{ name: string; url: string }>,
) {
  return generateBreadcrumbData(items);
}

export function generateHreflangLinks(currentPath: string = "") {
  return [
    {
      rel: "alternate",
      hrefLang: "en",
      href: `${BASE_URL}/en${currentPath}`,
    },
    {
      rel: "alternate",
      hrefLang: "vi",
      href: `${BASE_URL}/vi${currentPath}`,
    },
    {
      rel: "alternate",
      hrefLang: "x-default",
      href: `${BASE_URL}${currentPath}`,
    },
  ];
}

export function detectLanguageFromPath(pathname: string): Language {
  if (pathname.startsWith("/vi")) return "vi";
  return "en";
}

export function getLocalizedPath(pathname: string, language: Language): string {
  // Remove existing language prefix
  const cleanPath = pathname.replace(/^\/(en|vi)/, "");

  // Add new language prefix
  if (language === "vi") {
    return `/vi${cleanPath}`;
  }

  return cleanPath || "/";
}

// SEO-friendly URL generation
export function generateSEOUrl(
  title: string,
  language: Language = "en",
): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// Social media meta tags
export function generateSocialMetaTags(
  title: string,
  description: string,
  image: string = `${BASE_URL}/logo-with-text.png`,
  url: string = BASE_URL,
) {
  return {
    // Facebook Open Graph
    "og:type": "website",
    "og:title": title,
    "og:description": description,
    "og:image": image,
    "og:url": url,
    "og:site_name": SITE_NAME,

    // Twitter
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": image,
    "twitter:site": "@freeclouds",
    "twitter:creator": "@freeclouds",

    // LinkedIn
    "linkedin:owner": "Free Clouds",

    // Telegram
    "telegram:channel": "@freeclouds",
  };
}

export function generateRobotsTxt(language: Language = "en"): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /_next/

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-${language}.xml

# Crawl delay
Crawl-delay: 1`;
}
