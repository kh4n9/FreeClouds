import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free Clouds - Secure File Storage",
  description:
    "Free clouds storage powered by Telegram Bot API. Upload, organize, and access your files securely.",
  keywords: ["cloud storage", "file sharing", "telegram", "free storage"],
  authors: [{ name: "Free Clouds Team" }],

  robots: "index, follow",
  openGraph: {
    title: "Free Clouds - Secure File Storage",
    description: "Free clouds storage powered by Telegram Bot API",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Clouds - Secure File Storage",
    description: "Free clouds storage powered by Telegram Bot API",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">{children}</div>
      </body>
    </html>
  );
}
