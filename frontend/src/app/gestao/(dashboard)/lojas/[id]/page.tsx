import { AdminStoreDetail } from '@/components/gestao/AdminStoreDetail';

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminStoreDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
  return <AdminStoreDetail storeId={id} />;
}

