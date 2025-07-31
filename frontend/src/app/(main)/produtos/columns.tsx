'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Package, Tag, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export type Produto = {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  nome_servico: string;
  descricao_produto?: string;
  horas_producao: number;
  largura_produto?: number;
  altura_produto?: number;
  area_produto?: number;
  unidade_medida_produto?: string;
  quantidade_padrao?: number;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
  itens: Array<{
    id: string;
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
    insumo: {
      id: string;
      nome: string;
      categoria: {
        nome: string;
      };
    };
  }>;
  maquinas: Array<{
    id: string;
    horas_utilizadas: number;
    custo_total: number;
    maquina: {
      id: string;
      nome: string;
    };
  }>;
  funcoes: Array<{
    id: string;
    horas_trabalhadas: number;
    custo_total: number;
    funcao: {
      id: string;
      nome: string;
    };
  }>;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatHours = (hours: number) => {
  return `${hours.toFixed(2)}h`;
};

export const createColumns = (onDelete: (id: string, nome: string) => void): ColumnDef<Produto>[] => [
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
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-500" />
          <span className="font-medium">{row.original.nome}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'categoria',
    header: 'Categoria',
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="text-xs">
          <Tag className="h-3 w-3 mr-1" />
          {row.original.categoria}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'nome_servico',
    header: 'Serviço',
    cell: ({ row }) => {
      return (
        <div className="max-w-[200px] truncate" title={row.original.nome_servico}>
          {row.original.nome_servico}
        </div>
      );
    },
  },
  {
    accessorKey: 'horas_producao',
    header: 'Horas',
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-gray-500" />
          <span>{formatHours(row.original.horas_producao)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'itens_count',
    header: 'Insumos',
    cell: ({ row }) => {
      const itensCount = row.original.itens.length;
      const custoTotal = row.original.itens.reduce((sum, item) => sum + item.custo_total, 0);
      
      return (
        <div className="text-sm">
          <div className="font-medium">{itensCount} insumo{itensCount !== 1 ? 's' : ''}</div>
          <div className="text-gray-500">{formatCurrency(custoTotal)}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => {
      const ativo = row.original.ativo;
      return (
        <Badge 
          variant={ativo ? 'default' : 'secondary'}
          className={`text-xs ${
            ativo 
              ? 'bg-green-100 text-green-800 border-green-200' 
              : 'bg-gray-100 text-gray-800 border-gray-200'
          }`}
        >
          {ativo ? '✅ Ativo' : '❌ Inativo'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const produto = row.original;

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
              <Link href={`/produtos/${produto.id}/editar`}>
                Editar Produto
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(produto.id, produto.nome)}
              className="text-red-600"
            >
              Excluir Produto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 