'use client';

import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { OSForm } from '@/components/ui/os-form';
import { ClipboardList } from 'lucide-react';

export default function EditarOSPage() {
  const params = useParams();

  return (
    <CrudPage
      header={
        <PageHeader
          title="Editar Ordem de Serviço"
          backHref={`/os/${params.id}`}
          icon={<ClipboardList className="h-8 w-8" />}
          subtitle="Editar informações da ordem de serviço"
        />
      }
      table={
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <OSForm 
            mode="editar" 
            osId={params.id as string}
          />
        </div>
      }
    />
  );
}
