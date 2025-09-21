'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { lojasApi } from '@/lib/api-client';

// Adicionando um tipo básico para Loja para evitar erros
// O ideal seria compartilhar tipos com o backend
interface Loja {
  id: string;
  nome: string;
  logo_url?: string | null;
  cabecalho_orcamento?: string | null;
  custo_maquinaria_hora?: string | null;
  custos_indiretos_mensais?: string | null;
  margem_lucro_padrao?: string | null;
  impostos_padrao?: string | null;
  horas_produtivas_mensais?: number | null;
}

interface User {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  funcao: string;
  loja_id: string;
  loja: Loja; // Adicionado campo loja
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refetchUser: () => Promise<void>; // Renomeado de login
  logout: () => void;
  getFirstName: () => string;
  login: (token: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

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
      // Verificar se há token antes de fazer a requisição
      const token = localStorage.getItem('access_token');
      if (!token) {
        localStorage.removeItem('loja_id');
        localStorage.removeItem('user_roles');
        localStorage.removeItem('user_id');
        setUser(null);
        setLoading(false);
        return;
      }
      
      const userData = await lojasApi.getCurrentUser(token);
      setUser(userData);

      // Persistir dados necessários para headers de tenant/roles no frontend
      if (typeof window !== 'undefined') {
        try {
          if (userData?.loja?.id || userData?.loja_id) {
            localStorage.setItem('loja_id', String(userData.loja?.id || userData.loja_id));
          }
          if (userData?.id) {
            localStorage.setItem('user_id', String(userData.id));
          }
          if (userData?.funcao) {
            // mapear função para role primária, mantendo consistência com middleware
            // aqui persistimos apenas a função como role única por enquanto
            localStorage.setItem('user_roles', userData.funcao);
          }
        } catch {}
      }
    } catch (error) {
      console.error('❌ UserContext: Erro ao buscar dados do usuário:', error);
      
      // Verificar o tipo específico de erro
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Não limpar o token em caso de erro de conectividade
        // Deixar que o usuário tente novamente quando o servidor estiver disponível
      } else if (error instanceof Error && error.message.includes('401')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('loja_id');
        localStorage.removeItem('user_roles');
        localStorage.removeItem('user_id');
        setUser(null);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      await fetchUserData();
    }
  }, [fetchUserData]);

  const login = useCallback(async (token: string) => {
    localStorage.setItem('access_token', token);
    await fetchUserData();
    router.push('/dashboard');
  }, [fetchUserData, router]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('loja_id');
    localStorage.removeItem('user_roles');
    localStorage.removeItem('user_id');
    setUser(null);
    router.push('/login');
  }, [router]);

  const handleReauthenticate = useCallback(async () => {
    setReauthLoading(true);
    setReauthError(null);
    try {
      const responseData = await authAPI.login(reauthEmail, reauthPassword);
      const { access_token } = responseData;
      localStorage.setItem('access_token', access_token);
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
    // Verificar se estamos em uma página de autenticação
    const isAuthPage = window.location.pathname.includes('/cadastro') || 
                      window.location.pathname.includes('/login') || 
                      window.location.pathname.includes('/verificar');
    
    // Verificar se estamos em páginas públicas
    const isPublicPage = window.location.pathname === '/' || 
                         window.location.pathname.startsWith('/orcamento/');
    
    const token = localStorage.getItem('access_token');
    if (token && !isAuthPage && !isPublicPage) {
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
      window.addEventListener('session-expired', onSessionExpired as unknown as EventListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('session-expired', onSessionExpired as unknown as EventListener);
      }
    };
  }, []);

  const getFirstName = () => {
    if (!user) return 'Usuário';
    return user.nome_completo.split(' ')[0];
  };

  return (
    <UserContext.Provider value={{ user, loading, refetchUser, logout, getFirstName, login }}>
      {children}
      <Dialog open={reauthOpen} onOpenChange={setReauthOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Sessão expirada</DialogTitle>
            <DialogDescription>
              Sua sessão ficou inativa. Faça login novamente para continuar de onde parou.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="reauth-email">Email</Label>
              <Input id="reauth-email" type="email" value={reauthEmail} onChange={(e) => setReauthEmail(e.target.value)} disabled={reauthLoading} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reauth-password">Senha</Label>
              <Input id="reauth-password" type="password" value={reauthPassword} onChange={(e) => setReauthPassword(e.target.value)} disabled={reauthLoading} />
            </div>
            {reauthError && (
              <p className="text-sm text-red-600">{reauthError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReauthOpen(false)} disabled={reauthLoading}>
              Cancelar
            </Button>
            <Button onClick={handleReauthenticate} disabled={reauthLoading || !reauthEmail || !reauthPassword}>
              {reauthLoading ? 'Entrando…' : 'Entrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserContext.Provider>
  );
}; 