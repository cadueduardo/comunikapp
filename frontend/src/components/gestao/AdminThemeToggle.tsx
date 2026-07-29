'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function AdminThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" aria-label="Carregando tema">
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';
  const isSystem = theme === 'system' || theme === undefined;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        if (isSystem) setTheme(isDark ? 'light' : 'dark');
        else if (isDark) setTheme('light');
        else setTheme('system');
      }}
      aria-label="Alternar tema"
      title={
        isSystem
          ? 'Tema do sistema'
          : isDark
            ? 'Tema escuro'
            : 'Tema claro'
      }
    >
      {isSystem ? (
        <Monitor className="h-4 w-4" />
      ) : isDark ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
}

