'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

export type UsuarioRow = {
  id: string;
  nome_completo: string;
  email: string;
  funcao: string;
  status: string;
};

export const usuarioColumns: ColumnDef<UsuarioRow>[] = [
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
];


