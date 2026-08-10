import type { Metadata } from "next";
import { headers } from "next/headers";
import { MotionConfig } from "framer-motion";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import {
  generateMetadata as generateSEOMetadata,
  generateWebApplicationStructuredData,
  generateOrganizationStructuredData,
} from "@/lib/seo/utils";
import { seoConfig } from "@/lib/seo/config";
import "../styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const lang = headerList.get("x-locale") === "vi" ? "vi" : "en";
  const config = seoConfig[lang];

  return generateSEOMetadata({
    language: lang,
    title: config.title,
    description: config.description,
    keywords: config.keywords,
  });
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f6f7f9",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const lang = headerList.get("x-locale") === "vi" ? "vi" : "en";
  const webAppStructuredData = generateWebApplicationStructuredData(lang);
  const organizationStructuredData = generateOrganizationStructuredData();

  return (
    <html lang={lang} className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f6f7f9" />
        <meta name="color-scheme" content="light dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="alternate" href={new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "https://www.freeclouds.cloud").toString()} hrefLang="x-default" />
        <link rel="alternate" href="https://www.freeclouds.cloud/" hrefLang="en" />
        <link rel="alternate" href="https://www.freeclouds.cloud/vi" hrefLang="vi" />
        <link rel="dns-prefetch" href="//api.telegram.org" />
        <link rel="dns-prefetch" href="//mongodb.com" />
        <script
          id="theme-init"
          suppressHydrationWarning
        >{`(function () {
          try {
            var t = localStorage.getItem("theme");
            document.documentElement.dataset.theme = t === "dark" ? "dark" : "light";
          } catch (e) {}
        })();`}</script>
        <script
          id="sw-register"
          suppressHydrationWarning
        >{`if ("serviceWorker" in navigator && !location.hostname.match(/^(localhost|127\.0\.0\.1|::1)$/)) {
          window.addEventListener("load", function () {
            navigator.serviceWorker.register("/sw.js").catch(function () {});
          });
        }`}</script>
        <script
          id="webapp-structured-data"
          type="application/ld+json"
          suppressHydrationWarning
        >{JSON.stringify(webAppStructuredData)}</script>
        <script
          id="organization-structured-data"
          type="application/ld+json"
          suppressHydrationWarning
        >{JSON.stringify(organizationStructuredData)}</script>
      </head>
      <body className="antialiased">
        <MotionConfig reducedMotion="user">
          <div className="min-h-screen app-bg">{children}</div>
        </MotionConfig>
      </body>
    </html>
  );
}
