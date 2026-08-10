"use client";

import { useState, useEffect } from "react";
import { LogOut, User, Settings, Cloud, Shield } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";
import { clearAuthCookieClientSide } from "@/utils/auth-helpers";

interface NavbarProps {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    avatar?: string | null;
  } | null;
  onLogout?: () => void;
  onOpenUserProfile?: () => void;
}

export default function Navbar({
  user,
  onLogout,
  onOpenUserProfile,
}: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { t, currentLang } = useTranslation();
  const adminPath = currentLang === "vi" ? "/vi/admin" : "/admin";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".user-dropdown")) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      clearAuthCookieClientSide();
      if (response.ok) {
        if (onLogout) onLogout();
        else window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
      clearAuthCookieClientSide();
    }
  };

  return (
    <nav className="glass border-b border-line px-4 py-3 relative z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t("brand", { en: "Free Clouds", vi: "Free Clouds" })}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" className="hidden sm:block" />

          {user?.role === "admin" && (
            <a
              href={adminPath}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-accent bg-accent/10 border border-accent/25 rounded-lg hover:bg-accent/20 transition-all"
              title="Admin"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">{t("admin", { en: "Admin", vi: "Quản trị" })}</span>
            </a>
          )}

          {user ? (
            <div className="relative user-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-2 py-2 text-sm text-foreground hover:bg-card-hover rounded-lg transition-all min-h-[44px]"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-accent">
                  {user.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-medium text-foreground">{user.name}</div>
                  <div className="text-xs text-muted truncate max-w-32">
                    {user.email}
                  </div>
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-card border border-line rounded-xl shadow-lg z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-line">
                    <div className="font-medium text-foreground">{user.name}</div>
                    <div className="text-sm text-muted break-all">
                      {user.email}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenUserProfile?.();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-card-hover rounded-lg transition-all"
                    >
                      <Settings className="w-4 h-4 text-muted" />
                      {t("settings", commonTranslations.settings)}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-error hover:bg-error/10 rounded-lg transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      {t("logout", commonTranslations.logout)}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="icon-only" className="sm:hidden" />
              <a
                href="/login"
                className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
              >
                {t("login", commonTranslations.login)}
              </a>
              <a
                href="/register"
                className="px-4 py-2 text-sm btn-primary rounded-lg"
              >
                {t("register", commonTranslations.register)}
              </a>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}