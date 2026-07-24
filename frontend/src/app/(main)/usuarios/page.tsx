'use client';

import { Users } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleHubCards } from '@/components/layout/ModuleHubCards';
import { CrudPage } from '@/components/crud/CrudPage';
import { usuariosModuleNav } from '@/lib/module-nav';

export default function UsuariosPage() {
  return (
    <CrudPage
      header={
        <ModuleHeader
          nav={usuariosModuleNav}
          title="Visão geral"
          backHref="/dashboard"
          icon={<Users className="h-7 w-7 sm:h-8 sm:w-8" />}
          subtitle="Escolha o recurso"
        />
      }
      table={<ModuleHubCards nav={usuariosModuleNav} gridClassName="lg:grid-cols-4" />}
    />
  );
}
