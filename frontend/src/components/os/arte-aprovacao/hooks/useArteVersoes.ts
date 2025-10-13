import { useState, useEffect } from 'react';
import { ArteVersao, CreateArteVersaoRequest, UpdateArteVersaoRequest } from '../types/arte-types';

interface UseArteVersoesReturn {
  versoes: ArteVersao[];
  loading: boolean;
  error: string | null;
  createVersao: (data: CreateArteVersaoRequest) => Promise<ArteVersao>;
  updateVersao: (id: string, data: UpdateArteVersaoRequest) => Promise<ArteVersao>;
  deleteVersao: (id: string) => Promise<void>;
  refreshVersoes: () => Promise<void>;
}

export function useArteVersoes(osId: string): UseArteVersoesReturn {
  const [versoes, setVersoes] = useState<ArteVersao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersoes = async () => {
    if (!osId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/arte-aprovacao/versoes/os/${osId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setVersoes(data);
    } catch (err) {
      console.error('Erro ao carregar versões:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createVersao = async (data: CreateArteVersaoRequest): Promise<ArteVersao> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/arte-aprovacao/versoes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar versão');
      }

      const novaVersao = await response.json();
      setVersoes(prev => [novaVersao, ...prev]);
      return novaVersao;
    } catch (err) {
      console.error('Erro ao criar versão:', err);
      throw err;
    }
  };

  const updateVersao = async (id: string, data: UpdateArteVersaoRequest): Promise<ArteVersao> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/arte-aprovacao/versoes/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        // Verificar se a resposta é JSON válido
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao atualizar versão');
        } else {
          // Se não for JSON, pode ser HTML de erro
          const errorText = await response.text();
          console.error('Resposta não-JSON recebida:', errorText);
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
      }

      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Resposta não-JSON recebida:', responseText);
        throw new Error('Resposta inválida do servidor');
      }

      const versaoAtualizada = await response.json();
      setVersoes(prev => prev.map(v => v.id === id ? versaoAtualizada : v));
      return versaoAtualizada;
    } catch (err) {
      console.error('Erro ao atualizar versão:', err);
      throw err;
    }
  };

  const deleteVersao = async (id: string): Promise<void> => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/arte-aprovacao/versoes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao remover versão');
      }

      setVersoes(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Erro ao remover versão:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchVersoes();
  }, [osId]);

  return {
    versoes,
    loading,
    error,
    createVersao,
    updateVersao,
    deleteVersao,
    refreshVersoes: fetchVersoes,
  };
}
