'use client';

import { Building2 } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleHubCards } from '@/components/layout/ModuleHubCards';
import { centrosTrabalhoModuleNav } from '@/lib/module-nav';

export default function CentrosDeTrabalhoPage() {
  return (
    <div className="space-y-6 p-2 md:p-0">
      <ModuleHeader
        nav={centrosTrabalhoModuleNav}
        title="Visão geral"
        subtitle="Escolha uma área para gerenciar."
        icon={<Building2 className="h-7 w-7 sm:h-8 sm:w-8" />}
      />

      <ModuleHubCards
        nav={centrosTrabalhoModuleNav}
        gridClassName="lg:grid-cols-4"
      />
    </div>
  );
}
