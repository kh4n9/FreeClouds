"use client";

import { useState, useEffect } from "react";
import { LogOut, User, Settings } from "lucide-react";
import Image from "next/image";
import LanguageSwitcher from "./LanguageSwitcher";

interface NavbarProps {
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
  onLogout?: () => void;
  onOpenUserProfile?: () => void;
}

export default function Navbar({ user, onLogout, onOpenUserProfile }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
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
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        if (onLogout) {
          onLogout();
        } else {
          window.location.href = "/login";
        }
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Free Clouds Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <h1 className="text-xl font-bold text-gray-900">Free Clouds</h1>
          </div>
        </div>

        {/* Language Switcher and User Menu */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="compact" className="hidden sm:block" />

        {user ? (
          <div className="relative user-dropdown">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="hidden md:block text-left">
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-gray-500 truncate max-w-32">
                  {user.email}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-sm text-gray-500 break-all">{user.email}</div>
                </div>

                <div className="p-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenUserProfile?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
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
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign In
            </a>
            <a
              href="/register"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign Up
            </a>
          </div>
        )}
        </div>
      </div>
    </nav>
  );
}
