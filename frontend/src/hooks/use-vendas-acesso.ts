'use client';

/**
 * Autorização de navegação do módulo Vendas.
 * Estado compartilhado via VendasAcessoProvider (shell autenticado).
 */
export {
  VendasAcessoProvider,
  useVendasAcessoContext,
  VENDAS_ACESSO_VAZIO,
  type VendasAcessoResposta,
} from '@/contexts/VendasAcessoContext';

import { useVendasAcessoContext } from '@/contexts/VendasAcessoContext';

/**
 * Compatível com a assinatura antiga `useVendasAcesso(enabled)`.
 * O `enabled` é controlado só pelo VendasAcessoProvider no layout.
 */
export function useVendasAcesso(enabled?: boolean) {
  void enabled;
  return useVendasAcessoContext();
}
