"use client";

import { useState, useEffect } from "react";
import { LogOut, User, Settings, Cloud } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation, commonTranslations } from "./LanguageSwitcher";

interface NavbarProps {
  user?: {
    id: string;
    email: string;
    name: string;
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
  const { t } = useTranslation();

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
      if (response.ok) {
        if (onLogout) onLogout();
        else window.location.href = "/login";
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="glass border-b border-slate-700/50 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">
              {t("brand", { en: "Free Clouds", vi: "Free Clouds" })}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" className="hidden sm:block" />

          {user ? (
            <div className="relative user-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-medium text-white">{user.name}</div>
                  <div className="text-xs text-slate-500 truncate max-w-32">
                    {user.email}
                  </div>
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 animate-scale-in">
                  <div className="px-4 py-3 border-b border-slate-700">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-slate-400 break-all">
                      {user.email}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenUserProfile?.();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-700 rounded-lg transition-all"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      {t("settings", commonTranslations.settings)}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
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
