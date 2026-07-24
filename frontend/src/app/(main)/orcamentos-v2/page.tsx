'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { OrcamentosV2Cards } from '@/components/ui/orcamentos-v2/orcamentos-v2-cards';
import { OrcamentosV2Table } from '@/components/ui/orcamentos-v2/orcamentos-v2-table';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { useIsMobile } from '@/hooks/use-media-query';
import { orcamentosModuleNav } from '@/lib/module-nav';

export default function OrcamentosV2Page() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    if (isMobile) {
      setViewMode('cards');
    }
  }, [isMobile]);

  const effectiveView = isMobile ? 'cards' : viewMode;

  return (
    <div className="min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
      <ModuleHeader
        nav={orcamentosModuleNav}
        title="Orçamentos"
        subtitle="Sistema de orçamentos com nova arquitetura e motor de cálculo V2"
        icon={<FileText className="h-7 w-7 shrink-0 sm:h-8 sm:w-8" />}
        actions={
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {!isMobile ? (
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            ) : null}
            <Button asChild className="w-full shrink-0 sm:w-auto">
              <Link href="/orcamentos-v2/novo">
                <Plus className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Link>
            </Button>
          </div>
        }
      />

      {effectiveView === 'table' ? (
        <OrcamentosV2Table />
      ) : (
        <OrcamentosV2Cards />
      )}
    </div>
  );
}
