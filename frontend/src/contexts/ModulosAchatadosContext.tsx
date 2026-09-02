'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

const ModulosAchatadosContext = createContext<Set<string>>(new Set());

export function ModulosAchatadosProvider({
  ids,
  children,
}: {
  ids: Set<string>;
  children: ReactNode;
}) {
  const value = useMemo(() => ids, [ids]);
  return (
    <ModulosAchatadosContext.Provider value={value}>
      {children}
    </ModulosAchatadosContext.Provider>
  );
}

export function useModuloAchatado(navId: string): boolean {
  return useContext(ModulosAchatadosContext).has(navId);
}
