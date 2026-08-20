import { Metadata } from "next";
import {
  seoConfig,
  generateBreadcrumbData,
  BASE_URL,
  SITE_NAME,
} from "./config";

export type Language = "en" | "vi";

interface GenerateMetadataProps {
  language?: Language;
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noIndex?: boolean;
  canonical?: string;
  alternates?: Metadata["alternates"];
}

export function generateMetadata({
  language = "en",
  title,
  description,
  keywords,
  image,
  url = BASE_URL,
  noIndex = false,
  canonical,
  alternates,
}: GenerateMetadataProps = {}): Metadata {
  const config = seoConfig[language];

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalKeywords = keywords || config.keywords;

  const verification: NonNullable<Metadata["verification"]> = {};
  const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
  const bing = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;
  const yandex = process.env.NEXT_PUBLIC_YANDEX_VERIFICATION;
  if (google) verification.google = google;
  if (bing) verification.other = { ...(verification.other || {}), "msvalidate.01": bing };
  if (yandex) verification.yandex = yandex;

  return {
    metadataBase: new URL(BASE_URL),
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    authors: [{ name: "Free Clouds Team" }, { name: "Hoàng Minh Khang" }],
    creator: "Hoàng Minh Khang",
    publisher: "Free Clouds",
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: canonical
      ? {
          canonical: canonical,
          ...(alternates ? { languages: alternates.languages } : {}),
        }
      : alternates || null,

    // Open Graph
    openGraph: {
      type: "website",
      locale: language === "vi" ? "vi_VN" : "en_US",
      url: url,
      title: finalTitle,
      description: finalDescription,
      siteName: SITE_NAME,
      ...(image
        ? {
            images: [
              {
                url: image,
                width: 1200,
                height: 630,
                alt: finalTitle,
              },
            ],
          }
        : {}),
    },

    // Twitter
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description: finalDescription,
      ...(image ? { images: [image] } : {}),
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
      ...(language === "vi"
        ? {
            "geo.region": "VN-HN",
            "geo.placename": "Vietnam",
            "og:locale:alternate": "en_US",
          }
        : { "og:locale:alternate": "vi_VN" }),
    },

    // Verification tags (configure via NEXT_PUBLIC_* env vars)
    verification:
      Object.keys(verification).length > 0 ? verification : undefined,
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
  };
}

export function generateBreadcrumbs(
  items: Array<{ name: string; url: string }>,
) {
  return generateBreadcrumbData(items);
}
