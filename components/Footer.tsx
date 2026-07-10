"use client";

import React from "react";
import { Cloud } from "lucide-react";
import { useTranslation } from "./LanguageSwitcher";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-slate-800 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              {t("brand", { en: "Free Clouds", vi: "Free Clouds" })}
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-slate-500">
            <div>
              {t("copyright", {
                en: "© 2024 Free Clouds. All rights reserved.",
                vi: "© 2024 Free Clouds. Bảo lưu mọi quyền.",
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
