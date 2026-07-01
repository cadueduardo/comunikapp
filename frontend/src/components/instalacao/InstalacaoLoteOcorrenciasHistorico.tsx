'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AnexoInstalacaoImagem } from '@/components/instalacao/AnexoInstalacaoImagem';
import { TIPO_OCORRENCIA_LABEL } from '@/lib/instalacao/instalacao-labels';
import type { OcorrenciaGestao } from '@/lib/instalacao/instalacao.types';
import { IconAlertTriangle, IconPhoto } from '@tabler/icons-react';

interface InstalacaoLoteOcorrenciasHistoricoProps {
  ocorrencias: OcorrenciaGestao[];
  /** Fotos ficam na galeria de evidências; histórico mostra só o relato. */
  exibirFotos?: boolean;
  /** Ex.: "Lote 2 · Rua Exemplo, 100" */
  rotuloLote?: string | null;
}

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function InstalacaoLoteOcorrenciasHistorico({
  ocorrencias,
  exibirFotos = false,
  rotuloLote,
}: InstalacaoLoteOcorrenciasHistoricoProps) {
  if (ocorrencias.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {rotuloLote
          ? `Nenhuma ocorrência registrada em ${rotuloLote}.`
          : 'Nenhuma ocorrência registrada neste endereço.'}
      </p>
    );
  }

  const ordenadas = [...ocorrencias].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
  );

  return (
    <ul className="space-y-3">
      {ordenadas.map((occ) => (
        <li key={occ.id}>
          <Card className="border-border bg-muted/20">
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <IconAlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-foreground">
                      {TIPO_OCORRENCIA_LABEL[occ.tipo] ?? occ.tipo}
                    </p>
                  </div>
                  {rotuloLote && (
                    <p className="pl-6 text-xs text-muted-foreground">
                      {rotuloLote}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatarData(occ.criado_em)}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">{occ.descricao}</p>

              {occ.quantidade > 1 && (
                <Badge variant="secondary" className="text-xs">
                  Quantidade: {occ.quantidade}
                </Badge>
              )}

              {exibirFotos && occ.fotos_evidencia.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {occ.fotos_evidencia.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                    >
                      <AnexoInstalacaoImagem
                        src={url}
                        alt={`Evidência da ocorrência ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                  <span className="flex items-center gap-1 self-center text-xs text-muted-foreground">
                    <IconPhoto className="h-3.5 w-3.5" />
                    {occ.fotos_evidencia.length} foto(s)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
