'use client';

import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ADMIN_ROLE_LABELS,
  formatAdminAuditAction,
  formatAdminDate,
} from '@/lib/gestao/admin-labels';
import { AdminAuditEntry } from '@/lib/gestao/admin-types';

interface AdminAuditCardProps {
  entry: AdminAuditEntry;
  onOpenDetail: (entry: AdminAuditEntry) => void;
}

export function AdminAuditCard({
  entry,
  onOpenDetail,
}: AdminAuditCardProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">
            {formatAdminAuditAction(entry.action)}
          </h3>
          <p className="text-sm text-muted-foreground">
            {formatAdminDate(entry.occurred_at)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 shrink-0 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onOpenDetail(entry)}>
              Ver detalhes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{entry.resource_type}</Badge>
        {entry.category && <Badge variant="outline">{entry.category}</Badge>}
      </div>

      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          Administrador:{' '}
          <span className="text-foreground">
            {entry.admin_user?.nome || 'Sistema / anônimo'}
          </span>
          {entry.admin_user?.role
            ? ` (${ADMIN_ROLE_LABELS[entry.admin_user.role]})`
            : ''}
        </p>
        {entry.loja && (
          <p>
            Loja:{' '}
            <Link
              href={`/gestao/lojas/${entry.loja.id}`}
              className="text-foreground hover:underline"
            >
              {entry.loja.nome}
            </Link>
          </p>
        )}
        {entry.reason && (
          <p className="line-clamp-2">
            Motivo: <span className="text-foreground">{entry.reason}</span>
          </p>
        )}
      </div>
    </div>
  );
}
