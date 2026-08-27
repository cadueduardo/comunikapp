'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { PerfilRow } from '@/app/(main)/usuarios/perfis/columns';

export function PerfilAcoesMenu({
  perfil,
  onExcluir,
  removingId,
}: {
  perfil: PerfilRow;
  onExcluir: (perfil: PerfilRow) => void;
  removingId?: string | null;
}) {
  const ocupado = removingId === perfil.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={ocupado}>
          <span className="sr-only">Abrir ações de {perfil.nome}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/usuarios/perfis/${perfil.id}`}>Ver</Link>
        </DropdownMenuItem>
        {!perfil.sistema && (
          <DropdownMenuItem asChild>
            <Link href={`/usuarios/perfis/${perfil.id}/editar`}>Editar</Link>
          </DropdownMenuItem>
        )}
        {!perfil.sistema && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onExcluir(perfil)}
            >
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
