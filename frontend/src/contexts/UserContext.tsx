'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string;
  funcao: string;
  loja_id: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  getFirstName: () => string;
  loading: boolean;
  logout: () => void;
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

  // Função para buscar dados do usuário logado
  const fetchUserData = async () => {
    try {
      // Verifica se há dados do usuário no localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const getFirstName = () => {
    if (!user) return 'Usuário';
    return user.nome_completo.split(' ')[0];
  };

  return (
    <UserContext.Provider value={{ user, setUser, getFirstName, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}; 