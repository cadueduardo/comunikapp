'use client';

import { useRouter } from 'next/navigation';
import { ProdutoFinitoForm } from '@/components/forms/produtos-finitos/ProdutoFinitoForm';

export default function NovoProdutoFinitoPage() {
  const router = useRouter();

  return (
    <div className="p-2 md:p-0">
      <ProdutoFinitoForm onSuccess={() => router.push('/produtos-finitos')} />
    </div>
  );
}
