'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { NotificacoesDropdown } from '@/components/ui/notificacoes-dropdown';
import { LogOut, User } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { resolveAssetUrl } from '@/lib/config';

export function MainHeader() {
  const { user, logout, getFirstName } = useUser();
  const router = useRouter();

  const lojaNome = user?.loja?.nome?.trim() || 'Minha loja';
  const lojaLogoUrl = resolveAssetUrl(user?.loja?.logo_url);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 dark:border-neutral-700 dark:bg-neutral-900">
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

        <div className="flex shrink-0 items-center gap-4">
          <NotificacoesDropdown />

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 text-sm text-gray-700 dark:text-neutral-300 sm:flex">
              <User className="h-4 w-4" />
              <span>{getFirstName()}</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-100"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
