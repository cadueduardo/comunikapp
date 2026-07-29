import { Suspense } from 'react';
import { AdminStoresManager } from '@/components/gestao/AdminStoresManager';

export default function AdminStoresPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando lojas...</p>}>
      <AdminStoresManager />
    </Suspense>
  );
}
