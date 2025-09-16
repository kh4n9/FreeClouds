import React from "react";
import Image from "next/image";
import { useTranslation } from "./LanguageSwitcher";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Image
              src="/logo.svg"
              alt="Free Clouds Logo"
              width={24}
              height={24}
              className="h-6 w-6"
            />
            <span className="text-xl font-bold text-white">
              {t("brand", { en: "Free Clouds", vi: "Free Clouds" })}
            </span>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-gray-400">
            <div>
              {t("copyright", {
                en: "© 2024 Free Clouds. All rights reserved.",
                vi: "© 2024 Free Clouds. Bảo lưu mọi quyền.",
              })}
            </div>
            <div className="text-blue-400 font-medium">
              {t("byline", {
                en: "By Hoàng Minh Khang",
                vi: "Bởi Hoàng Minh Khang",
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
