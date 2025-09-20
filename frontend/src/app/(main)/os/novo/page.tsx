'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { OSForm } from '../../components/os-form';
import { ClipboardList } from 'lucide-react';

export default function NovaOSPage() {
  return (
    <CrudPage
      header={
        <PageHeader
          title="Nova Ordem de Serviço"
          backHref="/os"
          icon={<ClipboardList className="h-8 w-8" />}
          subtitle="Criar nova ordem de serviço para produção"
        />
      }
      table={
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <OSForm mode="novo" />
        </div>
      }
    />
  );
}
