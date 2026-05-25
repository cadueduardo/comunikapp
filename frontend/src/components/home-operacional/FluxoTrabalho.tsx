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
 * Bloco "Seu fluxo de trabalho" da Home operacional (Fase 4).
 *
 * Exibe as 7 colunas operacionais lado a lado em desktop, ou empilhadas
 * em mobile, com no maximo 5 cards por coluna mais a contagem total. O
 * bloco e somente leitura + atalhos para os modulos detalhados.
 *
 * Colunas dependentes do modulo Cobranca (Fase 6) sao retornadas pelo
 * backend com `status: 'aguardando_modulo'`; aqui exibimos um aviso
 * neutro em vez de cards.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Seu fluxo de trabalho</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visão compacta por estágio. Clique em um card para abrir o detalhe.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {fluxo.colunas.map((coluna) => (
            <ColunaFluxoView
              key={coluna.id}
              coluna={coluna}
              onAcaoConcluida={() => void recarregar({ forcar: true })}
            />
          ))}
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
  const aguardando = coluna.status === 'aguardando_modulo';

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-1 px-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {coluna.label}
        </h3>
        <span
          className={`text-xs font-bold ${
            aguardando ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {coluna.total}
        </span>
      </div>

      {aguardando ? (
        <div className="rounded-md border border-dashed bg-zinc-50 p-3 text-xs text-muted-foreground space-y-1.5">
          <Info className="h-3.5 w-3.5" />
          <p>{coluna.aviso ?? 'Aguardando módulo upstream.'}</p>
        </div>
      ) : coluna.cards.length === 0 ? (
        <div className="rounded-md border border-dashed bg-zinc-50/50 p-3 text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          Nada por aqui ainda.
        </div>
      ) : (
        <div className="space-y-2">
          {coluna.cards.map((card) => (
            <CardTrabalho
              key={card.id}
              card={card}
              onAcaoConcluida={onAcaoConcluida}
            />
          ))}
          {coluna.total > coluna.cards.length && (
            <p className="text-[11px] text-muted-foreground pl-1">
              +{coluna.total - coluna.cards.length} no módulo
            </p>
          )}
        </div>
      )}
    </div>
  );
}
