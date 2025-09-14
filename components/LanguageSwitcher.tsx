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
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳'
  }
];

interface LanguageSwitcherProps {
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'compact' | 'icon-only';
}

export default function LanguageSwitcher({
  className = "",
  showText = true,
  variant = 'default'
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Detect current language from pathname
    const pathLang = pathname.startsWith('/vi') ? 'vi' : 'en';
    const lang = languages.find(l => l.code === pathLang) || languages[0];
    setCurrentLanguage(lang);
  }, [pathname]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.language-switcher')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    setIsOpen(false);

    // Get current path without language prefix
    let newPath = pathname;
    if (pathname.startsWith('/en') || pathname.startsWith('/vi')) {
      newPath = pathname.substring(3) || '/';
    }

    // Add new language prefix
    const finalPath = language.code === 'en' ? newPath : `/${language.code}${newPath}`;

    // Store language preference
    localStorage.setItem('preferred-language', language.code);

    // Navigate to new path
    router.push(finalPath);
  };

  const getButtonClasses = () => {
    const baseClasses = "flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md";

    switch (variant) {
      case 'compact':
        return `${baseClasses} px-2 py-1 text-sm hover:bg-gray-100`;
      case 'icon-only':
        return `${baseClasses} p-2 hover:bg-gray-100`;
      default:
        return `${baseClasses} px-3 py-2 hover:bg-gray-100`;
    }
  };

  const getDropdownClasses = () => {
    const baseClasses = "absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-max";

    switch (variant) {
      case 'compact':
      case 'icon-only':
        return `${baseClasses} py-1`;
      default:
        return `${baseClasses} py-2`;
    }
  };

  if (variant === 'icon-only') {
    return (
      <div className={`relative language-switcher ${className}`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={getButtonClasses()}
          aria-label={`Change language. Current: ${currentLanguage.nativeName}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <span className="text-lg" role="img" aria-label={`${currentLanguage.name} flag`}>
            {currentLanguage.flag}
          </span>
        </button>

        {isOpen && (
          <div className={getDropdownClasses()}>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                  currentLanguage.code === language.code
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700'
                }`}
                aria-label={`Switch to ${language.nativeName}`}
              >
                <span className="text-base" role="img" aria-label={`${language.name} flag`}>
                  {language.flag}
                </span>
                <span>{language.nativeName}</span>
                {currentLanguage.code === language.code && (
                  <span className="ml-auto text-blue-600">✓</span>
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
        {variant !== 'compact' && (
          <Globe className="w-4 h-4 text-gray-500" aria-hidden="true" />
        )}
        <span className="text-base" role="img" aria-label={`${currentLanguage.name} flag`}>
          {currentLanguage.flag}
        </span>
        {showText && (
          <span className={`${variant === 'compact' ? 'text-sm' : 'text-sm'} font-medium text-gray-700`}>
            {variant === 'compact' ? currentLanguage.code.toUpperCase() : currentLanguage.nativeName}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={getDropdownClasses()}>
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Select Language
            </p>
          </div>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                currentLanguage.code === language.code
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700'
              }`}
              aria-label={`Switch to ${language.nativeName}`}
            >
              <span className="text-base" role="img" aria-label={`${language.name} flag`}>
                {language.flag}
              </span>
              <div className="flex flex-col items-start">
                <span className="font-medium">{language.nativeName}</span>
                <span className="text-xs text-gray-500">{language.name}</span>
              </div>
              {currentLanguage.code === language.code && (
                <span className="ml-auto text-blue-600 font-medium">✓</span>
              )}
            </button>
          ))}

          {/* Language preference note */}
          <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
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
  const [currentLang, setCurrentLang] = useState<string>('en');

  useEffect(() => {
    const pathLang = pathname.startsWith('/vi') ? 'vi' : 'en';
    setCurrentLang(pathLang);
  }, [pathname]);

  return currentLang;
}

// Hook for getting localized text
export function useTranslation() {
  const currentLang = useCurrentLanguage();

  const t = (key: string, translations: Record<string, string>) => {
    return translations[currentLang] || translations['en'] || key;
  };

  return { t, currentLang };
}

// Common translations
export const commonTranslations = {
  // Navigation
  home: { en: 'Home', vi: 'Trang Chủ' },
  login: { en: 'Sign In', vi: 'Đăng Nhập' },
  register: { en: 'Sign Up', vi: 'Đăng Ký' },
  logout: { en: 'Sign Out', vi: 'Đăng Xuất' },
  dashboard: { en: 'Dashboard', vi: 'Bảng Điều Khiển' },
  settings: { en: 'Settings', vi: 'Cài Đặt' },

  // Actions
  upload: { en: 'Upload', vi: 'Tải Lên' },
  download: { en: 'Download', vi: 'Tải Xuống' },
  delete: { en: 'Delete', vi: 'Xóa' },
  save: { en: 'Save', vi: 'Lưu' },
  cancel: { en: 'Cancel', vi: 'Hủy' },
  confirm: { en: 'Confirm', vi: 'Xác Nhận' },

  // File management
  files: { en: 'Files', vi: 'Tệp Tin' },
  folders: { en: 'Folders', vi: 'Thư Mục' },
  newFolder: { en: 'New Folder', vi: 'Thư Mục Mới' },
  rename: { en: 'Rename', vi: 'Đổi Tên' },

  // Messages
  loading: { en: 'Loading...', vi: 'Đang tải...' },
  error: { en: 'Error', vi: 'Lỗi' },
  success: { en: 'Success', vi: 'Thành Công' },
  noResults: { en: 'No results found', vi: 'Không tìm thấy kết quả' },

  // Forms
  email: { en: 'Email', vi: 'Email' },
  password: { en: 'Password', vi: 'Mật Khẩu' },
  confirmPassword: { en: 'Confirm Password', vi: 'Xác Nhận Mật Khẩu' },
  name: { en: 'Name', vi: 'Tên' },

  // File types
  image: { en: 'Image', vi: 'Hình Ảnh' },
  video: { en: 'Video', vi: 'Video' },
  audio: { en: 'Audio', vi: 'Âm Thanh' },
  document: { en: 'Document', vi: 'Tài Liệu' },
  archive: { en: 'Archive', vi: 'Tệp Nén' },

  // Time
  today: { en: 'Today', vi: 'Hôm Nay' },
  yesterday: { en: 'Yesterday', vi: 'Hôm Qua' },
  thisWeek: { en: 'This Week', vi: 'Tuần Này' },
  lastWeek: { en: 'Last Week', vi: 'Tuần Trước' },
  thisMonth: { en: 'This Month', vi: 'Tháng Này' },

  // Storage
  storage: { en: 'Storage', vi: 'Lưu Trữ' },
  storageUsed: { en: 'Storage Used', vi: 'Đã Sử Dụng' },
  storageRemaining: { en: 'Remaining', vi: 'Còn Lại' },
  unlimited: { en: 'Unlimited', vi: 'Không Giới Hạn' }
};
