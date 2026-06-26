import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { solicitarAtualizacaoBadgesSidebar } from '@/lib/sidebar-badge-refresh';
import type { OSCard } from '@/components/ui/kanban-board';
import { expedicaoApi } from '@/lib/expedicao/expedicao-api';
import {
  MODALIDADE_EXPEDICAO_LABEL,
  STATUS_EXPEDICAO_KANBAN_PATCH,
} from '@/lib/expedicao/expedicao-columns';
import type {
  ExpedicaoCardKanban,
  ExpedicaoKanbanFilters,
  ExpedicaoKanbanStats,
  StatusExpedicao,
} from '@/lib/expedicao/expedicao.types';

function mapearCardParaKanban(card: ExpedicaoCardKanban): OSCard {
  const alertas: string[] = [];
  const modalidadeLabel =
    MODALIDADE_EXPEDICAO_LABEL[card.modalidade] ?? card.modalidade;
  alertas.push(modalidadeLabel);
  if (card.codigo_rastreio) {
    alertas.push(`Rastreio: ${card.codigo_rastreio}`);
  }

  return {
    id: card.id,
    numero: card.os_numero,
    titulo: card.titulo,
    cliente: card.cliente,
    status: card.status,
    prioridade: 'MEDIA',
    responsavel: modalidadeLabel,
    data_prazo: card.data_prazo?.split('T')[0] ?? '',
    progresso:
      card.status === 'ENTREGUE_FINALIZADO'
        ? 100
        : card.status === 'AGUARDANDO_SEPARACAO'
          ? 10
          : 60,
    alertas,
    tem_workflow: false,
    retrabalho: card.retrabalho,
  };
}

export interface UseExpedicaoKanbanReturn {
  cards: OSCard[];
  cardsRaw: ExpedicaoCardKanban[];
  stats: ExpedicaoKanbanStats;
  loading: boolean;
  error: string | null;
  filters: ExpedicaoKanbanFilters;
  lastRefresh: Date;
  setFilters: (filters: ExpedicaoKanbanFilters) => void;
  refreshData: (silent?: boolean) => Promise<void>;
  handleStatusChange: (expedicaoId: string, newStatus: string) => Promise<void>;
  removerCard: (expedicaoId: string) => void;
}

export function useExpedicaoKanban(): UseExpedicaoKanbanReturn {
  const [cardsRaw, setCardsRaw] = useState<ExpedicaoCardKanban[]>([]);
  const [stats, setStats] = useState<ExpedicaoKanbanStats>({
    total: 0,
    por_status: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpedicaoKanbanFilters>({});
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const cards = useMemo(
    () => cardsRaw.map(mapearCardParaKanban),
    [cardsRaw],
  );

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      const data = await expedicaoApi.listarKanban(filters);
      setCardsRaw(data.cards ?? []);
      setStats(data.stats ?? { total: 0, por_status: {} });
      setLastRefresh(new Date());
    } catch (err) {
      if (!silent) {
        const message =
          err instanceof Error ? err.message : 'Erro ao carregar expedição';
        setError(message);
        toast.error(message);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStatusChange = useCallback(
    async (expedicaoId: string, newStatus: string) => {
      if (!STATUS_EXPEDICAO_KANBAN_PATCH.has(newStatus as StatusExpedicao)) {
        toast.error('Use as ações do detalhe para concluir ou arquivar.');
        await fetchData(false);
        return;
      }

      const cardAtual = cardsRaw.find((c) => c.id === expedicaoId);
      if (cardAtual?.bloqueado_financeiro) {
        toast.error(
          'Movimento bloqueado — regularize a pendência financeira antes de avançar a expedição.',
        );
        await fetchData(false);
        return;
      }

      const statusAnterior = cardAtual?.status;

      setCardsRaw((prev) =>
        prev.map((card) =>
          card.id === expedicaoId
            ? { ...card, status: newStatus as StatusExpedicao }
            : card,
        ),
      );

      try {
        await expedicaoApi.atualizarStatus(
          expedicaoId,
          newStatus as StatusExpedicao,
        );
        toast.success('Status da expedição atualizado');
        solicitarAtualizacaoBadgesSidebar();
      } catch (err) {
        if (statusAnterior) {
          setCardsRaw((prev) =>
            prev.map((card) =>
              card.id === expedicaoId
                ? { ...card, status: statusAnterior }
                : card,
            ),
          );
        }
        const message =
          err instanceof Error ? err.message : 'Erro ao atualizar status';
        toast.error(message);
        throw err;
      }
    },
    [cardsRaw, fetchData],
  );

  const removerCard = useCallback((expedicaoId: string) => {
    setCardsRaw((prev) => prev.filter((card) => card.id !== expedicaoId));
    setStats((prev) => ({
      ...prev,
      total: Math.max(0, prev.total - 1),
    }));
  }, []);

  return {
    cards,
    cardsRaw,
    stats,
    loading,
    error,
    filters,
    lastRefresh,
    setFilters,
    refreshData: fetchData,
    handleStatusChange,
    removerCard,
  };
}
