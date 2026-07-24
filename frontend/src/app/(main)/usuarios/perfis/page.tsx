'use client';

import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { CrudPage } from '@/components/crud/CrudPage';
import { PerfilAccessList } from '../PerfilAccessList';
import { Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usuariosModuleNav } from '@/lib/module-nav';

export default function PerfisPage() {
  return (
    <CrudPage
      header={
        <ModuleHeader
          nav={usuariosModuleNav}
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
