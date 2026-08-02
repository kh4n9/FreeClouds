import AdminUserDetailPage from "@/components/admin/pages/user-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserDetailPage lang="en" userId={id} />;
}
