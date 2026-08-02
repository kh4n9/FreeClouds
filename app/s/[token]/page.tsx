import { Suspense } from "react";
import SharePage from "@/components/SharePage";

export const metadata = {
  title: "Shared File | FreeClouds",
  description: "Download a file shared via FreeClouds",
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
  return <SharePage token={token} lang="en" />;
}
