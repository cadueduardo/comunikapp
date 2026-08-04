'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  filtrarVendasNavPorConfig,
  vendasModuleNav,
  type ModuleNavConfig,
} from '@/lib/module-nav';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import { getClientSessionToken } from '@/lib/session-auth';

/**
 * Nav de Vendas com Aditivos filtrado pela config real da loja
 * (`os_aditiva_habilitada`). Negar por padrão se a config falhar.
 */
export function useVendasNavFiltrado(): {
  nav: ModuleNavConfig;
  aditivosHabilitados: boolean;
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
} {
  const [aditivosHabilitados, setAditivosHabilitados] = useState(false);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    const token = getClientSessionToken();
    if (!token) {
      setAditivosHabilitados(false);
      setLoading(false);
      setErro('Sessão inválida');
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const config = await instalacaoApi.obterConfiguracaoInstalacao();
      setAditivosHabilitados(config.os_aditiva_habilitada === true);
    } catch {
      setAditivosHabilitados(false);
      setErro(
        'Não foi possível carregar a configuração de aditivos da loja.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const nav = useMemo(
    () =>
      filtrarVendasNavPorConfig(vendasModuleNav, {
        aditivosHabilitados,
      }),
    [aditivosHabilitados],
  );

  return { nav, aditivosHabilitados, loading, erro, recarregar };
}
