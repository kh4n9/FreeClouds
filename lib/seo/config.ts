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
    title: "Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File",
    description:
      "Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp. Giới hạn file 50MB, thư mục không giới hạn.",
    keywords: [
      "lưu trữ đám mây",
      "chia sẻ file",
      "lưu trữ miễn phí",
      "telegram storage",
      "tải file an toàn",
      "lưu trữ trực tuyến",
      "quản lý file",
      "sao lưu đám mây",
      "tổ chức file",
      "lưu trữ kỹ thuật số",
      "truy cập từ xa",
      "đồng bộ file",
      "lưu trữ dữ liệu",
      "lưu trữ tài liệu",
      "lưu trữ ảnh",
      "lưu trữ video",
      "hosting file",
      "ổ đĩa đám mây",
      "sao lưu trực tuyến",
      "bảo mật file",
      "cloud storage việt nam",
      "lưu trữ file miễn phí",
      "chia sẻ file an toàn",
      "quản lý tài liệu",
    ],
    openGraph: {
      title: "Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File",
      description:
        "Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp.",
      siteName: "Free Clouds",
    },
    twitter: {
      title: "Free Clouds - Lưu Trữ Đám Mây An Toàn & Chia Sẻ File",
      description:
        "Lưu trữ đám mây miễn phí và bảo mật được hỗ trợ bởi Telegram. Tải lên, tổ chức và chia sẻ file với bảo mật cấp doanh nghiệp.",
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
