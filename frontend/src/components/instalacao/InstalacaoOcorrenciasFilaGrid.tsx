'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { PrecificarOcorrenciaDialog } from '@/components/instalacao/PrecificarOcorrenciaDialog';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import {
  FILA_PRECIFICACAO_STATUS_FILTROS,
  STATUS_FINANCEIRO_OCORRENCIA_LABEL,
  STATUS_FINANCEIRO_OCORRENCIA_TONE,
  TIPO_OCORRENCIA_LABEL,
} from '@/lib/instalacao/instalacao-labels';
import type {
  FilaPrecificacaoItem,
  StatusFinanceiroOcorrencia,
} from '@/lib/instalacao/instalacao.types';
import { valorCobravelCliente } from '@/lib/instalacao/instalacao-financeiro.util';
import { formatarMoeda } from '@/lib/financeiro/financeiro-format';
import { cn } from '@/lib/utils';
import { IconClipboardList, IconLoader2, IconSearch } from '@tabler/icons-react';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

interface InstalacaoOcorrenciasFilaGridProps {
  podePrecificar: boolean;
  onAbrirOs?: (osId: string) => void;
}

export function InstalacaoOcorrenciasFilaGrid({
  podePrecificar,
  onAbrirOs,
}: InstalacaoOcorrenciasFilaGridProps) {
  const [itens, setItens] = useState<FilaPrecificacaoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [statusFiltro, setStatusFiltro] =
    useState<StatusFinanceiroOcorrencia>('PENDENTE_PRECIFICACAO');
  const [pagina, setPagina] = useState(1);
  const [itemSelecionado, setItemSelecionado] =
    useState<FilaPrecificacaoItem | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(busca), 350);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    setPagina(1);
  }, [buscaDebounced, statusFiltro]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const resposta = await instalacaoApi.listarFilaPrecificacao({
        status: statusFiltro,
        busca: buscaDebounced,
        pagina,
        por_pagina: 25,
      });
      setItens(resposta.itens);
      setTotal(resposta.total);
    } catch (err) {
      setItens([]);
      setTotal(0);
      toast.error(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar a fila de precificação.',
      );
    } finally {
      setCarregando(false);
    }
  }, [buscaDebounced, statusFiltro, pagina]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirPrecificacao(item: FilaPrecificacaoItem) {
    setItemSelecionado(item);
    setDialogAberto(true);
  }

  const totalPaginas = Math.max(1, Math.ceil(total / 25));

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por OS, cliente ou descrição..."
            className="border-border bg-card pl-9"
            aria-label="Buscar ocorrências"
          />
        </div>
        <Select
          value={statusFiltro}
          onValueChange={(v) =>
            setStatusFiltro(v as StatusFinanceiroOcorrencia)
          }
        >
          <SelectTrigger className="w-full border-border bg-card sm:w-[240px]">
            <SelectValue placeholder="Status financeiro" />
          </SelectTrigger>
          <SelectContent>
            {FILA_PRECIFICACAO_STATUS_FILTROS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          disabled={carregando}
          onClick={() => void carregar()}
          className="shrink-0"
        >
          {carregando ? (
            <IconLoader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Atualizar'
          )}
        </Button>
      </div>

      {!carregando && (
        <p className="text-xs text-muted-foreground">
          {total} ocorrência(s) neste filtro
        </p>
      )}

      <Card className="border-border bg-card">
        <CardContent className="p-0">
          {carregando ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : itens.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <IconClipboardList className="h-10 w-10 opacity-40" />
              <p className="text-sm">Nenhuma ocorrência neste filtro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>OS / Cliente</TableHead>
                    <TableHead>Ocorrência</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-[120px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => {
                    const tone =
                      STATUS_FINANCEIRO_OCORRENCIA_TONE[
                        item.status_financeiro
                      ] ?? 'default';
                    const valor = valorCobravelCliente(item);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="min-w-[140px]">
                          <button
                            type="button"
                            className="text-left text-sm font-medium text-foreground hover:underline"
                            onClick={() => onAbrirOs?.(item.os_id)}
                          >
                            {item.os_numero}
                          </button>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.cliente_nome ?? '—'}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-[220px]">
                          <p className="text-sm text-foreground truncate">
                            {TIPO_OCORRENCIA_LABEL[item.tipo] ?? item.tipo}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.descricao}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn('whitespace-nowrap', TONE_CLASSES[tone])}
                          >
                            {STATUS_FINANCEIRO_OCORRENCIA_LABEL[
                              item.status_financeiro
                            ] ?? item.status_financeiro}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {formatarMoeda(valor)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatarData(item.criado_em)}
                        </TableCell>
                        <TableCell>
                          {podePrecificar &&
                            item.status_financeiro ===
                              'PENDENTE_PRECIFICACAO' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => abrirPrecificacao(item)}
                              >
                                Precificar
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagina <= 1 || carregando}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-muted-foreground">
            Página {pagina} de {totalPaginas}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagina >= totalPaginas || carregando}
            onClick={() => setPagina((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}

      <PrecificarOcorrenciaDialog
        item={itemSelecionado}
        aberto={dialogAberto}
        onAbertoChange={setDialogAberto}
        onSucesso={() => void carregar()}
        podeAbonar={podePrecificar}
      />
    </div>
  );
}
