'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PerfilAcoesMenu } from '@/components/usuarios/PerfilAcoesMenu';

export type PerfilRow = {
  id: string;
  nome: string;
  descricao?: string | null;
  sistema: boolean;
  ativo: boolean;
  usuariosCount: number;
};

type PerfilColumnsOptions = {
  onExcluir: (perfil: PerfilRow) => void;
  removingId?: string | null;
};

export const createPerfilColumns = ({
  onExcluir,
  removingId,
}: PerfilColumnsOptions): ColumnDef<PerfilRow>[] => [
  {
    accessorKey: 'nome',
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
  {
    accessorKey: 'descricao',
    header: 'Descrição',
    cell: ({ row }) => row.original.descricao || '—',
  },
  {
    accessorKey: 'usuariosCount',
    header: 'Usuários',
  },
  {
    id: 'tipo',
    header: 'Tipo',
    cell: ({ row }) =>
      row.original.sistema ? (
        <Badge variant="outline">Sistema</Badge>
      ) : (
        <Badge variant="secondary">Customizado</Badge>
      ),
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.ativo ? 'default' : 'secondary'}>
        {row.original.ativo ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
  },
  {
    id: 'acoes',
    header: 'Ações',
    cell: ({ row }) => (
      <div className="text-right">
        <PerfilAcoesMenu
          perfil={row.original}
          onExcluir={onExcluir}
          removingId={removingId}
        />
      </div>
    ),
  },
];
