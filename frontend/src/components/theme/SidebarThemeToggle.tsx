'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { IconMoon, IconSun, IconDeviceDesktop } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Alterna claro/escuro. Primeira visita usa tema claro; opcional seguir o SO no submenu.
 */
export function SidebarThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { open, animate } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const followsSystem = theme === 'system' || theme === undefined;

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleResetSystem = () => {
    setTheme('system');
  };

  const label = !mounted
    ? 'Aparência'
    : followsSystem
      ? 'Seguir sistema'
      : isDark
        ? 'Tema escuro'
        : 'Tema claro';

  const Icon = !mounted ? (
    <IconSun className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
  ) : followsSystem ? (
    <IconDeviceDesktop className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
  ) : isDark ? (
    <IconMoon className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
  ) : (
    <IconSun className="h-5 w-5 flex-shrink-0 text-neutral-700 dark:text-neutral-200" />
  );

  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          'flex w-full items-center justify-start gap-2 py-2 text-left group/sidebar',
          'text-neutral-700 dark:text-neutral-200',
        )}
        aria-label={
          mounted
            ? followsSystem
              ? `Seguir sistema (${isDark ? 'escuro' : 'claro'}). Clique para fixar tema.`
              : isDark
                ? 'Ativar tema claro'
                : 'Ativar tema escuro'
            : 'Alternar aparência'
        }
        title={label}
      >
        {Icon}
        <motion.span
          animate={{
            display: animate ? (open ? 'inline-block' : 'none') : 'inline-block',
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="text-sm whitespace-pre transition duration-150 group-hover/sidebar:translate-x-1"
        >
          {label}
        </motion.span>
      </button>
      {mounted && !followsSystem && open && (
        <button
          type="button"
          onClick={handleResetSystem}
          className="w-full pl-9 text-left text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          Voltar a seguir o sistema
        </button>
      )}
    </div>
  );
}
