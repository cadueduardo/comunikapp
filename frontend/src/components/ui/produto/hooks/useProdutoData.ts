import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '@/lib/config';
import { Insumo, Maquina, Funcao } from '../../shared/types/common.types';

export function useProdutoData() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState<{ insumos: boolean; maquinas: boolean; funcoes: boolean }>({ insumos: false, maquinas: false, funcoes: false });

  const fetchInsumos = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, insumos: true }));
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(buildApiUrl('/insumos'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      }
    } catch (error) {
      console.error('Erro ao buscar insumos:', error);
    } finally {
      setLoading((s) => ({ ...s, insumos: false }));
    }
  }, []);

  const fetchMaquinas = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, maquinas: true }));
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(buildApiUrl('/maquinas'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMaquinas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar máquinas:', error);
    } finally {
      setLoading((s) => ({ ...s, maquinas: false }));
    }
  }, []);

  const fetchFuncoes = useCallback(async () => {
    try {
      setLoading((s) => ({ ...s, funcoes: true }));
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(buildApiUrl('/funcoes'), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setFuncoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar funções:', error);
    } finally {
      setLoading((s) => ({ ...s, funcoes: false }));
    }
  }, []);

  useEffect(() => {
    const refetchAll = async () => {
      await Promise.all([fetchInsumos(), fetchMaquinas(), fetchFuncoes()]);
    };

    // Primeira carga
    refetchAll();

    // Recarregar ao voltar o foco/visibilidade
    const onFocus = () => {
      refetchAll();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetchAll();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [fetchInsumos, fetchMaquinas, fetchFuncoes]);

  return {
    insumos,
    maquinas,
    funcoes,
    loading,
    fetchInsumos,
    fetchMaquinas,
    fetchFuncoes,
    // Utilitário: recarregar tudo sob demanda
    refetchAll: async () => {
      await Promise.all([fetchInsumos(), fetchMaquinas(), fetchFuncoes()]);
    },
  };
} 