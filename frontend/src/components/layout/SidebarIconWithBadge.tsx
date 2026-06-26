'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarIconWithBadgeProps {
  children: React.ReactNode;
  count?: number;
  className?: string;
}

/**
 * Ícone do menu lateral com badge numérico (mesmo padrão do sino de notificações).
 */
export function SidebarIconWithBadge({
  children,
  count = 0,
  className,
}: SidebarIconWithBadgeProps) {
  const exibir = count > 0;

  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {children}
      {exibir && (
        <Badge
          variant="destructive"
          className="absolute -top-1.5 -right-1.5 h-4 min-w-4 rounded-full px-1 py-0 text-[10px] leading-none flex items-center justify-center"
        >
          {count > 9 ? '9+' : count}
        </Badge>
      )}
    </span>
  );
}
