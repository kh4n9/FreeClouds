import AdminUserEditPage from "@/components/admin/pages/user-edit-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminUserEditPage lang="vi" userId={id} />;
}
