'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  OsAditivaResumo,
  SplitFiscalOs,
} from '@/lib/instalacao/instalacao.types';
import { formatarMoeda } from '@/lib/financeiro/financeiro-format';

interface InstalacaoSplitFiscalCardProps {
  split: SplitFiscalOs | null;
  osAditivas?: OsAditivaResumo[];
}

export function InstalacaoSplitFiscalCard({
  split,
  osAditivas = [],
}: InstalacaoSplitFiscalCardProps) {
  if (!split && osAditivas.length === 0) return null;

  const totalAditivas = osAditivas.reduce(
    (acc, item) => acc + Number(item.valor_orcado ?? 0),
    0,
  );

  return (
    <Card className="w-full min-w-0 border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Split fiscal para emissão externa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {split && (
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>
        )}

        {osAditivas.length > 0 && (
          <div className="rounded-md border border-border bg-muted/20 p-3 text-sm">
            <p className="mb-2 font-medium text-foreground">
              Valores faturados em OS Aditiva
            </p>
            <ul className="space-y-1.5">
              {osAditivas.map((aditiva) => (
                <li
                  key={aditiva.id}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="text-foreground">{aditiva.numero}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatarMoeda(aditiva.valor_orcado)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Total em aditivas: {formatarMoeda(totalAditivas)} — cobrança
              separada da OS principal (não entra no split acima).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
