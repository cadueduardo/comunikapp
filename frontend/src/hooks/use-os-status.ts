'use client';

import { useState, useEffect } from 'react';
import {
  arteProdutoPendente,
  produtoRequerArte,
  STATUS_ARTE_LABEL,
} from '@/lib/arte-produto-utils';

interface ItemArteContexto {
  item_id: string;
  produto_nome: string;
  responsabilidade_arte: string;
  status_arte: string;
}

/**
 * Status dinâmico da OS com base nos produtos que de fato exigem arte.
 */
export function useOsStatus(osId: string) {
  const [statusTexto, setStatusTexto] = useState<string>('Carregando...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarStatus = async () => {
      if (!osId) {
        setStatusTexto('Em análise de materiais e aguardando aprovação final.');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setStatusTexto('Em análise de materiais e aguardando aprovação final.');
          setLoading(false);
          return;
        }

        const response = await fetch(
          `/api/arte-aprovacao/os/${osId}/itens-contexto`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error('Erro ao buscar contexto de arte');
        }

        const json = await response.json();
        const itens: ItemArteContexto[] = json.data || [];

        const comArte = itens.filter((i) =>
          produtoRequerArte(i.responsabilidade_arte, i.status_arte),
        );

        if (comArte.length === 0) {
          setStatusTexto(
            'Em análise de materiais e aguardando aprovação final.',
          );
          return;
        }

        const pendentes = comArte.filter((i) =>
          arteProdutoPendente(i.status_arte),
        );

        if (pendentes.length === 0) {
          setStatusTexto('Arte concluída em todos os produtos que exigem arte.');
          return;
        }

        if (pendentes.length === 1) {
          const p = pendentes[0];
          setStatusTexto(
            `Arte pendente — ${p.produto_nome}: ${STATUS_ARTE_LABEL[p.status_arte] || p.status_arte}.`,
          );
          return;
        }

        setStatusTexto(
          `Arte pendente em ${pendentes.length} de ${comArte.length} produto(s).`,
        );
      } catch (error) {
        console.error('Erro ao buscar status da OS:', error);
        setStatusTexto('Em análise de materiais e aguardando aprovação final.');
      } finally {
        setLoading(false);
      }
    };

    void buscarStatus();
  }, [osId]);

  return { statusTexto, loading };
}
