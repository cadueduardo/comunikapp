'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUser } from '@/contexts/UserContext';
import {
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconUsers,
} from '@tabler/icons-react';
import { ChevronDown, User } from 'lucide-react';

export function HeaderUserMenu() {
  const { user, logout, getFirstName } = useUser();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isDark = resolvedTheme === 'dark';
  const followsSystem = theme === 'system' || theme === undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-700 dark:text-neutral-200"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-100">
              {getFirstName().charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="hidden max-w-[120px] truncate sm:inline">
            {getFirstName()}
          </span>
          <ChevronDown className="hidden h-4 w-4 opacity-60 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4" />
              {getFirstName()}
            </span>
            {user?.email && (
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracoes" className="cursor-pointer">
            <IconSettings className="mr-2 h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/usuarios" className="cursor-pointer">
            <IconUsers className="mr-2 h-4 w-4" />
            Usuários
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Aparência
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={!mounted}
          onClick={() => setTheme('light')}
          className={mounted && !followsSystem && !isDark ? 'bg-accent' : ''}
        >
          <IconSun className="mr-2 h-4 w-4" />
          Tema claro
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!mounted}
          onClick={() => setTheme('dark')}
          className={mounted && !followsSystem && isDark ? 'bg-accent' : ''}
        >
          <IconMoon className="mr-2 h-4 w-4" />
          Tema escuro
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!mounted}
          onClick={() => setTheme('system')}
          className={mounted && followsSystem ? 'bg-accent' : ''}
        >
          <IconDeviceDesktop className="mr-2 h-4 w-4" />
          Seguir sistema
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 dark:text-red-400"
        >
          <IconLogout className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
