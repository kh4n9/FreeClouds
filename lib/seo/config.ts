export interface SEOConfig {
  title: string;
  description: string;
  keywords: string[];
  openGraph: {
    title: string;
    description: string;
    siteName: string;
  };
  twitter: {
    title: string;
    description: string;
  };
}

export interface LocalizedSEO {
  en: SEOConfig;
  vi: SEOConfig;
}

// Base URL configuration — canonical domain for SEO (sitemap, canonical, OG)
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.freeclouds.cloud";
export const SITE_NAME = "Free Clouds";

// SEO configurations for different languages
export const seoConfig: LocalizedSEO = {
  en: {
    title: "Free Clouds - Secure Cloud Storage & File Sharing",
    description:
      "Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security. 50MB file limit, unlimited folders, blazing-fast access.",
    keywords: [
      "cloud storage",
      "file sharing",
      "free storage",
      "telegram storage",
      "secure file upload",
      "online storage",
      "file management",
      "cloud backup",
      "file organization",
      "digital storage",
      "remote access",
      "file sync",
      "data storage",
      "document storage",
      "photo storage",
      "video storage",
      "file hosting",
      "cloud drive",
      "online backup",
      "file security",
    ],
    openGraph: {
      title: "Free Clouds - Secure Cloud Storage & File Sharing",
      description:
        "Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security.",
      siteName: "Free Clouds",
    },
    twitter: {
      title: "Free Clouds - Secure Cloud Storage & File Sharing",
      description:
        "Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security.",
    },
  },
  vi: {
    title: "Free Clouds - Lưu Trữ Đám Mây Miễn Phí, An Toàn & Chia Sẻ File",
    description:
      "Lưu trữ đám mây miễn phí bằng tiếng Việt, được hỗ trợ bởi Telegram. Tải lên, tổ chức, tìm kiếm và chia sẻ file với bảo mật cấp doanh nghiệp: xác thực JWT, chống CSRF, thư mục ẩn bảo vệ bằng mã PIN. Giới hạn file 50MB, thư mục không giới hạn, hỗ trợ WebDAV và xem trước file.",
    keywords: [
      "lưu trữ đám mây miễn phí",
      "cloud storage việt nam",
      "chia sẻ file an toàn",
      "lưu trữ file trực tuyến",
      "lưu trữ đám mây tiếng việt",
      "telegram cloud",
      "đám mây không giới hạn thư mục",
      "tải file lên an toàn",
      "quản lý file online",
      "sao lưu dữ liệu online",
      "lưu trữ ảnh trực tuyến",
      "lưu trữ video trực tuyến",
      "lưu trữ tài liệu online",
      "webdav cloud storage",
      "thư mục ẩn bảo mật",
      "dịch vụ lưu trữ đám mây",
      "trình quản lý file online",
      "backup dữ liệu đám mây",
      "download youtube trực tuyến",
      "lưu trữ dữ liệu an toàn",
      "chia sẻ file online",
      "cloud drive miễn phí",
      "lưu trữ dữ liệu doanh nghiệp",
      "đồng bộ file đa nền tảng",
      "xem trước file trực tuyến",
    ],
    openGraph: {
      title: "Free Clouds - Lưu Trữ Đám Mây Miễn Phí, An Toàn & Chia Sẻ File",
      description:
        "Lưu trữ đám mây miễn phí bằng tiếng Việt, được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp, thư mục ẩn bảo vệ bằng mã PIN.",
      siteName: "Free Clouds",
    },
    twitter: {
      title: "Free Clouds - Lưu Trữ Đám Mây Miễn Phí, An Toàn & Chia Sẻ File",
      description:
        "Lưu trữ đám mây miễn phí bằng tiếng Việt, được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp.",
    },
  },
};

// Breadcrumb structured data generator
export const generateBreadcrumbData = (
  items: Array<{ name: string; url: string }>,
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: `${BASE_URL}${item.url}`,
  })),
});
