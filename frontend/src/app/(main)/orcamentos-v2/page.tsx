'use client';

import React from 'react';
import { OrcamentosV2Table } from '@/components/ui/orcamentos-v2/orcamentos-v2-table';
import { OrcamentosV2Cards } from '@/components/ui/orcamentos-v2/orcamentos-v2-cards';
import { ViewToggle } from '@/components/ui/shared/view-toggle';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function OrcamentosV2Page() {
  const [viewMode, setViewMode] = React.useState<'table' | 'cards'>('table');

  return (
    <div className="w-full px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orçamentos V2</h1>
          <p className="mt-2 text-muted-foreground">
            Sistema de orçamentos com nova arquitetura e motor de cálculo V2
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ViewToggle 
            viewMode={viewMode} 
            onViewModeChange={setViewMode} 
          />
          <Link href="/orcamentos-v2/novo">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <OrcamentosV2Table />
      ) : (
        <OrcamentosV2Cards />
      )}
    </div>
  );
}
