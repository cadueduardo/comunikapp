'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fetchContadoresMenu, type ContadoresMenu } from '@/lib/home-operacional-api';
import { obterTimestampsVisto } from '@/lib/sidebar-badge-seen';
import {
  SIDEBAR_BADGES_REFRESH_EVENT,
  type SidebarBadgesRefreshDetail,
} from '@/lib/sidebar-badge-refresh';

const INTERVALO_MS = 60_000;

export function useSidebarContadores(enabled: boolean, userId?: string) {
  const pathname = usePathname();
  const pathnameAnteriorRef = useRef(pathname);

  const [contadores, setContadores] = useState<ContadoresMenu>({
    os: 0,
    pcp: 0,
    expedicao: 0,
    financeiro: 0,
  });

  const carregar = useCallback(async (forcarCache = false) => {
    if (!enabled || !userId) return;
    try {
      const visto = obterTimestampsVisto(userId);
      const data = await fetchContadoresMenu({
        refresh: forcarCache,
        os_desde: visto.os,
        pcp_desde: visto.pcp,
        expedicao_desde: visto.expedicao,
        financeiro_desde: visto.financeiro,
      });
      setContadores(data);
    } catch {
      // Silencioso: badge é auxiliar; falha não deve quebrar o layout.
    }
  }, [enabled, userId]);

  useEffect(() => {
    void carregar();
    if (!enabled || !userId) return;

    const timer = window.setInterval(() => {
      void carregar();
    }, INTERVALO_MS);

    const onFocus = () => void carregar();
    const onRefresh = (event: Event) => {
      const detail = (event as CustomEvent<SidebarBadgesRefreshDetail>).detail;
      void carregar(detail?.forcar ?? false);
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener(SIDEBAR_BADGES_REFRESH_EVENT, onRefresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener(SIDEBAR_BADGES_REFRESH_EVENT, onRefresh);
    };
  }, [carregar, enabled, userId]);

  useEffect(() => {
    if (pathnameAnteriorRef.current === pathname) return;
    pathnameAnteriorRef.current = pathname;
    void carregar();
  }, [pathname, carregar]);

  return { contadores, recarregar: carregar };
}
