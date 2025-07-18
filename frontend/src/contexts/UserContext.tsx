'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

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

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Fetch user data failed', error);
      setUser(null);
      localStorage.removeItem('access_token');
    }
    setLoading(false);
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
    setUser(null);
    router.push('/login');
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [fetchUserData]);

  const getFirstName = () => {
    if (!user) return 'Usuário';
    return user.nome_completo.split(' ')[0];
  };

  return (
    <UserContext.Provider value={{ user, loading, refetchUser, logout, getFirstName, login }}>
      {children}
    </UserContext.Provider>
  );
}; 