'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SplitFiscalOs } from '@/lib/instalacao/instalacao.types';

interface InstalacaoSplitFiscalCardProps {
  split: SplitFiscalOs | null;
}

export function InstalacaoSplitFiscalCard({ split }: InstalacaoSplitFiscalCardProps) {
  if (!split) return null;

  return (
    <Card className="w-full min-w-0 border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Split fiscal para emissão externa
        </CardTitle>
      </CardHeader>
      <CardContent className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            NF-e (Produtos)
          </p>
          <p className="mt-1 break-words text-base font-semibold text-foreground">
            {split.instrucao_nfe}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            NFS-e (Serviços)
          </p>
          <p className="mt-1 break-words text-base font-semibold text-foreground">
            {split.instrucao_nfs}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
