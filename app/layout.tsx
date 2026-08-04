import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { MotionConfig } from "framer-motion";
import "@fontsource-variable/inter";
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
  themeColor: "#0f172a",
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
    <html lang={lang} className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="color-scheme" content="dark" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="alternate" href={new URL("/", process.env.NEXT_PUBLIC_BASE_URL || "https://www.freeclouds.cloud").toString()} hrefLang="x-default" />
        <link rel="alternate" href="https://www.freeclouds.cloud/" hrefLang="en" />
        <link rel="alternate" href="https://www.freeclouds.cloud/vi" hrefLang="vi" />
        <link rel="dns-prefetch" href="//api.telegram.org" />
        <link rel="dns-prefetch" href="//mongodb.com" />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function () {
              try {
                var t = localStorage.getItem("theme");
                if (t === "light") document.documentElement.dataset.theme = "light";
                else document.documentElement.dataset.theme = "dark";
              } catch (e) {}
            })();`,
          }}
        />
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if ("serviceWorker" in navigator) {
              window.addEventListener("load", function () {
                navigator.serviceWorker.register("/sw.js").catch(function () {});
              });
            }`,
          }}
        />
        <Script
          id="webapp-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webAppStructuredData),
          }}
        />
        <Script
          id="organization-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body className="antialiased">
        <MotionConfig reducedMotion="user">
          <div className="min-h-screen app-bg">{children}</div>
        </MotionConfig>
      </body>
    </html>
  );
}
