'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getClientSessionToken } from '@/lib/session-auth';
import { usuariosApi } from '@/lib/api-client';

type AcessoModulosValue = {
  modulos: Record<string, boolean>;
  carregado: boolean;
  pode: (chave: string) => boolean;
};

const AcessoModulosContext = createContext<AcessoModulosValue | null>(null);

export function AcessoModulosProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const [modulos, setModulos] = useState<Record<string, boolean>>({});
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const token = getClientSessionToken();
    if (!token) {
      setModulos({});
      setCarregado(true);
      return;
    }
    let cancelado = false;
    void usuariosApi
      .getAcesso(token)
      .then((res) => {
        if (cancelado) return;
        const payload = res as { modulos?: Record<string, boolean> };
        setModulos(payload?.modulos ?? {});
      })
      .catch(() => {
        if (cancelado) return;
        setModulos({});
      })
      .finally(() => {
        if (!cancelado) setCarregado(true);
      });
    return () => {
      cancelado = true;
    };
  }, [userId]);

  const value = useMemo<AcessoModulosValue>(
    () => ({
      modulos,
      carregado,
      pode: (chave: string) => modulos[chave] === true,
    }),
    [modulos, carregado],
  );

  return (
    <AcessoModulosContext.Provider value={value}>
      {children}
    </AcessoModulosContext.Provider>
  );
}

export function useAcessoModulos(): AcessoModulosValue {
  const ctx = useContext(AcessoModulosContext);
  if (!ctx) {
    return {
      modulos: {},
      carregado: false,
      pode: () => false,
    };
  }
  return ctx;
}
