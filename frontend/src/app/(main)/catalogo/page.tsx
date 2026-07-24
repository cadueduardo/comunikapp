'use client';

import { Package } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { ModuleHubCards } from '@/components/layout/ModuleHubCards';
import { catalogoModuleNav } from '@/lib/module-nav';

export default function CatalogoHubPage() {
  return (
    <div className="space-y-6 p-6 md:p-0">
      <ModuleHeader
        nav={catalogoModuleNav}
        title="Visão geral"
        subtitle="Configure produtos, personalização e estampas da sua loja."
        icon={<Package className="h-7 w-7 sm:h-8 sm:w-8" />}
      />

      <ModuleHubCards
        nav={catalogoModuleNav}
        gridClassName="lg:grid-cols-4"
      />
    </div>
  );
}
