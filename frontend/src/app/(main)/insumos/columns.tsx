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
  unidade_compra: string;
  custo_unitario: number | string;
  quantidade_compra: number | string;
  unidade_uso: string;
  fator_conversao: number | string;
  largura?: number | string | null;
  altura?: number | string | null;
  unidade_dimensao?: string | null;
  tipo_calculo?: string | null;
  gramatura?: number | string | null;
  estoque_minimo?: number | string | null;
  codigo_interno?: string | null;
  descricao_tecnica?: string | null;
  observacoes?: string | null;
  ativo: boolean | string | number;
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
    header: 'Custo Total',
    cell: ({ row }) => {
      const custo = row.original.custo_unitario;
      if (custo === null || custo === undefined) return '-';
      return formatCurrency(Number(custo));
    },
  },
  {
    accessorKey: 'quantidade_compra',
    header: 'Qtd. Compra',
    cell: ({ row }) => {
      const insumo = row.original;
      const quantidade = insumo.quantidade_compra;
      const largura = insumo.largura;
      const altura = insumo.altura;
      const gramatura = insumo.gramatura;
      
      let display = `${Number(quantidade).toFixed(3)} ${insumo.unidade_compra}`;
      
      // Adicionar dimensões se disponíveis
      if (largura && altura) {
        display += ` (${Number(largura).toFixed(2)}x${Number(altura).toFixed(2)}m)`;
      }
      
      // Adicionar gramatura se disponível
      if (gramatura) {
        display += ` ${Number(gramatura).toFixed(1)}g`;
      }
      
      return display;
    },
  },
  {
    accessorKey: 'unidade_uso',
    header: 'Unidade Uso',
  },
  {
    accessorKey: 'fator_conversao',
    header: 'Fator Conv.',
    cell: ({ row }) => {
      const fator = row.original.fator_conversao;
      if (fator === null || fator === undefined) return '-';
      return Number(fator).toFixed(4);
    },
  },
  {
    accessorKey: 'fornecedor.nome',
    header: 'Fornecedor',
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => {
      const ativo = row.original.ativo;
      const isAtivo = Boolean(ativo);
      return (
        <span className={`px-2 py-1 rounded-full text-xs ${
          isAtivo 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isAtivo ? 'Ativo' : 'Inativo'}
        </span>
      );
    },
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