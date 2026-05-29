'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { orcamentosApi } from '@/lib/api-client';

export type OrcamentoDuplicado = {
  id: string;
  numero?: string;
  titulo?: string;
  nome_servico?: string;
};

type DuplicarOpcoes = {
  titulo?: string;
  descricao?: string;
  /** Se false, não redireciona (útil para testes). Padrão: true */
  abrirAposDuplicar?: boolean;
  onSuccess?: (novo: OrcamentoDuplicado) => void;
};

export function useDuplicarOrcamento() {
  const router = useRouter();
  const [duplicandoId, setDuplicandoId] = useState<string | null>(null);

  const duplicar = useCallback(
    async (orcamentoId: string, opcoes?: DuplicarOpcoes) => {
      setDuplicandoId(orcamentoId);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('Token de autenticação não encontrado.');
        }

        const novo = (await orcamentosApi.v2.duplicar(
          orcamentoId,
          {
            titulo: opcoes?.titulo,
            descricao: opcoes?.descricao,
          },
          token,
        )) as OrcamentoDuplicado;

        if (!novo?.id) {
          throw new Error('Resposta inválida ao duplicar orçamento.');
        }

        toast.success('Orçamento duplicado como rascunho. Ajuste o que precisar e salve.');
        opcoes?.onSuccess?.(novo);

        if (opcoes?.abrirAposDuplicar !== false) {
          router.push(`/orcamentos-v2/novo?id=${novo.id}`);
        }

        return novo;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro ao duplicar orçamento.';
        toast.error(message);
        return null;
      } finally {
        setDuplicandoId(null);
      }
    },
    [router],
  );

  const isDuplicando = useCallback(
    (orcamentoId: string) => duplicandoId === orcamentoId,
    [duplicandoId],
  );

  return { duplicar, duplicandoId, isDuplicando };
}
