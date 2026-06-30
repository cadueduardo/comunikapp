'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  TIPO_OCORRENCIA_LABEL,
} from '@/lib/instalacao/instalacao-labels';
import type {
  PainelOsInstalacao,
} from '@/lib/instalacao/instalacao.types';
import { AnexoInstalacaoImagem } from '@/components/instalacao/AnexoInstalacaoImagem';
import {
  IconAlertTriangle,
  IconCheck,
  IconClock,
  IconMapPin,
  IconPhoto,
} from '@tabler/icons-react';

interface TimelineEvento {
  id: string;
  tipo: 'lote_criado' | 'lote_iniciado' | 'lote_concluido' | 'ocorrencia';
  titulo: string;
  descricao?: string;
  data: string;
  fotos?: string[];
  meta?: string;
}

interface InstalacaoTimelineProps {
  painel: PainelOsInstalacao;
  exibirValoresFinanceiros?: boolean;
}

function formatarData(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function montarEventos(painel: PainelOsInstalacao): TimelineEvento[] {
  const eventos: TimelineEvento[] = [];

  for (const lote of painel.lotes) {
    eventos.push({
      id: `lote-criado-${lote.id}`,
      tipo: 'lote_criado',
      titulo: 'Lote de instalação criado',
      descricao: `${lote.logradouro}, ${lote.numero} — ${lote.bairro}`,
      data: lote.criado_em,
      meta: `${lote.quantidade_alocada} un.`,
    });

    if (lote.status_instalacao === 'EM_ANDAMENTO' && lote.data_execucao) {
      eventos.push({
        id: `lote-inicio-${lote.id}`,
        tipo: 'lote_iniciado',
        titulo: 'Trabalho iniciado em campo',
        data: lote.data_execucao,
      });
    }

    if (lote.status_instalacao === 'CONCLUIDO' && lote.data_execucao) {
      eventos.push({
        id: `lote-fim-${lote.id}`,
        tipo: 'lote_concluido',
        titulo: 'Instalação concluída',
        data: lote.data_execucao,
        fotos: lote.fotos_evidencia ?? undefined,
        meta: lote.assinatura_url ? 'Assinatura coletada' : undefined,
      });
    }
  }

  for (const occ of painel.ocorrencias) {
    eventos.push({
      id: occ.id,
      tipo: 'ocorrencia',
      titulo: TIPO_OCORRENCIA_LABEL[occ.tipo] ?? occ.tipo,
      descricao: occ.descricao,
      data: occ.criado_em,
      fotos: occ.fotos_evidencia,
      meta: occ.item_instalacao
        ? `${occ.item_instalacao.logradouro}, ${occ.item_instalacao.numero}`
        : undefined,
    });
  }

  return eventos.sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
}

const ICONES = {
  lote_criado: IconMapPin,
  lote_iniciado: IconClock,
  lote_concluido: IconCheck,
  ocorrencia: IconAlertTriangle,
};

export function InstalacaoTimeline({
  painel,
  exibirValoresFinanceiros = true,
}: InstalacaoTimelineProps) {
  const eventos = useMemo(() => montarEventos(painel), [painel]);

  if (eventos.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-sm text-muted-foreground">
          Nenhum evento de instalação registrado para esta OS.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 overflow-hidden">
      {eventos.map((evento) => {
        const Icone = ICONES[evento.tipo];
        const ocorrencia = painel.ocorrencias.find((o) => o.id === evento.id);

        return (
          <div
            key={evento.id}
            className="flex w-full min-w-0 gap-3 overflow-hidden"
          >
            <div className="flex shrink-0 flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
                <Icone className="h-4 w-4" />
              </div>
              <div className="mt-1 w-px flex-1 bg-border" />
            </div>

            <Card className="mb-2 min-w-0 flex-1 border-border bg-card">
              <CardContent className="space-y-2 p-4">
                <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                  <p className="break-words text-sm font-semibold text-foreground">
                    {evento.titulo}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatarData(evento.data)}
                  </span>
                </div>

                {evento.meta && (
                  <Badge variant="secondary" className="max-w-full truncate">
                    {evento.meta}
                  </Badge>
                )}

                {evento.descricao && (
                  <p className="break-words text-sm text-muted-foreground">
                    {evento.descricao}
                  </p>
                )}

                {exibirValoresFinanceiros && ocorrencia && (
                  <p className="text-xs text-muted-foreground">
                    Custo interno: R${' '}
                    {ocorrencia.custo_interno.toFixed(2)} · Cliente: R${' '}
                    {ocorrencia.preco_cliente.toFixed(2)}
                  </p>
                )}

                {evento.fotos && evento.fotos.length > 0 && (
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {evento.fotos.map((url, i) => (
                      <a
                        key={`${url}-${i}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted"
                      >
                        <AnexoInstalacaoImagem
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <IconPhoto className="h-3.5 w-3.5" />
                      {evento.fotos.length} foto(s)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
