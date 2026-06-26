/**
 * Dispara atualização imediata dos badges do menu lateral (OS, PCP, Expedição, Financeiro).
 * Use após ações que colocam itens novos nas filas operacionais.
 */
export const SIDEBAR_BADGES_REFRESH_EVENT = 'comunikapp:sidebar-badges-refresh';

export type SidebarBadgesRefreshDetail = {
  /** Ignora cache de 60s do backend (`?refresh=1`). Padrão: true. */
  forcar?: boolean;
};

const RETRY_DELAYS_MS = [0, 400, 1200] as const;

export function solicitarAtualizacaoBadgesSidebar(
  opcoes: SidebarBadgesRefreshDetail = {},
): void {
  if (typeof window === 'undefined') return;

  const forcar = opcoes.forcar !== false;

  for (const delay of RETRY_DELAYS_MS) {
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent<SidebarBadgesRefreshDetail>(SIDEBAR_BADGES_REFRESH_EVENT, {
          detail: { forcar },
        }),
      );
    }, delay);
  }
}
