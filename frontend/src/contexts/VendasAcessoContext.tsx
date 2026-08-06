'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getClientSessionToken } from '@/lib/session-auth';

export type VendasAcessoResposta = {
  pode_acessar_modulo: boolean;
  permissoes: {
    proposta_ver: boolean;
    proposta_criar: boolean;
    proposta_editar: boolean;
    proposta_enviar: boolean;
    proposta_excluir: boolean;
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
    atividade_ver_propria: boolean;
    atividade_ver_equipe: boolean;
    atividade_gerenciar: boolean;
  };
};

export const VENDAS_ACESSO_VAZIO: VendasAcessoResposta = {
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
    atividade_ver_propria: false,
    atividade_ver_equipe: false,
    atividade_gerenciar: false,
  },
};

type VendasAcessoContextValue = {
  acesso: VendasAcessoResposta;
  loading: boolean;
  erro: string | null;
  /** true após a primeira resposta (ok ou erro) nesta sessão autenticada */
  resolvido: boolean;
  recarregar: () => Promise<void>;
};

const VendasAcessoContext = createContext<VendasAcessoContextValue | null>(
  null,
);

function normalizarAcesso(data: VendasAcessoResposta): VendasAcessoResposta {
  return {
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
      atividade_ver_propria: data?.permissoes?.atividade_ver_propria === true,
      atividade_ver_equipe: data?.permissoes?.atividade_ver_equipe === true,
      atividade_gerenciar: data?.permissoes?.atividade_gerenciar === true,
    },
  };
}

/**
 * Uma única fonte de verdade para GET /vendas/acesso no shell autenticado.
 * Evita o waterfall "Carregando Vendas…" em cada layout/página do módulo.
 */
export function VendasAcessoProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [acesso, setAcesso] =
    useState<VendasAcessoResposta>(VENDAS_ACESSO_VAZIO);
  const [loading, setLoading] = useState(enabled);
  const [erro, setErro] = useState<string | null>(null);
  const [resolvido, setResolvido] = useState(false);
  const resolvidoRef = useRef(false);

  const recarregar = useCallback(async () => {
    if (!enabled) {
      setAcesso(VENDAS_ACESSO_VAZIO);
      setLoading(false);
      setErro(null);
      setResolvido(false);
      resolvidoRef.current = false;
      return;
    }

    const token = getClientSessionToken();
    if (!token) {
      setAcesso(VENDAS_ACESSO_VAZIO);
      setLoading(false);
      setErro('Sessão inválida');
      setResolvido(true);
      resolvidoRef.current = true;
      return;
    }

    // Só bloqueia a UI na primeira resolução; refresh em background não
    // esconde o módulo inteiro de novo.
    if (!resolvidoRef.current) {
      setLoading(true);
    }
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
        setAcesso(VENDAS_ACESSO_VAZIO);
        setErro('Não foi possível verificar o acesso a Vendas.');
        return;
      }
      const data = (await resp.json()) as VendasAcessoResposta;
      setAcesso(normalizarAcesso(data));
    } catch {
      setAcesso(VENDAS_ACESSO_VAZIO);
      setErro('Não foi possível verificar o acesso a Vendas.');
    } finally {
      setLoading(false);
      setResolvido(true);
      resolvidoRef.current = true;
    }
  }, [enabled]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const value = useMemo(
    () => ({ acesso, loading, erro, resolvido, recarregar }),
    [acesso, loading, erro, resolvido, recarregar],
  );

  return (
    <VendasAcessoContext.Provider value={value}>
      {children}
    </VendasAcessoContext.Provider>
  );
}

/**
 * Lê o acesso compartilhado do provider.
 * Mantém a assinatura `useVendasAcesso(enabled)` por compatibilidade: o
 * parâmetro é ignorado quando o provider já está ativo (fonte única).
 */
export function useVendasAcessoContext(): VendasAcessoContextValue {
  const ctx = useContext(VendasAcessoContext);
  if (!ctx) {
    throw new Error(
      'useVendasAcesso deve ser usado dentro de VendasAcessoProvider.',
    );
  }
  return ctx;
}
