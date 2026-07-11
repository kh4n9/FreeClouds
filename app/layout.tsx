import type { Metadata } from "next";
import Script from "next/script";
import {
  generateMetadata as generateSEOMetadata,
  generateWebApplicationStructuredData,
  generateOrganizationStructuredData,
} from "@/lib/seo/utils";
import "../styles/globals.css";

export const metadata: Metadata = generateSEOMetadata({
  language: "en",
  title: "Free Clouds - Secure Cloud Storage & File Sharing Platform",
  description:
    "Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security. 50MB file limit, unlimited folders, blazing-fast access, and cross-platform compatibility.",
  keywords: [
    "cloud storage",
    "file sharing",
    "free storage",
    "telegram storage",
    "secure file upload",
    "online storage",
    "file management",
    "cloud backup",
    "file organization",
    "digital storage",
    "remote access",
    "file sync",
    "data storage",
    "document storage",
    "photo storage",
    "video storage",
    "file hosting",
    "cloud drive",
    "online backup",
    "file security",
  ],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webAppStructuredData = generateWebApplicationStructuredData("en");
  const organizationStructuredData = generateOrganizationStructuredData();

  return (
    <html lang="en" className="dark">
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
        <link rel="alternate" href="https://free-clouds.vercel.app/" hrefLang="x-default" />
        <link rel="alternate" href="https://free-clouds.vercel.app/en" hrefLang="en" />
        <link rel="alternate" href="https://free-clouds.vercel.app/vi" hrefLang="vi" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap" rel="stylesheet" />
        <link rel="dns-prefetch" href="//api.telegram.org" />
        <link rel="dns-prefetch" href="//mongodb.com" />
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
        <div className="min-h-screen bg-[#0f172a]">{children}</div>
      </body>
    </html>
  );
}
