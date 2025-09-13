import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { generateMetadata as generateSEOMetadata, generateWebApplicationStructuredData, generateOrganizationStructuredData } from "@/lib/seo/utils";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = generateSEOMetadata({
  language: 'en',
  title: 'Free Clouds - Secure Cloud Storage & File Sharing Platform',
  description: 'Free secure cloud storage powered by Telegram. Upload, organize, and share your files with enterprise-grade security. 50MB file limit, unlimited folders, blazing-fast access, and cross-platform compatibility.',
  keywords: [
    'cloud storage',
    'file sharing',
    'free storage',
    'telegram storage',
    'secure file upload',
    'online storage',
    'file management',
    'cloud backup',
    'file organization',
    'digital storage',
    'remote access',
    'file sync',
    'data storage',
    'document storage',
    'photo storage',
    'video storage',
    'file hosting',
    'cloud drive',
    'online backup',
    'file security'
  ]
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const webAppStructuredData = generateWebApplicationStructuredData('en');
  const organizationStructuredData = generateOrganizationStructuredData();

  return (
    <html lang="en">
      <head>
        {/* Favicons */}
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />

        {/* Theme and mobile optimization */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="color-scheme" content="light" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />

        {/* Language alternatives */}
        <link rel="alternate" href="https://free-clouds.vercel.app/" hrefLang="x-default" />
        <link rel="alternate" href="https://free-clouds.vercel.app/en" hrefLang="en" />
        <link rel="alternate" href="https://free-clouds.vercel.app/vi" hrefLang="vi" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for performance */}
        <link rel="dns-prefetch" href="//api.telegram.org" />
        <link rel="dns-prefetch" href="//mongodb.com" />

        {/* Structured Data - WebApplication */}
        <Script
          id="webapp-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webAppStructuredData)
          }}
        />

        {/* Structured Data - Organization */}
        <Script
          id="organization-structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData)
          }}
        />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">{children}</div>

        {/* Google Analytics (uncomment when ready) */}
        {/* <Script
          src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GA_MEASUREMENT_ID');
          `}
        </Script> */}
      </body>
    </html>
  );
}
