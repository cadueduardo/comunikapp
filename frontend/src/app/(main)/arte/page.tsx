'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Palette, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArteKanbanBoard } from '@/components/arte-aprovacao/ArteKanbanBoard';
import { fetchFilaArte, type FilaArteItem } from '@/lib/arte-fila-api';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';
import { useArteKanbanSocket } from '@/hooks/use-arte-kanban-socket';

export default function ArteFilaPage() {
  const [loading, setLoading] = useState(true);
  const [itens, setItens] = useState<FilaArteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    setLoading(true);
    setErro(null);
    try {
      const resultado = await fetchFilaArte({ limit: 100 });
      setItens(resultado.data);
      setTotal(resultado.meta?.total ?? resultado.data.length);
      solicitarAtualizacaoBadgesSidebar();
    } catch (error) {
      console.error(error);
      setErro(
        error instanceof Error ? error.message : 'Erro ao carregar fila de arte',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const handleNovaMensagemKanban = useCallback(
    (mensagem: {
      os_id: string;
      produto_id: string;
      autor_tipo?: string;
      autor_nome?: string;
      mensagem?: string;
    }) => {
      const autorTipo = mensagem.autor_tipo?.toUpperCase();
      if (autorTipo !== 'CLIENTE') return;

      setItens((prev) =>
        prev.map((item) =>
          item.os_id === mensagem.os_id && item.item_id === mensagem.produto_id
            ? {
                ...item,
                mensagens_nao_lidas: (item.mensagens_nao_lidas ?? 0) + 1,
                status_arte:
                  item.status_arte === 'AGUARDANDO_CLIENTE'
                    ? 'REVISAO_SOLICITADA'
                    : item.status_arte,
              }
            : item,
        ),
      );

      const preview =
        typeof mensagem.mensagem === 'string'
          ? mensagem.mensagem.replace(/<[^>]+>/g, '').slice(0, 80)
          : '';
      toast.info(`Nova mensagem de ${mensagem.autor_nome || 'cliente'}`, {
        description: preview || 'Abra o card para responder',
        duration: 6000,
      });
    },
    [],
  );

  const handleMensagensLidasKanban = useCallback(
    (payload: { os_id: string; produto_id: string }) => {
      setItens((prev) =>
        prev.map((item) =>
          item.os_id === payload.os_id && item.item_id === payload.produto_id
            ? { ...item, mensagens_nao_lidas: 0 }
            : item,
        ),
      );
    },
    [],
  );

  const handleStatusAtualizadoKanban = useCallback(
    (payload: { item_id: string; os_id: string; status_arte: string }) => {
      setItens((prev) =>
        prev.map((item) =>
          item.item_id === payload.item_id && item.os_id === payload.os_id
            ? { ...item, status_arte: payload.status_arte }
            : item,
        ),
      );
    },
    [],
  );

  useArteKanbanSocket({
    habilitado: true,
    onNovaMensagem: handleNovaMensagemKanban,
    onMensagensLidas: handleMensagensLidasKanban,
    onStatusAtualizado: handleStatusAtualizadoKanban,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Palette className="h-8 w-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold">Arte & Aprovação</h1>
            <p className="text-sm text-muted-foreground">
              Fila de trabalho — {total} item{total !== 1 ? 'ns' : ''} no kanban
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void carregar()}>
            Atualizar
          </Button>
          <Link href="/configuracoes/arte-aprovacao">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configuração
            </Button>
          </Link>
        </div>
      </div>

      {erro && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {!erro && !loading && itens.length === 0 ? (
        <div className="rounded-lg border bg-white p-12 text-center text-muted-foreground">
          Nenhum item na fila de arte no momento.
        </div>
      ) : (
        <ArteKanbanBoard
          itens={itens}
          loading={loading}
          onRefresh={() => void carregar()}
        />
      )}

      {loading && itens.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
