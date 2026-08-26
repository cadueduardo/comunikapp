'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import {
  clearClientSessionActive,
  markClientSessionActive,
} from '@/lib/session-auth';
import { limparCacheVendasAcesso } from '@/contexts/VendasAcessoContext';
import { resolvePostLoginHref } from '@/lib/post-login-redirect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Loja {
  id: string;
  nome: string;
  slug?: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  email?: string;
  telefone?: string;
  cnpj?: string | null;
  cpf?: string | null;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  url_canonica?: string | null;
  dominio_custom?: string | null;
  dominio_custom_status?: string | null;
  dominio_custom_token?: string | null;
  logo_url?: string | null;
  cabecalho_orcamento?: string | null;
  site_url?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  linkedin_url?: string | null;
  custo_maquinaria_hora?: string | null;
  custos_indiretos_mensais?: string | null;
  margem_lucro_padrao?: string | null;
  impostos_padrao?: string | null;
  comissao_padrao?: string | null;
  horas_produtivas_mensais?: number | null;
  tipo_margem_lucro?: string | null;
  condicao_pagamento_padrao_tipo?: string | null;
  condicao_pagamento_padrao_entrada_pct?: string | null;
  condicao_pagamento_padrao_descricao?: string | null;
}

interface User {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  funcao: string;
  loja_id: string;
  loja: Loja;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>;
  logout: () => void | Promise<void>;
  getFirstName: () => string;
  /** Estabelece sessão via cookie HttpOnly (login BFF). Argumento legado ignorado. */
  login: (_token?: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

function clearLegacyAuthStorage() {
  if (typeof window === 'undefined') return;
  try {
    clearClientSessionActive();
    limparCacheVendasAcesso();
    localStorage.removeItem('access_token');
    localStorage.removeItem('loja_id');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_id');
  } catch {
    // ignore
  }
}

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [reauthOpen, setReauthOpen] = useState(false);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [reauthEmail, setReauthEmail] = useState('');
  const [reauthPassword, setReauthPassword] = useState('');

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      markClientSessionActive();
    } catch (error) {
      console.error('❌ UserContext: Erro ao buscar dados do usuário:', error);

      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Não limpar sessão em erro de rede
      } else {
        clearLegacyAuthStorage();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchUser = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  const login = useCallback(
    async (_token?: string) => {
      // Cookie já foi setado pelo BFF /api/auth/login*
      setLoading(true);
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        markClientSessionActive();
        const dest = resolvePostLoginHref(userData?.loja);
        if (dest.external) {
          window.location.assign(dest.href);
          return;
        }
        router.push(dest.href);
      } catch (error) {
        console.error('❌ UserContext: Erro pós-login:', error);
        clearLegacyAuthStorage();
        setUser(null);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout BFF falhou; limpando estado local mesmo assim.', error);
    }
    clearLegacyAuthStorage();
    setUser(null);
    router.push('/login');
  }, [router]);

  const handleReauthenticate = useCallback(async () => {
    setReauthLoading(true);
    setReauthError(null);
    try {
      const responseData = await authAPI.login(reauthEmail, reauthPassword);
      if (responseData.requiresTwoFactor) {
        setReauthError(
          'Esta conta exige 2FA. Faça login completo pela tela de login.',
        );
        return;
      }
      setReauthOpen(false);
      setReauthEmail('');
      setReauthPassword('');
      await fetchUserData();
    } catch (err: any) {
      setReauthError(err?.message || 'Falha ao reautenticar');
    } finally {
      setReauthLoading(false);
    }
  }, [reauthEmail, reauthPassword, fetchUserData]);

  useEffect(() => {
    // Migração: remove JWT legado do localStorage (sessão agora é cookie HttpOnly)
    try {
      localStorage.removeItem('access_token');
    } catch {
      // ignore
    }

    const isAuthPage =
      window.location.pathname.includes('/cadastro') ||
      window.location.pathname.includes('/login') ||
      window.location.pathname.includes('/verificar');

    const isPublicPage =
      window.location.pathname === '/' ||
      window.location.pathname.startsWith('/orcamento/') ||
      window.location.pathname.startsWith('/beta');

    if (!isAuthPage && !isPublicPage) {
      fetchUserData();
    } else {
      setLoading(false);
      setUser(null);
    }
  }, [fetchUserData]);

  useEffect(() => {
    function onSessionExpired() {
      setReauthOpen(true);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'session-expired',
        onSessionExpired as unknown as EventListener,
      );
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'session-expired',
          onSessionExpired as unknown as EventListener,
        );
      }
    };
  }, []);

  const getFirstName = () => {
    if (!user) return 'Usuário';
    return user.nome_completo.split(' ')[0];
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        refetchUser,
        logout,
        getFirstName,
        login,
      }}
    >
      {children}
      <Dialog open={reauthOpen} onOpenChange={setReauthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sessão expirada</DialogTitle>
            <DialogDescription>
              Faça login novamente para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="reauth-email">E-mail</Label>
              <Input
                id="reauth-email"
                type="email"
                value={reauthEmail}
                onChange={(e) => setReauthEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="reauth-password">Senha</Label>
              <Input
                id="reauth-password"
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
              />
            </div>
            {reauthError && (
              <p className="text-sm text-destructive">{reauthError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReauthOpen(false)}
              disabled={reauthLoading}
            >
              Cancelar
            </Button>
            <Button onClick={handleReauthenticate} disabled={reauthLoading}>
              {reauthLoading ? 'Entrando…' : 'Entrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserContext.Provider>
  );
};
