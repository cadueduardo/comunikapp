'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ItemContextoArte {
  item_id: string;
  produto_nome: string;
  responsabilidade_arte: string;
  politica_cobranca_arte?: string;
  finalidade_anexo: string | null;
  status_arte: string;
  referencia_url: string | null;
  geometria_origem?: string | null;
}

export function useArteItensContexto(osId: string) {
  const [itens, setItens] = useState<ItemContextoArte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregar = async () => {
      const token = localStorage.getItem('access_token');
      if (!token || !osId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/arte-aprovacao/os/${osId}/itens-contexto`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (res.ok) {
          setItens(json.data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar contexto de arte da OS:', error);
      } finally {
        setLoading(false);
      }
    };

    void carregar();
  }, [osId]);

  const getItem = useCallback(
    (itemId: string) => itens.find((i) => i.item_id === itemId),
    [itens],
  );

  return { itens, loading, getItem };
}
