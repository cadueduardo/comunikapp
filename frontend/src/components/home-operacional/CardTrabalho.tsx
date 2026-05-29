'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';
import type { CardFluxo, AcaoCardFluxo } from '@/lib/home-operacional-api';

/**
 * Card individual de um item de trabalho dentro de uma coluna do fluxo
 * da Home operacional (Fase 4).
 *
 * Decisoes de UX:
 * - O corpo do card e clicavel: leva ao detalhe do recurso (acao 'abrir').
 *   Se nao houver acao 'abrir', o corpo fica nao-clicavel.
 * - Acoes extras viram botoes pequenos no rodape do card.
 * - Acoes com `href` usam Next router; acoes com `endpoint` fazem chamada
 *   direta (formato "METODO /caminho") e disparam recarregamento do
 *   fluxo via callback `onAcaoConcluida`.
 * - O bloco e somente leitura + atalho: nao ha drag-and-drop.
 */
export interface CardTrabalhoProps {
  card: CardFluxo;
  /**
   * Chamado depois que uma acao via `endpoint` termina com sucesso ou
   * falha. O componente pai deve usar para recarregar o fluxo.
   */
  onAcaoConcluida?: () => void;
}

function formatarValor(valor?: number): string | null {
  if (valor === undefined || valor === null || Number.isNaN(valor)) return null;
  try {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `R$ ${valor.toFixed(2)}`;
  }
}

function tempoRelativo(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const diffMs = Date.now() - data.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH} h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 30) return `há ${diffD} d`;
  return data.toLocaleDateString('pt-BR');
}

function parseEndpoint(endpoint: string): { metodo: string; caminho: string } | null {
  const partes = endpoint.trim().split(/\s+/, 2);
  if (partes.length !== 2) return null;
  const [metodo, caminho] = partes;
  if (!/^(GET|POST|PATCH|PUT|DELETE)$/i.test(metodo)) return null;
  return { metodo: metodo.toUpperCase(), caminho };
}

export function CardTrabalho({ card, onAcaoConcluida }: CardTrabalhoProps) {
  const [executandoAcao, setExecutandoAcao] = useState<string | null>(null);

  const acaoAbrir = card.acoes.find((a) => a.id === 'abrir');
  const acoesSecundarias = card.acoes.filter((a) => a.id !== 'abrir');

  async function executarEndpoint(acao: AcaoCardFluxo) {
    if (!acao.endpoint) return;
    const parsed = parseEndpoint(acao.endpoint);
    if (!parsed) {
      toast.error(`Endpoint inválido: ${acao.endpoint}`);
      return;
    }
    setExecutandoAcao(acao.id);
    try {
      const r = await apiRequest(parsed.caminho, { method: parsed.metodo });
      if (!r.ok) {
        const erro = await r.json().catch(() => ({}));
        throw new Error(erro?.message || `Erro HTTP ${r.status}`);
      }
      toast.success(`${acao.label} concluído.`);
      onAcaoConcluida?.();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Falha ao executar "${acao.label}".`,
      );
    } finally {
      setExecutandoAcao(null);
    }
  }

  const valorFormatado = formatarValor(card.valor);
  const tempo = tempoRelativo(card.atualizado_em);

  const conteudo = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground">
          {card.titulo}
        </p>
        {card.status_label && (
          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 whitespace-nowrap flex-shrink-0">
            {card.status_label}
          </span>
        )}
      </div>
      {card.subtitulo && (
        <p className="text-xs text-muted-foreground line-clamp-1">
          {card.subtitulo}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground mt-1">
        <span>{tempo}</span>
        {valorFormatado && (
          <span className="font-medium text-foreground">{valorFormatado}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="rounded-md border border-border bg-card p-2.5 space-y-2 transition-colors hover:bg-muted/50">
      {acaoAbrir?.href ? (
        <Link
          href={acaoAbrir.href}
          className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        >
          {conteudo}
        </Link>
      ) : (
        conteudo
      )}

      {acoesSecundarias.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap border-t pt-2">
          {acoesSecundarias.map((acao) => {
            if (acao.href) {
              return (
                <Button
                  key={acao.id}
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  <Link href={acao.href}>
                    {acao.label}
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Link>
                </Button>
              );
            }
            if (acao.endpoint) {
              return (
                <Button
                  key={acao.id}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  disabled={executandoAcao !== null}
                  onClick={() => {
                    void executarEndpoint(acao);
                  }}
                >
                  {executandoAcao === acao.id ? 'Aguarde...' : acao.label}
                </Button>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
}
