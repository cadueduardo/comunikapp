'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SIDEBAR_MENU_DEFAULT_ORDER,
  mergeSidebarOrder,
  storageKeySidebarOrder,
  type SidebarMenuItemId,
  type SidebarNavItem,
} from '@/lib/sidebar-menu';
import { usuariosApi } from '@/lib/api-client';

function ordemPadrao(availableIds: string[]) {
  return mergeSidebarOrder(SIDEBAR_MENU_DEFAULT_ORDER, availableIds);
}

export function useSidebarMenuOrder(
  userId: string | undefined,
  navItems: SidebarNavItem[],
) {
  const availableIds = useMemo(
    () => navItems.map((item) => item.id),
    [navItems],
  );

  const availableKey = availableIds.join('|');
  const [order, setOrder] = useState<string[]>(availableIds);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const migradoRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setOrder(availableIds);
      setCarregando(false);
      return;
    }

    let cancelado = false;

    async function carregar() {
      setCarregando(true);
      const token = localStorage.getItem('access_token') ?? undefined;
      let aplicou = false;

      if (token) {
        try {
          const prefs = await usuariosApi.getPreferencias(token);
          if (prefs.sidebar_menu_order?.length) {
            if (!cancelado) {
              setOrder(mergeSidebarOrder(prefs.sidebar_menu_order, availableIds));
              aplicou = true;
            }
          } else if (!migradoRef.current) {
            migradoRef.current = true;
            const legado = localStorage.getItem(storageKeySidebarOrder(userId));
            if (legado) {
              try {
                const parsed = JSON.parse(legado) as string[];
                const merged = mergeSidebarOrder(parsed, availableIds);
                if (!cancelado) {
                  setOrder(merged);
                  aplicou = true;
                }
                await usuariosApi.updatePreferencias(
                  { sidebar_menu_order: merged },
                  token,
                );
                localStorage.removeItem(storageKeySidebarOrder(userId));
              } catch {
                /* ignora legado inválido */
              }
            }
          }
        } catch {
          /* tenta fallback abaixo */
        }
      }

      if (!aplicou && !cancelado) {
        try {
          const legado = localStorage.getItem(storageKeySidebarOrder(userId));
          if (legado) {
            const parsed = JSON.parse(legado) as string[];
            setOrder(mergeSidebarOrder(parsed, availableIds));
            aplicou = true;
          }
        } catch {
          /* ignora */
        }
      }

      if (!aplicou && !cancelado) {
        setOrder(ordemPadrao(availableIds));
      }

      if (!cancelado) {
        setCarregando(false);
      }
    }

    void carregar();

    return () => {
      cancelado = true;
    };
  }, [userId, availableKey, availableIds]);

  const saveOrder = useCallback(
    async (next: string[]) => {
      const merged = mergeSidebarOrder(next, availableIds);
      setOrder(merged);

      if (!userId) return;

      const token = localStorage.getItem('access_token');
      if (!token) {
        localStorage.setItem(
          storageKeySidebarOrder(userId),
          JSON.stringify(merged),
        );
        return;
      }

      setSalvando(true);
      try {
        await usuariosApi.updatePreferencias(
          { sidebar_menu_order: merged },
          token,
        );
        localStorage.removeItem(storageKeySidebarOrder(userId));
      } catch {
        localStorage.setItem(
          storageKeySidebarOrder(userId),
          JSON.stringify(merged),
        );
      } finally {
        setSalvando(false);
      }
    },
    [availableIds, userId],
  );

  const orderedItems = useMemo(() => {
    const byId = new Map(navItems.map((item) => [item.id, item]));
    return order
      .map((id) => byId.get(id as SidebarMenuItemId))
      .filter((item): item is SidebarNavItem => Boolean(item));
  }, [navItems, order]);

  return {
    orderedItems,
    order,
    saveOrder,
    carregando,
    salvando,
  };
}
