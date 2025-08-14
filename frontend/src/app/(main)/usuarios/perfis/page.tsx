'use client';

import { Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { PerfilAccessList } from '../PerfilAccessList';

export default function PerfisPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Gestão de Perfis" backHref="/usuarios" icon={<Shield className="h-8 w-8" />} />
      <PerfilAccessList />
    </div>
  );
}


