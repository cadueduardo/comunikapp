'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  marcarModuloVisto,
  resolverModuloPorPathname,
} from '@/lib/sidebar-badge-seen';

interface SidebarBadgeSyncProps {
  userId: string | undefined;
  onModuloVisto: () => void;
}

/**
 * Ao entrar em OS / PCP / Expedição / Financeiro, marca o módulo como visto
 * e zera o badge até chegar um item novo na fila.
 */
export function SidebarBadgeSync({ userId, onModuloVisto }: SidebarBadgeSyncProps) {
  const pathname = usePathname();
  const ultimoPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || !pathname) return;

    const modulo = resolverModuloPorPathname(pathname);
    if (!modulo) return;

    if (ultimoPathRef.current === pathname) return;
    ultimoPathRef.current = pathname;

    marcarModuloVisto(userId, modulo);
    onModuloVisto();
  }, [pathname, userId, onModuloVisto]);

  return null;
}
