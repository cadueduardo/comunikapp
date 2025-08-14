'use client';

import { Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { DataTable } from '@/components/crud/DataTable';
import { usuarioColumns, UsuarioRow } from './columns';

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
      table={<DataTable<UsuarioRow, any> columns={usuarioColumns} data={[]} />}
    />
  );
}


