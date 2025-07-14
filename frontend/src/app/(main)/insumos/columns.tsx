'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';



export type Insumo = {
  id: string;
  nome: string;
  unidade_medida: string;
  custo_unitario: number;
  estoque_minimo?: number | null;
  codigo_interno?: string | null;
  descricao_tecnica?: string | null;
  observacoes?: string | null;
  categoria: {
    id: string;
    nome: string;
  };
  fornecedor: {
    id: string;
    nome: string;
  };
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const createColumns = (onDelete: (id: string, nome: string) => void): ColumnDef<Insumo>[] => [
  {
    accessorKey: 'nome',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nome
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: 'categoria.nome',
    header: 'Categoria',
  },
  {
    accessorKey: 'custo_unitario',
    header: 'Custo Unitário',
    cell: ({ row }) => formatCurrency(row.original.custo_unitario),
  },
  {
    accessorKey: 'unidade_medida',
    header: 'Unidade',
  },
  {
    accessorKey: 'fornecedor.nome',
    header: 'Fornecedor',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const insumo = row.original;
      return (
        <div className="text-right">
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
                <Link href={`/insumos/editar/${insumo.id}`}>Editar</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(insumo.id, insumo.nome)}>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
]; 