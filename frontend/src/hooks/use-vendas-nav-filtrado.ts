'use client';

import { useVendasAcesso } from '@/hooks/use-vendas-acesso';
import { useMemo } from 'react';
import {
  filtrarVendasNavPorConfig,
  vendasModuleNav,
  type ModuleNavConfig,
} from '@/lib/module-nav';

/**
 * Nav de Vendas com Aditivos filtrado pela flag da loja
 * (`os_aditiva_habilitada` em GET /vendas/acesso).
 * Não consulta `/instalacao/configuracao` — essa rota exige
 * `instalacao.acessar` e 403 no console no perfil só de Vendas.
 */
export function useVendasNavFiltrado(): {
  nav: ModuleNavConfig;
  aditivosHabilitados: boolean;
  loading: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
} {
  const { acesso, loading, erro, recarregar } = useVendasAcesso();
  const aditivosHabilitados = acesso.os_aditiva_habilitada === true;

  const nav = useMemo(
    () =>
      filtrarVendasNavPorConfig(vendasModuleNav, {
        aditivosHabilitados,
      }),
    [aditivosHabilitados],
  );

  return { nav, aditivosHabilitados, loading, erro, recarregar };
}
