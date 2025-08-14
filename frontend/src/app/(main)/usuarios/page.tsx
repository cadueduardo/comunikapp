'use client';

import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';

export default function UsuariosPage() {
  return (
    <CrudPage
      header={
        <PageHeader
          title="Usuários"
          backHref="/dashboard"
          icon={<Users className="h-8 w-8" />}
          subtitle="Gestão de usuários (em construção)"
        />
      }
      table={
        <div className="rounded-lg border bg-white p-6 text-gray-700">
          Estrutura inicial criada. Em breve: listagem, criação, perfis e convites.
        </div>
      }
    />
  );
}


