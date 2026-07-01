'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InstalacaoLoteDetalheModal } from '@/components/instalacao/InstalacaoLoteDetalheModal';
import {
  STATUS_INSTALACAO_LABEL,
  STATUS_INSTALACAO_TONE,
} from '@/lib/instalacao/instalacao-labels';
import { montarEnderecoResumido } from '@/lib/instalacao/instalacao-lote-utils';
import type {
  LotePainelOs,
  OcorrenciaGestao,
  PainelOsInstalacao,
} from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';
import { IconChevronRight } from '@tabler/icons-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

function ocorrenciasDoLote(
  ocorrencias: OcorrenciaGestao[],
  loteId: string,
): OcorrenciaGestao[] {
  return ocorrencias.filter((occ) => occ.item_instalacao?.id === loteId);
}

function rotuloServicoLote(lote: LotePainelOs, nomeServicoOs: string | null) {
  return (
    lote.item_os.produto_servico?.trim() ||
    nomeServicoOs?.trim() ||
    'Instalação em campo'
  );
}

interface InstalacaoLotesConsultaGridProps {
  painel: PainelOsInstalacao;
}

export function InstalacaoLotesConsultaGrid({
  painel,
}: InstalacaoLotesConsultaGridProps) {
  const [loteAbertoId, setLoteAbertoId] = useState<string | null>(null);

  const lotesOrdenados = useMemo(
    () =>
      [...painel.lotes].sort(
        (a, b) =>
          new Date(a.criado_em).getTime() - new Date(b.criado_em).getTime(),
      ),
    [painel.lotes],
  );

  const indicePorLote = useMemo(() => {
    const map = new Map<string, number>();
    lotesOrdenados.forEach((lote, index) => {
      map.set(lote.id, index + 1);
    });
    return map;
  }, [lotesOrdenados]);

  const loteAberto = loteAbertoId
    ? lotesOrdenados.find((l) => l.id === loteAbertoId) ?? null
    : null;

  if (lotesOrdenados.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nenhum lote de instalação vinculado a esta OS.
        </CardContent>
      </Card>
    );
  }

  function abrirLote(loteId: string) {
    setLoteAbertoId(loteId);
  }

  return (
    <>
      <div className="hidden w-full min-w-0 overflow-x-auto md:block">
        <Table className="min-w-[720px]">
          <TableHeader>
            <TableRow>
              <TableHead>Lote</TableHead>
              <TableHead>Serviço / produto</TableHead>
              <TableHead>Endereço</TableHead>
              <TableHead>Qtd.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ocorrências</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lotesOrdenados.map((lote) => {
              const indice = indicePorLote.get(lote.id) ?? 0;
              const tone =
                STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
              const totalOcorrencias = ocorrenciasDoLote(
                painel.ocorrencias,
                lote.id,
              ).length;

              return (
                <TableRow
                  key={lote.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => abrirLote(lote.id)}
                >
                  <TableCell className="whitespace-nowrap font-medium text-foreground">
                    Lote {indice}
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <p className="truncate text-sm text-foreground">
                      {rotuloServicoLote(lote, painel.os.nome_servico)}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-[220px]">
                    <p className="truncate text-sm text-muted-foreground">
                      {montarEnderecoResumido(lote)}
                    </p>
                  </TableCell>
                  <TableCell>{lote.quantidade_alocada}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn('whitespace-nowrap', TONE_CLASSES[tone])}
                    >
                      {STATUS_INSTALACAO_LABEL[lote.status_instalacao]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {totalOcorrencias > 0 ? (
                      <Badge variant="secondary">{totalOcorrencias}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {lotesOrdenados.map((lote) => {
          const indice = indicePorLote.get(lote.id) ?? 0;
          const tone =
            STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';
          const totalOcorrencias = ocorrenciasDoLote(
            painel.ocorrencias,
            lote.id,
          ).length;

          return (
            <Card
              key={lote.id}
              className="cursor-pointer border-border bg-card transition-colors hover:bg-muted/30"
              onClick={() => abrirLote(lote.id)}
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Lote {indice}
                    </p>
                    <p className="truncate text-sm font-semibold text-foreground">
                      {rotuloServicoLote(lote, painel.os.nome_servico)}
                    </p>
                  </div>
                  <Badge className={cn('shrink-0', TONE_CLASSES[tone])}>
                    {STATUS_INSTALACAO_LABEL[lote.status_instalacao]}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {montarEnderecoResumido(lote)}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{lote.quantidade_alocada} un.</span>
                  {totalOcorrencias > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {totalOcorrencias} ocorrência(s)
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <InstalacaoLoteDetalheModal
        lote={loteAberto}
        indiceLote={
          loteAberto ? indicePorLote.get(loteAberto.id) : undefined
        }
        nomeServicoOs={painel.os.nome_servico}
        ocorrencias={
          loteAberto
            ? ocorrenciasDoLote(painel.ocorrencias, loteAberto.id)
            : []
        }
        open={Boolean(loteAberto)}
        onOpenChange={(open) => {
          if (!open) setLoteAbertoId(null);
        }}
      />
    </>
  );
}
