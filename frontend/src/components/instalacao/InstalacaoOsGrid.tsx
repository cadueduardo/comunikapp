'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  STATUS_INSTALACAO_OS_FILTROS,
  STATUS_INSTALACAO_OS_LABEL,
  STATUS_INSTALACAO_OS_TONE,
} from '@/lib/instalacao/instalacao-labels';
import type { OsInstalacaoGridItem } from '@/lib/instalacao/instalacao.types';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import { cn } from '@/lib/utils';
import { IconClipboardList, IconLock, IconSearch, IconFileTypePdf } from '@tabler/icons-react';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

function formatarData(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

const MENSAGEM_BLOQUEIO_FINANCEIRO =
  'Entrega bloqueada — pendência financeira — ver financeiro';

/** Cadeado de bloqueio financeiro: tooltip no hover, detalhe + link no clique. */
function CadeadoBloqueioFinanceiro({
  linkFinanceiro,
}: {
  linkFinanceiro: string | null;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={MENSAGEM_BLOQUEIO_FINANCEIRO}
          aria-label={MENSAGEM_BLOQUEIO_FINANCEIRO}
          className="inline-flex shrink-0 items-center justify-center rounded p-0.5 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/50"
          onClick={(e) => e.stopPropagation()}
        >
          <IconLock className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Entrega bloqueada — pendência financeira.
        </p>
        {linkFinanceiro && (
          <Link
            href={linkFinanceiro}
            className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-2"
          >
            Ver financeiro
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}

function badgeStatusOs(item: OsInstalacaoGridItem) {
  const status = item.status_instalacao_os;
  if (!status) {
    return (
      <Badge variant="outline" className="whitespace-nowrap">
        Sem status
      </Badge>
    );
  }
  const tone = STATUS_INSTALACAO_OS_TONE[status] ?? 'default';
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge className={cn('whitespace-nowrap', TONE_CLASSES[tone])}>
        {STATUS_INSTALACAO_OS_LABEL[status] ?? status}
      </Badge>
      {item.pendente_aprovacao_financeira && (
        <span className="text-[11px] leading-tight text-muted-foreground">
          Campo concluído — aprovar faturamento na OS
        </span>
      )}
      {item.relatorio_tecnico?.pdf_token && (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            void instalacaoApi.abrirRelatorioPdf(
              item.relatorio_tecnico!.pdf_token,
            );
          }}
        >
          <IconFileTypePdf className="h-3.5 w-3.5" />
          Ver relatório
        </button>
      )}
    </div>
  );
}

interface InstalacaoOsGridProps {
  itens: OsInstalacaoGridItem[];
  carregando: boolean;
  busca: string;
  statusFiltro: string;
  onBuscaChange: (valor: string) => void;
  onStatusFiltroChange: (valor: string) => void;
  onSelecionarOs: (item: OsInstalacaoGridItem) => void;
}

export function InstalacaoOsGrid({
  itens,
  carregando,
  busca,
  statusFiltro,
  onBuscaChange,
  onStatusFiltroChange,
  onSelecionarOs,
}: InstalacaoOsGridProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="Buscar por OS, cliente ou serviço..."
            className="border-border bg-card pl-9"
            aria-label="Buscar ordens de serviço"
          />
        </div>
        <Select value={statusFiltro} onValueChange={onStatusFiltroChange}>
          <SelectTrigger className="w-full border-border bg-card sm:w-[260px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_INSTALACAO_OS_FILTROS.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <IconClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma ordem de serviço com instalação encontrada para os filtros
              selecionados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden w-full min-w-0 overflow-x-auto md:block">
            <Table className="min-w-[880px]">
              <TableHeader>
                <TableRow>
                  <TableHead>OS</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status instalação</TableHead>
                  <TableHead>Data agendada</TableHead>
                  <TableHead>Progresso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow
                    key={item.os_id}
                    className={cn(
                      'cursor-pointer',
                      item.bloqueio_financeiro
                        ? 'bg-amber-50/70 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/40'
                        : item.requer_atencao_instalacao
                          ? 'bg-amber-50/50 hover:bg-amber-100/40 dark:bg-amber-950/15 dark:hover:bg-amber-950/30'
                          : 'hover:bg-muted/50',
                    )}
                    onClick={() => onSelecionarOs(item)}
                  >
                    <TableCell className="font-medium">
                      <span className="inline-flex flex-wrap items-center gap-1.5">
                        {item.bloqueio_financeiro && (
                          <CadeadoBloqueioFinanceiro
                            linkFinanceiro={item.link_financeiro}
                          />
                        )}
                        {item.numero}
                        {item.requer_atencao_instalacao && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/50 bg-amber-500/10 text-[10px] text-amber-900 dark:text-amber-100"
                          >
                            Atenção
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {item.cliente_nome ?? '—'}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {item.nome_servico}
                    </TableCell>
                    <TableCell>{badgeStatusOs(item)}</TableCell>
                    <TableCell>
                      {formatarData(
                        item.data_instalacao_agendada ?? item.proxima_visita,
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.progresso.total > 0
                        ? `${item.progresso.concluidos}/${item.progresso.total} lotes`
                        : 'Sem lotes'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {itens.map((item) => (
              <Card
                key={item.os_id}
                className={cn(
                  'cursor-pointer transition-colors',
                  item.bloqueio_financeiro
                    ? 'border-amber-300 bg-amber-50/60 hover:bg-amber-100/50 dark:border-amber-900 dark:bg-amber-950/20'
                    : item.requer_atencao_instalacao
                      ? 'border-amber-300/80 bg-amber-50/40 hover:bg-amber-100/35 dark:border-amber-900/80 dark:bg-amber-950/15'
                      : 'border-border bg-card hover:bg-muted/30',
                )}
                onClick={() => onSelecionarOs(item)}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 font-semibold text-foreground">
                        {item.bloqueio_financeiro && (
                          <CadeadoBloqueioFinanceiro
                            linkFinanceiro={item.link_financeiro}
                          />
                        )}
                        OS {item.numero}
                        {item.requer_atencao_instalacao && (
                          <Badge
                            variant="outline"
                            className="border-amber-500/50 bg-amber-500/10 text-[10px] font-normal text-amber-900 dark:text-amber-100"
                          >
                            Atenção
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.cliente_nome ?? 'Cliente não informado'}
                      </p>
                    </div>
                    {badgeStatusOs(item)}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {item.nome_servico}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      Agendada:{' '}
                      {formatarData(
                        item.data_instalacao_agendada ?? item.proxima_visita,
                      )}
                    </span>
                    <span>
                      {item.progresso.total > 0
                        ? `${item.progresso.concluidos}/${item.progresso.total} lotes`
                        : 'Sem lotes'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
