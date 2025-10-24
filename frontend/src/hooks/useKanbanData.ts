import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface OSCardKanban {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  responsavel: string;
  data_prazo: string;
  progresso: number;
  alertas: string[];
  setor_atual?: string;
  operador_atual?: string;
}

export interface KanbanStats {
  total: number;
  fila: number;
  producao: number;
  concluida: number;
  rejeitada: number;
  atrasadas: number;
  criticas: number;
  por_setor: Record<string, number>;
}

export interface KanbanFilters {
  status?: string;
  prioridade?: string;
  setor?: string;
  operador?: string;
  busca?: string;
}

export interface UseKanbanDataReturn {
  // Dados
  cards: OSCardKanban[];
  stats: KanbanStats;
  loading: boolean;
  error: string | null;
  
  // Estados
  filters: KanbanFilters;
  isFullscreen: boolean;
  lastRefresh: Date;
  
  // Handlers
  setFilters: (filters: KanbanFilters) => void;
  refreshData: () => Promise<void>;
  toggleFullscreen: () => void;
  handleStatusChange: (osId: string, newStatus: string) => Promise<void>;
  handleCardClick: (osId: string) => void;
}

export function useKanbanData(lojaId?: string): UseKanbanDataReturn {
  const [cards, setCards] = useState<OSCardKanban[]>([]);
  const [stats, setStats] = useState<KanbanStats>({
    total: 0,
    fila: 0,
    producao: 0,
    concluida: 0,
    rejeitada: 0,
    atrasadas: 0,
    criticas: 0,
    por_setor: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<KanbanFilters>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Carregar dados do kanban
  const fetchKanbanData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams();
      
      // Adicionar filtros à query
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/pcp/kanban/geral?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setCards(data.cards || []);
      setStats(data.stats || stats);
      setLastRefresh(new Date());
      
    } catch (error: any) {
      console.error('Erro ao carregar dados do Kanban:', error);
      setError(error.message || 'Erro ao carregar dados do Kanban');
      toast.error('Erro ao carregar dados do Kanban');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Refresh manual dos dados
  const refreshData = useCallback(async () => {
    await fetchKanbanData();
  }, [fetchKanbanData]);

  // Carregar dados quando o componente monta ou filtros mudam
  useEffect(() => {
    fetchKanbanData();
  }, [fetchKanbanData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchKanbanData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchKanbanData, loading]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Mudança de status
  const handleStatusChange = useCallback(async (osId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/pcp/kanban/status/${osId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      // Atualizar card localmente
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === osId ? { ...card, status: newStatus } : card
        )
      );

      toast.success('Status atualizado com sucesso');
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  }, []);

  // Click no card
  const handleCardClick = useCallback((osId: string) => {
    // TODO: Implementar navegação para detalhes da OS
    console.log('Clicando na OS:', osId);
  }, []);

  return {
    // Dados
    cards,
    stats,
    loading,
    error,
    
    // Estados
    filters,
    isFullscreen,
    lastRefresh,
    
    // Handlers
    setFilters,
    refreshData,
    toggleFullscreen,
    handleStatusChange,
    handleCardClick
  };
}

