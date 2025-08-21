'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { PerfilAccessList } from '../PerfilAccessList';
import { Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PerfisPage() {
  return (
    <CrudPage
      header={
        <PageHeader
          title="Perfis de Acesso"
          backHref="/usuarios"
          icon={<Shield className="h-8 w-8" />}
          subtitle="Gerencie perfis e permissões dos usuários"
          actions={
            <Link href="/usuarios/perfis/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Novo Perfil
              </Button>
            </Link>
          }
        />
      }
      table={<PerfilAccessList />}
    />
  );
}
