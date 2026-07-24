'use client';

import React from 'react';
import { IconMenu2 } from '@tabler/icons-react';
import { NotificacoesDropdown } from '@/components/ui/notificacoes-dropdown';
import { HeaderUserMenu } from '@/components/layout/HeaderUserMenu';
import { useSidebar } from '@/components/ui/sidebar';
import { resolveAssetUrl } from '@/lib/config';
import { useUser } from '@/contexts/UserContext';

export function MainHeader() {
  const { user } = useUser();
  const { open, setOpen } = useSidebar();

  const lojaNome = user?.loja?.nome?.trim() || 'Minha loja';
  const lojaLogoUrl = resolveAssetUrl(user?.loja?.logo_url);

  return (
    <header className="border-b border-gray-200 bg-white px-3 py-2.5 sm:px-6 sm:py-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Hambúrguer na mesma linha do header (só mobile) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-md p-2 text-neutral-800 lg:hidden dark:text-neutral-200"
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <IconMenu2 className="h-6 w-6" />
        </button>

        <div className="min-w-0 flex-1">
          {/* Mobile: só o nome da loja (sem logo). Desktop: logo se existir. */}
          {lojaLogoUrl ? (
            <>
              <h1 className="truncate text-lg font-semibold text-gray-900 lg:hidden dark:text-neutral-100">
                {lojaNome}
              </h1>
              <img
                src={lojaLogoUrl}
                alt={lojaNome}
                width={200}
                height={36}
                className="hidden h-9 w-auto max-w-[200px] object-contain object-left lg:block"
                style={{ height: 36 }}
                decoding="sync"
                draggable={false}
              />
            </>
          ) : (
            <h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl dark:text-neutral-100">
              {lojaNome}
            </h1>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <NotificacoesDropdown />
          <HeaderUserMenu />
        </div>
      </div>
    </header>
  );
}
