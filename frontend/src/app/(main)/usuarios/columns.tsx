'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UsuarioAcoesMenu } from '@/components/usuarios/UsuarioAcoesMenu';

export type UsuarioRow = {
  id: string;
  nome_completo: string;
  email: string;
  funcao: string;
  status: string;
};

type UsuarioColumnsOptions = {
  onDesativar: (usuario: UsuarioRow) => void;
  onReativar: (usuario: UsuarioRow) => void;
  removingId?: string | null;
};

export const createUsuarioColumns = ({
  onDesativar,
  onReativar,
  removingId,
}: UsuarioColumnsOptions): ColumnDef<UsuarioRow>[] => [
  {
    accessorKey: 'nome_completo',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Nome
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: 'email', header: 'E-mail' },
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
    cell: ({ row }) => (
      <div className="text-right">
        <UsuarioAcoesMenu
          usuario={row.original}
          onDesativar={onDesativar}
          onReativar={onReativar}
          removingId={removingId}
        />
      </div>
    ),
  },
];
