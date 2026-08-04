import { Suspense } from "react";
import type { Metadata } from "next";
import SharePage from "@/components/SharePage";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.freeclouds.cloud";
  const pageUrl = `${baseUrl}/vi/s/${token}`;
  const apiUrl = `${baseUrl}/api/shares/${token}`;

  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const fileName = data.displayName || data.name;
      const title = fileName ? `${fileName} - Chia sẻ qua Free Clouds` : "File được chia sẻ | Free Clouds";
      return generateSEOMetadata({
        language: "vi",
        title,
        description: `Tải xuống "${fileName}" an toàn trên Free Clouds. Lưu trữ mã hóa, truy cập tức thì.`,
        url: pageUrl,
        canonical: pageUrl,
        noIndex: true,
      });
    }
  } catch {}

  return generateSEOMetadata({
    language: "vi",
    title: "File được chia sẻ | Free Clouds",
    description: "Tải xuống file được chia sẻ qua Free Clouds",
    url: pageUrl,
    canonical: pageUrl,
    noIndex: true,
  });
}

export default function ShareRoutePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ShareRouteInner params={params} />
    </Suspense>
  );
}

async function ShareRouteInner({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharePage token={token} lang="vi" />;
}
