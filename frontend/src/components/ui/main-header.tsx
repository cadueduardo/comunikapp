'use client';

import React from 'react';
import { NotificacoesDropdown } from '@/components/ui/notificacoes-dropdown';
import { HeaderUserMenu } from '@/components/layout/HeaderUserMenu';
import { resolveAssetUrl } from '@/lib/config';
import { useUser } from '@/contexts/UserContext';

export function MainHeader() {
  const { user } = useUser();

  const lojaNome = user?.loja?.nome?.trim() || 'Minha loja';
  const lojaLogoUrl = resolveAssetUrl(user?.loja?.logo_url);

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center">
          {lojaLogoUrl ? (
            <img
              src={lojaLogoUrl}
              alt={lojaNome}
              width={200}
              height={36}
              className="block h-9 w-auto max-w-[200px] object-contain object-left"
              style={{ height: 36 }}
              decoding="sync"
              draggable={false}
            />
          ) : (
            <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-neutral-100">
              {lojaNome}
            </h1>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <NotificacoesDropdown />
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
