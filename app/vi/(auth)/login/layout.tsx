import type { Metadata } from "next";
import { BASE_URL } from "@/lib/seo/config";

/**
 * The login page is a client component, so it cannot export metadata — the
 * <Head> block it used to render was a silent no-op (next/head does nothing
 * under the App Router). The metadata it was trying to set lives here instead,
 * where Next actually reads it.
 */
export const metadata: Metadata = {
  title: "Đăng Nhập - Free Clouds | Lưu Trữ Đám Mây An Toàn",
  description:
    "Đăng nhập vào tài khoản Free Clouds và truy cập lưu trữ đám mây an toàn. Quản lý file nhanh chóng, đáng tin cậy và bảo mật cấp doanh nghiệp.",
  keywords: [
    "đăng nhập",
    "sign in",
    "đăng nhập cloud storage",
    "free clouds login",
    "đăng nhập an toàn",
    "truy cập file storage",
  ],
  alternates: { canonical: `${BASE_URL}/vi/login` },
  openGraph: {
    title: "Đăng Nhập - Free Clouds | Lưu Trữ Đám Mây An Toàn",
    description:
      "Đăng nhập vào tài khoản Free Clouds và truy cập lưu trữ đám mây an toàn.",
    url: `${BASE_URL}/vi/login`,
  },
  robots: { index: false, follow: false },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
