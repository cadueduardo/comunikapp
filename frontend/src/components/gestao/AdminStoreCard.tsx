'use client';

import { MoreHorizontal, Users } from 'lucide-react';
import Link from 'next/link';
import { AdminStatusBadge } from '@/components/gestao/AdminStatusBadge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatAdminDate } from '@/lib/gestao/admin-labels';
import { AdminStore } from '@/lib/gestao/admin-types';

interface AdminStoreCardProps {
  store: AdminStore;
  canChangeStatus: boolean;
  onChangeStatus: (store: AdminStore) => void;
}

export function AdminStoreCard({
  store,
  canChangeStatus,
  onChangeStatus,
}: AdminStoreCardProps) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/gestao/lojas/${store.id}`}
            className="block truncate font-medium text-foreground hover:underline"
          >
            {store.nome}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {store.email}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/gestao/lojas/${store.id}`}>Ver detalhes</Link>
            </DropdownMenuItem>
            {canChangeStatus && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChangeStatus(store)}>
                  Alterar status
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <AdminStatusBadge status={store.status} />
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="truncate">URL: {store.slug}</p>
        <p>
          Assinatura:{' '}
          <span className="text-foreground">
            {store.assinatura_ativa ? 'Ativa' : 'Inativa'}
          </span>
        </p>
        <p>Cadastro: {formatAdminDate(store.criado_em)}</p>
      </div>

      <div className="flex items-center gap-2 border-t border-border pt-3 text-sm">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span>{store.activeUsers} usuário(s) ativo(s)</span>
      </div>
    </div>
  );
}
