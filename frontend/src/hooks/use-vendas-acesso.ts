'use client';

import { useCallback, useEffect, useState } from 'react';
import { getClientSessionToken } from '@/lib/session-auth';

export type VendasAcessoResposta = {
  pode_acessar_modulo: boolean;
  permissoes: {
    proposta_ver: boolean;
    proposta_criar: boolean;
    proposta_editar: boolean;
    proposta_enviar: boolean;
    proposta_excluir: boolean;
    // Carteira / cliente / contato (Fase 4) — só controlam a UI; a
    // autorização real é sempre revalidada no backend por registro.
    carteira_ver_propria: boolean;
    carteira_ver_equipe: boolean;
    carteira_ver_todos: boolean;
    carteira_ver_sem_responsavel: boolean;
    carteira_transferir: boolean;
    cliente_criar: boolean;
    cliente_editar: boolean;
    cliente_inativar: boolean;
    cliente_mesclar: boolean;
    contato_gerenciar: boolean;
  };
};

const VAZIO: VendasAcessoResposta = {
  pode_acessar_modulo: false,
  permissoes: {
    proposta_ver: false,
    proposta_criar: false,
    proposta_editar: false,
    proposta_enviar: false,
    proposta_excluir: false,
    carteira_ver_propria: false,
    carteira_ver_equipe: false,
    carteira_ver_todos: false,
    carteira_ver_sem_responsavel: false,
    carteira_transferir: false,
    cliente_criar: false,
    cliente_editar: false,
    cliente_inativar: false,
    cliente_mesclar: false,
    contato_gerenciar: false,
  },
};

/**
 * Consulta o backend (`/api/vendas/acesso`) para autorização de navegação.
 * Negar por padrão em loading/erro — UI nunca prova acesso sozinha.
 */
export function useVendasAcesso(enabled: boolean) {
  const [acesso, setAcesso] = useState<VendasAcessoResposta>(VAZIO);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    if (!enabled) {
      setAcesso(VAZIO);
      setLoading(false);
      setErro(null);
      return;
    }

    const token = getClientSessionToken();
    if (!token) {
      setAcesso(VAZIO);
      setLoading(false);
      setErro('Sessão inválida');
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const resp = await fetch('/api/vendas/acesso', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (!resp.ok) {
        setAcesso(VAZIO);
        setErro('Não foi possível verificar o acesso a Vendas.');
        return;
      }
      const data = (await resp.json()) as VendasAcessoResposta;
      setAcesso({
        pode_acessar_modulo: data?.pode_acessar_modulo === true,
        permissoes: {
          proposta_ver: data?.permissoes?.proposta_ver === true,
          proposta_criar: data?.permissoes?.proposta_criar === true,
          proposta_editar: data?.permissoes?.proposta_editar === true,
          proposta_enviar: data?.permissoes?.proposta_enviar === true,
          proposta_excluir: data?.permissoes?.proposta_excluir === true,
          carteira_ver_propria: data?.permissoes?.carteira_ver_propria === true,
          carteira_ver_equipe: data?.permissoes?.carteira_ver_equipe === true,
          carteira_ver_todos: data?.permissoes?.carteira_ver_todos === true,
          carteira_ver_sem_responsavel:
            data?.permissoes?.carteira_ver_sem_responsavel === true,
          carteira_transferir: data?.permissoes?.carteira_transferir === true,
          cliente_criar: data?.permissoes?.cliente_criar === true,
          cliente_editar: data?.permissoes?.cliente_editar === true,
          cliente_inativar: data?.permissoes?.cliente_inativar === true,
          cliente_mesclar: data?.permissoes?.cliente_mesclar === true,
          contato_gerenciar: data?.permissoes?.contato_gerenciar === true,
        },
      });
    } catch {
      setAcesso(VAZIO);
      setErro('Não foi possível verificar o acesso a Vendas.');
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { acesso, loading, erro, recarregar };
}
