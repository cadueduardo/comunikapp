'use client';

import { Clock, Info, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFluxoTrabalho } from '@/hooks/use-home-operacional';
import type { ColunaFluxo } from '@/lib/home-operacional-api';
import { CardTrabalho } from './CardTrabalho';

/**
 * Bloco "Seu fluxo de trabalho" da Home operacional.
 *
 * Layout reorganizado em 2026-05-25 (sessao da tarde 3) para melhorar
 * visibilidade e eliminar a rolagem horizontal:
 * - mobile: 1 coluna empilhada (6 colunas verticais)
 * - sm-md: 2 colunas × 3 linhas
 * - lg+: 3 colunas × 2 linhas (cada celula vira um "mini-painel" com
 *   header proprio + ate 3 cards)
 *
 * As colunas dependentes do modulo Cobranca (Fase 6) sao agrupadas em
 * uma celula consolidada "Aguardando módulo financeiro" que ocupa
 * uma posicao no grid sem espalhar dois placeholders separados.
 */
export function FluxoTrabalho() {
  const { fluxo, loading, erro, recarregar } = useFluxoTrabalho();

  if (loading && !fluxo) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-lg border bg-zinc-50/50 p-3 space-y-2"
              >
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (erro) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-red-600">
            Não foi possível carregar o fluxo de trabalho: {erro}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void recarregar({ forcar: true })}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!fluxo) return null;

  // Separa colunas ativas das colunas financeiras (aguardando_modulo).
  // As financeiras viram uma celula unica consolidada no grid.
  const colunasAtivas = fluxo.colunas.filter(
    (c) => c.status !== 'aguardando_modulo',
  );
  const colunasFinanceiras = fluxo.colunas.filter(
    (c) => c.status === 'aguardando_modulo',
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Seu fluxo de trabalho</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visão por estágio. Clique em um card para abrir o detalhe.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={loading}
            onClick={() => void recarregar({ forcar: true })}
            title="Atualizar agora"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {colunasAtivas.map((coluna) => (
            <ColunaFluxoView
              key={coluna.id}
              coluna={coluna}
              onAcaoConcluida={() => void recarregar({ forcar: true })}
            />
          ))}

          {colunasFinanceiras.length > 0 && (
            <CelulaFinanceiraConsolidada colunas={colunasFinanceiras} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ColunaFluxoView({
  coluna,
  onAcaoConcluida,
}: {
  coluna: ColunaFluxo;
  onAcaoConcluida: () => void;
}) {
  return (
    <div className="rounded-lg border bg-zinc-50/40 p-3 space-y-2.5 flex flex-col">
      <div className="flex items-baseline justify-between gap-2 pb-1.5 border-b border-zinc-200/70">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
          {coluna.label}
        </h3>
        <span className="text-lg font-bold text-foreground tabular-nums leading-none">
          {coluna.total}
        </span>
      </div>

      {coluna.cards.length === 0 ? (
        <div className="rounded-md border border-dashed bg-white/60 p-3 text-xs text-muted-foreground flex items-center gap-1.5 flex-1">
          <Clock className="h-3.5 w-3.5" />
          Nada por aqui ainda.
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {coluna.cards.map((card) => (
            <CardTrabalho
              key={card.id}
              card={card}
              onAcaoConcluida={onAcaoConcluida}
            />
          ))}
          {coluna.total > coluna.cards.length && (
            <p className="text-[11px] text-muted-foreground pl-1 pt-0.5">
              +{coluna.total - coluna.cards.length} no módulo
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CelulaFinanceiraConsolidada({
  colunas,
}: {
  colunas: ColunaFluxo[];
}) {
  return (
    <div className="rounded-lg border border-dashed bg-zinc-50/40 p-3 space-y-2.5 flex flex-col">
      <div className="flex items-baseline justify-between gap-2 pb-1.5 border-b border-zinc-200/70">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">
          Financeiro
        </h3>
        <span className="text-[10px] text-muted-foreground uppercase">
          aguardando
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center text-xs text-muted-foreground space-y-2">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
          <p>
            As colunas de cobrança e fechamento serão liberadas quando o
            módulo financeiro (Fase 6) entrar no ar.
          </p>
        </div>

        <ul className="space-y-1 pl-5 list-disc text-[11px]">
          {colunas.map((c) => (
            <li key={c.id}>{c.label}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
