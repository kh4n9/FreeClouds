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
  const pageUrl = `${baseUrl}/s/${token}`;
  const apiUrl = `${baseUrl}/api/shares/${token}`;

  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const data = await res.json();
      const fileName = data.displayName || data.name;
      const title = fileName ? `${fileName} - Shared via Free Clouds` : "Shared File | Free Clouds";
      return generateSEOMetadata({
        language: "en",
        title,
        description: `Download "${fileName}" securely on Free Clouds. Encrypted storage, instant access.`,
        url: pageUrl,
        canonical: pageUrl,
        noIndex: true,
      });
    }
  } catch {}

  return generateSEOMetadata({
    language: "en",
    title: "Shared File | Free Clouds",
    description: "Download a file shared via Free Clouds",
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
  return <SharePage token={token} lang="en" />;
}
