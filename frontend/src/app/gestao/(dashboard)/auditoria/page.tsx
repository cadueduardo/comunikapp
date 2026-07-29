import { Suspense } from 'react';
import { AdminAuditManager } from '@/components/gestao/AdminAuditManager';

export default function AdminAuditPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Carregando auditoria...</p>
      }
    >
      <AdminAuditManager />
    </Suspense>
  );
}
