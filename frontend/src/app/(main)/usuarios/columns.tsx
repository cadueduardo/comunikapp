'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { UserRound, Pencil, UserX } from 'lucide-react';

export type UsuarioRow = {
  id: string;
  nome_completo: string;
  email: string;
  funcao: string;
  status: string;
};

type UsuarioColumnsOptions = {
  onDesativar: (usuario: UsuarioRow) => void;
  removingId?: string | null;
};

export const createUsuarioColumns = ({
  onDesativar,
  removingId,
}: UsuarioColumnsOptions): ColumnDef<UsuarioRow>[] => [
  { accessorKey: 'nome_completo', header: 'Nome' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'funcao', header: 'Função' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.status === 'ATIVO' ? 'default' : 'secondary'}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    id: 'acoes',
    header: 'Ações',
    cell: ({ row }) => {
      const usuario = row.original;
      const isInactive = usuario.status === 'INATIVO';
      const isRemoving = removingId === usuario.id;

      return (
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={`/usuarios/${usuario.id}`}>
              <UserRound className="w-4 h-4 mr-1" />
              Ver
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/usuarios/${usuario.id}/editar`}>
              <Pencil className="w-4 h-4 mr-1" />
              Editar
            </Link>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={isInactive || isRemoving}
            onClick={() => onDesativar(usuario)}
          >
            <UserX className="w-4 h-4 mr-1" />
            {isInactive ? 'Inativo' : isRemoving ? 'Removendo...' : 'Remover'}
          </Button>
        </div>
      );
    },
  },
];


