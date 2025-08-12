'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export type Localizacao = {
  id: string;
  loja_id: string;
  codigo: string;
  deposito: string;
  corredor?: string;
  prateleira?: string;
  nivel?: string;
  posicao?: string;
  descricao?: string;
  capacidade?: number | null;
  ativo: boolean;
  criado_em?: string;
  atualizado_em?: string;
};

interface ColumnsProps {
  onDelete?: (id: string, nome: string) => void;
}

export const createColumns = ({ onDelete }: ColumnsProps): ColumnDef<Localizacao>[] => [
  {
    accessorKey: 'codigo',
    header: 'Código',
    cell: ({ row }) => {
      const localizacao = row.original;
      return (
        <div className="font-medium">
          {localizacao.codigo}
        </div>
      );
    },
  },
  {
    accessorKey: 'deposito',
    header: 'Depósito',
    cell: ({ row }) => {
      const localizacao = row.original;
      return (
        <div>
          <div className="font-medium">{localizacao.deposito}</div>
          {localizacao.corredor && (
            <div className="text-sm text-gray-500">
              {[localizacao.corredor, localizacao.prateleira, localizacao.nivel, localizacao.posicao]
                .filter(Boolean)
                .join(' - ')}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'descricao',
    header: 'Descrição',
    cell: ({ row }) => {
      const localizacao = row.original;
      return (
        <div className="max-w-[200px] truncate">
          {localizacao.descricao || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'capacidade',
    header: 'Capacidade',
    cell: ({ row }) => {
      const localizacao = row.original;
      return (
        <div>
          {localizacao.capacidade ? `${localizacao.capacidade} un` : '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => {
      const localizacao = row.original;
      return (
        <Badge variant={localizacao.ativo ? 'default' : 'secondary'}>
          {localizacao.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const localizacao = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/estoque/localizacoes/editar/${localizacao.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete?.(localizacao.id, localizacao.deposito)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 