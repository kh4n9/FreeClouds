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

// Base URL configuration
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://free-clouds.vercel.app";
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

// Page-specific SEO configurations
export const pagesSEO = {
  en: {
    login: {
      title: "Sign In - Free Clouds",
      description:
        "Sign in to your Free Clouds account and access your secure cloud storage. Fast, reliable, and secure file management.",
    },
    register: {
      title: "Create Account - Free Clouds",
      description:
        "Create your free Free Clouds account and start storing files securely. Get 50MB file limit and unlimited folders.",
    },
    dashboard: {
      title: "Dashboard - Free Clouds",
      description:
        "Manage your files and folders in Free Clouds dashboard. Upload, organize, and access your files from anywhere.",
    },
    forgotPassword: {
      title: "Reset Password - Free Clouds",
      description:
        "Reset your Free Clouds account password securely. Get back to your files quickly and safely.",
    },
  },
  vi: {
    login: {
      title: "Đăng Nhập - Free Clouds",
      description:
        "Đăng nhập vào tài khoản Free Clouds và truy cập lưu trữ đám mây an toàn. Quản lý file nhanh chóng, đáng tin cậy và bảo mật.",
    },
    register: {
      title: "Tạo Tài Khoản - Free Clouds",
      description:
        "Tạo tài khoản Free Clouds miễn phí và bắt đầu lưu trữ file an toàn. Nhận giới hạn file 50MB và thư mục không giới hạn.",
    },
    dashboard: {
      title: "Bảng Điều Khiển - Free Clouds",
      description:
        "Quản lý file và thư mục trong bảng điều khiển Free Clouds. Tải lên, tổ chức và truy cập file từ mọi nơi.",
    },
    forgotPassword: {
      title: "Đặt Lại Mật Khẩu - Free Clouds",
      description:
        "Đặt lại mật khẩu tài khoản Free Clouds một cách an toàn. Quay lại với file của bạn nhanh chóng và an toàn.",
    },
  },
};

// Structured data for JSON-LD
export const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free Clouds",
  url: BASE_URL,
  applicationCategory: "Productivity",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Cloud Storage",
    "File Sharing",
    "File Organization",
    "Secure Upload",
    "Cross-platform Access",
  ],
  screenshot: `${BASE_URL}/screenshots/dashboard-main.png`,
  author: {
    "@type": "Person",
    name: "Hoàng Minh Khang",
  },
  publisher: {
    "@type": "Organization",
    name: "Free Clouds",
    logo: {
      "@type": "ImageObject",
      url: `${BASE_URL}/logo-with-text.png`,
    },
  },
  description:
    "Free secure cloud storage and file sharing platform powered by Telegram API",
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
