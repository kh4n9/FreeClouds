import { Suspense } from "react";
import SharePage from "@/components/SharePage";

export const metadata = {
  title: "File được chia sẻ | FreeClouds",
  description: "Tải xuống file được chia sẻ qua FreeClouds",
};

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
