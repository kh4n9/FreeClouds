"use client";

import { useState, useEffect } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
  },
  {
    code: "vi",
    name: "Vietnamese",
    nativeName: "Tiếng Việt",
    flag: "🇻🇳",
  },
];

interface LanguageSwitcherProps {
  className?: string;
  showText?: boolean;
  variant?: "default" | "compact" | "icon-only";
}

export default function LanguageSwitcher({
  className = "",
  showText = true,
  variant = "default",
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(
    () => languages[0]!,
  );
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Detect current language from pathname
    const pathLang = pathname.startsWith("/vi") ? "vi" : "en";
    const lang: Language =
      languages.find((l) => l.code === pathLang) || languages[0]!;
    setCurrentLanguage(lang);
  }, [pathname]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".language-switcher")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    setIsOpen(false);

    // Get current path without language prefix
    let newPath = pathname;
    if (pathname.startsWith("/en") || pathname.startsWith("/vi")) {
      newPath = pathname.substring(3) || "/";
    }

    // Add new language prefix
    const finalPath =
      language.code === "en" ? newPath : `/${language.code}${newPath}`;

    // Store language preference
    localStorage.setItem("preferred-language", language.code);

    // Navigate to new path
    router.push(finalPath);
  };

  const getButtonClasses = () => {
    const baseClasses =
      "flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-md";

    switch (variant) {
      case "compact":
        return `${baseClasses} px-2 py-1 text-sm hover:bg-slate-800/50`;
      case "icon-only":
        return `${baseClasses} p-2 hover:bg-slate-800/50`;
      default:
        return `${baseClasses} px-3 py-2 hover:bg-slate-800/50`;
    }
  };

  const getDropdownClasses = () => {
    const baseClasses =
      "absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/20 z-50 min-w-max";

    switch (variant) {
      case "compact":
      case "icon-only":
        return `${baseClasses} py-1`;
      default:
        return `${baseClasses} py-2`;
    }
  };

  if (variant === "icon-only") {
    return (
      <div className={`relative language-switcher ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={getButtonClasses()}
          aria-label={`Change language. Current: ${currentLanguage.nativeName}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span
            className="text-lg"
            role="img"
            aria-label={`${currentLanguage.name} flag`}
          >
            {currentLanguage.flag}
          </span>
        </button>

        {isOpen && (
          <div className={getDropdownClasses()}>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                  currentLanguage.code === language.code
                    ? "bg-indigo-500/10 text-indigo-400 font-medium"
                    : "text-slate-300"
                }`}
                aria-label={`Switch to ${language.nativeName}`}
              >
                <span
                  className="text-base"
                  role="img"
                  aria-label={`${language.name} flag`}
                >
                  {language.flag}
                </span>
                <span>{language.nativeName}</span>
                {currentLanguage.code === language.code && (
                  <span className="ml-auto text-indigo-400">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative language-switcher ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonClasses()}
        aria-label={`Change language. Current: ${currentLanguage.nativeName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {variant !== "compact" && (
          <Globe className="w-4 h-4 text-slate-400" aria-hidden="true" />
        )}
        <span
          className="text-base"
          role="img"
          aria-label={`${currentLanguage.name} flag`}
        >
          {currentLanguage.flag}
        </span>
        {showText && (
          <span
            className={`${variant === "compact" ? "text-sm" : "text-sm"} font-medium text-slate-200`}
          >
            {variant === "compact"
              ? currentLanguage.code.toUpperCase()
              : currentLanguage.nativeName}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className={getDropdownClasses()}>
          <div className="px-3 py-2 border-b border-slate-700">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Select Language
            </p>
          </div>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-700/50 transition-colors ${
                currentLanguage.code === language.code
                  ? "bg-indigo-500/10 text-indigo-400 font-medium"
                  : "text-slate-300"
              }`}
              aria-label={`Switch to ${language.nativeName}`}
            >
              <span
                className="text-base"
                role="img"
                aria-label={`${language.name} flag`}
              >
                {language.flag}
              </span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-slate-500">{language.name}</span>
              </div>
              {currentLanguage.code === language.code && (
                <span className="ml-auto text-indigo-400 font-medium">✓</span>
              )}
            </button>
          ))}

          {/* Language preference note */}
          <div className="px-3 py-2 border-t border-slate-700">
            <p className="text-xs text-slate-500">
              Language preference is saved automatically
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook for getting current language
export function useCurrentLanguage() {
  const pathname = usePathname();
  const [currentLang, setCurrentLang] = useState<string>("en");

  useEffect(() => {
    const pathLang = pathname.startsWith("/vi") ? "vi" : "en";
    setCurrentLang(pathLang);
  }, [pathname]);

  return currentLang;
}

// Hook for getting localized text
export function useTranslation() {
  const currentLang = useCurrentLanguage();

  const t = (key: string, translations: Record<string, string>) => {
    return translations[currentLang] || translations["en"] || key;
  };

  return { t, currentLang };
}

// Common translations
export const commonTranslations = {
  // Navigation
  home: { en: "Home", vi: "Trang Chủ" },
  login: { en: "Sign In", vi: "Đăng Nhập" },
  register: { en: "Sign Up", vi: "Đăng Ký" },
  logout: { en: "Sign Out", vi: "Đăng Xuất" },
  dashboard: { en: "Dashboard", vi: "Bảng Điều Khiển" },
  settings: { en: "Settings", vi: "Cài Đặt" },

  // Actions
  upload: { en: "Upload", vi: "Tải Lên" },
  download: { en: "Download", vi: "Tải Xuống" },
  delete: { en: "Delete", vi: "Xóa" },
  save: { en: "Save", vi: "Lưu" },
  cancel: { en: "Cancel", vi: "Hủy" },
  confirm: { en: "Confirm", vi: "Xác Nhận" },
  preview: { en: "Preview", vi: "Xem trước" },
  dismiss: { en: "Dismiss", vi: "Đóng" },

  // File management
  files: { en: "Files", vi: "Tệp Tin" },
  folders: { en: "Folders", vi: "Thư Mục" },
  newFolder: { en: "New Folder", vi: "Thư Mục Mới" },
  rename: { en: "Rename", vi: "Đổi Tên" },
  allFiles: { en: "All Files", vi: "Tất cả tệp" },
  noFoldersYet: { en: "No folders yet", vi: "Chưa có thư mục nào" },

  // Messages
  loading: { en: "Loading...", vi: "Đang tải..." },
  error: { en: "Error", vi: "Lỗi" },
  success: { en: "Success", vi: "Thành Công" },
  noResults: { en: "No results found", vi: "Không tìm thấy kết quả" },
  cannotUndo: {
    en: "This action cannot be undone.",
    vi: "Hành động này không thể hoàn tác.",
  },
  deleteFolderConfirm: {
    en: "You are about to permanently delete the folder",
    vi: "Bạn sắp vĩnh viễn xóa thư mục",
  },
  deleteFileConfirm: {
    en: "You are about to permanently delete the file",
    vi: "Bạn sắp vĩnh viễn xóa tệp tin",
  },

  // Forms
  email: { en: "Email", vi: "Email" },
  password: { en: "Password", vi: "Mật Khẩu" },
  confirmPassword: { en: "Confirm Password", vi: "Xác Nhận Mật Khẩu" },
  name: { en: "Name", vi: "Tên" },

  // File types
  image: { en: "Image", vi: "Hình Ảnh" },
  video: { en: "Video", vi: "Video" },
  audio: { en: "Audio", vi: "Âm Thanh" },
  document: { en: "Document", vi: "Tài Liệu" },
  archive: { en: "Archive", vi: "Tệp Nén" },

  // Time
  today: { en: "Today", vi: "Hôm Nay" },
  yesterday: { en: "Yesterday", vi: "Hôm Qua" },
  thisWeek: { en: "This Week", vi: "Tuần Này" },
  lastWeek: { en: "Last Week", vi: "Tuần Trước" },
  thisMonth: { en: "This Month", vi: "Tháng Này" },

  // Storage
  storage: { en: "Storage", vi: "Lưu Trữ" },
  storageUsed: { en: "Storage Used", vi: "Đã Sử Dụng" },
  storageRemaining: { en: "Remaining", vi: "Còn Lại" },
  unlimited: { en: "Unlimited", vi: "Không Giới Hạn" },

  // Additional small labels
  previewFile: { en: "Preview file", vi: "Xem trước tệp" },

  // Preview controls
  zoomIn: { en: "Zoom In", vi: "Phóng to" },
  zoomOut: { en: "Zoom Out", vi: "Thu nhỏ" },
  rotate: { en: "Rotate", vi: "Xoay" },
  resetView: { en: "Reset", vi: "Đặt lại" },
  fullscreen: { en: "Fullscreen", vi: "Toàn màn hình" },
  previousPage: { en: "Previous Page", vi: "Trang trước" },
  nextPage: { en: "Next Page", vi: "Trang sau" },
  openInNewTab: { en: "Open in New Tab", vi: "Mở trong tab mới" },

  // Media controls
  play: { en: "Play", vi: "Phát" },
  pause: { en: "Pause", vi: "Tạm dừng" },
  mute: { en: "Mute", vi: "Tắt tiếng" },
  unmute: { en: "Unmute", vi: "Bật tiếng" },

  // Preview errors / warnings
  fileTooLargeForPreview: {
    en: "File is too large for preview. Maximum size: {size}",
    vi: "Tệp quá lớn để xem trước. Kích thước tối đa: {size}",
  },
  cannotPreviewFile: {
    en: "This file type cannot be previewed.",
    vi: "Loại tệp này không thể xem trước.",
  },
  failedToLoadFile: {
    en: "Failed to load file for preview.",
    vi: "Tải tệp để xem trước thất bại.",
  },
  securityWarningExecutable: {
    en: "This file type may contain executable code and cannot be previewed for security reasons.",
    vi: "Loại tệp này có thể chứa mã thực thi và không thể xem trước vì lý do bảo mật.",
  },

  // User profile / settings translations
  userSettings: { en: "User Settings", vi: "Cài đặt người dùng" },
  profileTab: { en: "Profile", vi: "Hồ sơ" },
  passwordTab: { en: "Password", vi: "Mật khẩu" },
  accountTab: { en: "Account", vi: "Tài khoản" },

  // Profile form
  fullName: { en: "Full Name", vi: "Họ và tên" },
  enterFullName: { en: "Enter your full name", vi: "Nhập họ và tên của bạn" },
  emailAddress: { en: "Email Address", vi: "Địa chỉ Email" },
  enterEmailAddress: {
    en: "Enter your email address",
    vi: "Nhập địa chỉ email của bạn",
  },

  // Password / account messages
  profileUpdated: {
    en: "Profile updated successfully!",
    vi: "Cập nhật hồ sơ thành công!",
  },
  passwordChanged: {
    en: "Password changed successfully!",
    vi: "Đổi mật khẩu thành công!",
  },

  // Account deletion / verification
  verificationCodeSent: {
    en: "Verification code sent to your email",
    vi: "Mã xác nhận đã được gửi đến email của bạn",
  },
  enter6DigitCode: {
    en: "Please enter the 6-digit verification code",
    vi: "Vui lòng nhập mã xác minh 6 chữ số",
  },
  newVerificationCodeSent: {
    en: "New verification code sent!",
    vi: "Đã gửi mã xác minh mới!",
  },
  resendCode: { en: "Resend code", vi: "Gửi lại mã" },
  confirmDeletion: {
    en: "Confirm account deletion",
    vi: "Xác nhận xóa tài khoản",
  },
  deleteAccount: { en: "Delete account", vi: "Xóa tài khoản" },
};
