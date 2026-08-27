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
import type { UsuarioRow } from '@/app/(main)/usuarios/columns';

export function UsuarioAcoesMenu({
  usuario,
  onDesativar,
  onReativar,
  removingId,
}: {
  usuario: UsuarioRow;
  onDesativar: (usuario: UsuarioRow) => void;
  onReativar: (usuario: UsuarioRow) => void;
  removingId?: string | null;
}) {
  const inativo = usuario.status === 'INATIVO';
  const ocupado = removingId === usuario.id;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={ocupado}>
          <span className="sr-only">Abrir ações de {usuario.nome_completo}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/usuarios/${usuario.id}`}>Ver</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/usuarios/${usuario.id}/editar`}>Editar</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {inativo ? (
          <DropdownMenuItem onClick={() => onReativar(usuario)}>
            Reativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDesativar(usuario)}
          >
            Desativar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
