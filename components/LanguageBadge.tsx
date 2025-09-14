"use client";

import { Globe } from "lucide-react";
import { useCurrentLanguage } from "./LanguageSwitcher";

interface LanguageBadgeProps {
  className?: string;
  variant?: 'default' | 'compact' | 'minimal';
  showIcon?: boolean;
}

export default function LanguageBadge({
  className = "",
  variant = 'default',
  showIcon = true
}: LanguageBadgeProps) {
  const currentLanguage = useCurrentLanguage();

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return "px-2 py-1 text-xs";
      case 'minimal':
        return "px-1 py-0.5 text-xs";
      default:
        return "px-3 py-1.5 text-sm";
    }
  };

  const getLanguageInfo = () => {
    switch (currentLanguage) {
      case 'vi':
        return {
          flag: '🇻🇳',
          name: 'Tiếng Việt',
          code: 'VI'
        };
      default:
        return {
          flag: '🇺🇸',
          name: 'English',
          code: 'EN'
        };
    }
  };

  const languageInfo = getLanguageInfo();

  return (
    <div className={`inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-medium transition-colors hover:bg-blue-100 ${getVariantClasses()} ${className}`}>
      {showIcon && (
        <Globe className="w-3 h-3" aria-hidden="true" />
      )}
      <span role="img" aria-label={`${languageInfo.name} flag`}>
        {languageInfo.flag}
      </span>
      {variant !== 'minimal' && (
        <span>{variant === 'compact' ? languageInfo.code : languageInfo.name}</span>
      )}
    </div>
  );
}

// Multi-language support badge for homepage
export function MultiLanguageBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-green-50 text-gray-700 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium ${className}`}>
      <Globe className="w-4 h-4 text-blue-600" aria-hidden="true" />
      <span className="flex items-center gap-1">
        <span role="img" aria-label="US flag">🇺🇸</span>
        <span className="text-gray-400">/</span>
        <span role="img" aria-label="Vietnam flag">🇻🇳</span>
      </span>
      <span className="text-gray-600">Bilingual Support</span>
    </div>
  );
}

// SEO optimized badge
export function SEOBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-blue-50 text-gray-700 border border-green-200 rounded-full px-3 py-1.5 text-xs font-medium ${className}`}>
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
      <span>SEO Optimized</span>
    </div>
  );
}

// Performance badge
export function PerformanceBadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-yellow-50 to-orange-50 text-gray-700 border border-yellow-200 rounded-full px-3 py-1.5 text-xs font-medium ${className}`}>
      <span role="img" aria-label="Lightning bolt">⚡</span>
      <span>High Performance</span>
    </div>
  );
}

// PWA badge
export function PWABadge({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 text-gray-700 border border-purple-200 rounded-full px-3 py-1.5 text-xs font-medium ${className}`}>
      <span role="img" aria-label="Mobile phone">📱</span>
      <span>PWA Ready</span>
    </div>
  );
}

// Combined feature badges
export function FeatureBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <MultiLanguageBadge />
      <SEOBadge />
      <PerformanceBadge />
      <PWABadge />
    </div>
  );
}
