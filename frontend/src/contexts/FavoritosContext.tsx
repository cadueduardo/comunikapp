'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { getClientSessionToken } from '@/lib/session-auth';
import { usuariosApi } from '@/lib/api-client';
import {
  destinoFavoritoPorId,
  type DestinoFavorito,
} from '@/lib/favoritos-catalogo';
import { useAcessoModulos } from '@/contexts/AcessoModulosContext';

const MAX_FAVORITOS = 6;

type FavoritosValue = {
  ids: string[];
  destinos: DestinoFavorito[];
  carregado: boolean;
  ehFavorito: (id: string) => boolean;
  alternar: (id: string) => Promise<void>;
};

const FavoritosContext = createContext<FavoritosValue | null>(null);

export function FavoritosProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const { pode, carregado: acessoPronto } = useAcessoModulos();
  const [ids, setIds] = useState<string[]>([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const token = getClientSessionToken();
    if (!token) {
      setIds([]);
      setCarregado(true);
      return;
    }
    let cancelado = false;
    void usuariosApi
      .getPreferencias(token)
      .then((prefs) => {
        if (!cancelado) setIds(prefs.favoritos ?? []);
      })
      .catch(() => {
        if (!cancelado) setIds([]);
      })
      .finally(() => {
        if (!cancelado) setCarregado(true);
      });
    return () => {
      cancelado = true;
    };
  }, [userId]);

  const destinos = useMemo(() => {
    if (!acessoPronto) return [];
    return ids
      .map((id) => destinoFavoritoPorId(id))
      .filter((destino): destino is DestinoFavorito => Boolean(destino))
      .filter((destino) => pode(destino.moduloId));
  }, [ids, acessoPronto, pode]);

  const ehFavorito = useCallback((id: string) => ids.includes(id), [ids]);

  const alternar = useCallback(
    async (id: string) => {
      const token = getClientSessionToken();
      if (!token) return;
      const ja = ids.includes(id);
      if (!ja && ids.length >= MAX_FAVORITOS) {
        toast.error('Você já tem 6 favoritos. Remova um para adicionar outro.');
        return;
      }
      const proximo = ja ? ids.filter((item) => item !== id) : [...ids, id];
      setIds(proximo);
      try {
        const salvo = await usuariosApi.updatePreferencias(
          { favoritos: proximo },
          token,
        );
        setIds(salvo.favoritos ?? proximo);
      } catch {
        setIds(ids);
        toast.error('Não foi possível salvar o favorito.');
      }
    },
    [ids],
  );

  const value = useMemo<FavoritosValue>(
    () => ({
      ids,
      destinos,
      carregado,
      ehFavorito,
      alternar,
    }),
    [ids, destinos, carregado, ehFavorito, alternar],
  );

  return (
    <FavoritosContext.Provider value={value}>
      {children}
    </FavoritosContext.Provider>
  );
}

export function useFavoritos(): FavoritosValue {
  const ctx = useContext(FavoritosContext);
  if (!ctx) {
    return {
      ids: [],
      destinos: [],
      carregado: false,
      ehFavorito: () => false,
      alternar: async () => undefined,
    };
  }
  return ctx;
}
