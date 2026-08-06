'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, FileText, Plus } from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { OrcamentosV2Cards } from '@/components/ui/orcamentos-v2/orcamentos-v2-cards';
import { OrcamentosV2Table } from '@/components/ui/orcamentos-v2/orcamentos-v2-table';
import { AlcadasPendentesDialog } from '@/components/ui/orcamentos-v2/alcadas-pendentes-dialog';
import { Button } from '@/components/ui/button';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { useIsMobile } from '@/hooks/use-media-query';
import { orcamentosModuleNav } from '@/lib/module-nav';

export default function OrcamentosV2Page() {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [alcadasDialogOpen, setAlcadasDialogOpen] = useState(false);

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
            <Button
              variant="outline"
              onClick={() => setAlcadasDialogOpen(true)}
              className="w-full border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 dark:hover:bg-amber-900 sm:w-auto"
            >
              <AlertTriangle className="mr-2 h-4 w-4 text-amber-600 dark:text-amber-400" />
              Alçadas Pendentes
            </Button>
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

      <AlcadasPendentesDialog
        open={alcadasDialogOpen}
        onOpenChange={setAlcadasDialogOpen}
      />
    </div>
  );
}
