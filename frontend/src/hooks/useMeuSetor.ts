import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface ItemFila {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  data_prazo: string;
  progresso: number;
  alertas: string[];
  setor_atual?: string;
  observacoes?: string;
  quantidade_produzida?: number;
  quantidade_refugo?: number;
}

export interface SetorOperador {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
}

export interface UseMeuSetorReturn {
  // Dados
  setor: SetorOperador | null;
  fila: ItemFila[];
  loading: boolean;
  error: string | null;
  
  // Estados
  operadorId: string | null;
  lastRefresh: Date;
  
  // Handlers
  refreshData: () => Promise<void>;
  iniciarProducao: (itemId: string, observacoes?: string) => Promise<void>;
  concluirEtapa: (itemId: string, observacoes?: string, quantidadeProduzida?: number) => Promise<void>;
  pausarProducao: (itemId: string, motivo: string, observacoes?: string) => Promise<void>;
}

export function useMeuSetor(): UseMeuSetorReturn {
  const [setor, setSetor] = useState<SetorOperador | null>(null);
  const [fila, setFila] = useState<ItemFila[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operadorId, setOperadorId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Obter ID do operador do token
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setOperadorId(payload.user_id);
      } catch (error) {
        console.error('Erro ao decodificar token:', error);
      }
    }
  }, []);

  // Carregar dados do setor
  const fetchSetorData = useCallback(async () => {
    if (!operadorId) return;

    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      
      // Buscar setores disponíveis para o operador
      const setoresResponse = await fetch(`/api/configuracoes/centros-de-trabalho/setores-produtivos/operador/${operadorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!setoresResponse.ok) {
        throw new Error(`Erro ${setoresResponse.status}: ${setoresResponse.statusText}`);
      }

      const setores = await setoresResponse.json();
      
      if (setores.length > 0) {
        const setorAtual = setores[0]; // Por enquanto, usar o primeiro setor
        setSetor(setorAtual);
        
        // Buscar fila do setor
        const filaResponse = await fetch(`/api/pcp/kanban/fila-setor/${setorAtual.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (filaResponse.ok) {
          const filaData = await filaResponse.json();
          setFila(filaData || []);
        }
      }
      
      setLastRefresh(new Date());
      
    } catch (error: any) {
      console.error('Erro ao carregar dados do setor:', error);
      setError(error.message || 'Erro ao carregar dados do setor');
      toast.error('Erro ao carregar dados do setor');
    } finally {
      setLoading(false);
    }
  }, [operadorId]);

  // Refresh manual dos dados
  const refreshData = useCallback(async () => {
    await fetchSetorData();
  }, [fetchSetorData]);

  // Carregar dados quando o componente monta
  useEffect(() => {
    fetchSetorData();
  }, [fetchSetorData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchSetorData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSetorData, loading]);

  // Iniciar produção
  const iniciarProducao = useCallback(async (itemId: string, observacoes?: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/pcp/kanban/iniciar/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operadorId,
          observacoes
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar produção');
      }

      // Atualizar fila localmente
      setFila(prevFila => 
        prevFila.map(item => 
          item.id === itemId ? { ...item, status: 'EM_ANDAMENTO' } : item
        )
      );

      toast.success('Produção iniciada com sucesso');
    } catch (error: any) {
      console.error('Erro ao iniciar produção:', error);
      toast.error('Erro ao iniciar produção');
    }
  }, [operadorId]);

  // Concluir etapa
  const concluirEtapa = useCallback(async (itemId: string, observacoes?: string, quantidadeProduzida?: number) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/pcp/kanban/concluir/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          observacoes,
          quantidadeProduzida
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao concluir etapa');
      }

      // Remover item da fila localmente
      setFila(prevFila => prevFila.filter(item => item.id !== itemId));

      toast.success('Etapa concluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao concluir etapa:', error);
      toast.error('Erro ao concluir etapa');
    }
  }, []);

  // Pausar produção
  const pausarProducao = useCallback(async (itemId: string, motivo: string, observacoes?: string) => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(`/api/pcp/kanban/pausar/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          motivo,
          observacoes
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao pausar produção');
      }

      // Atualizar fila localmente
      setFila(prevFila => 
        prevFila.map(item => 
          item.id === itemId ? { ...item, status: 'PAUSADA' } : item
        )
      );

      toast.success('Produção pausada com sucesso');
    } catch (error: any) {
      console.error('Erro ao pausar produção:', error);
      toast.error('Erro ao pausar produção');
    }
  }, []);

  return {
    // Dados
    setor,
    fila,
    loading,
    error,
    
    // Estados
    operadorId,
    lastRefresh,
    
    // Handlers
    refreshData,
    iniciarProducao,
    concluirEtapa,
    pausarProducao
  };
}

