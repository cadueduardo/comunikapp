'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type TipoFornecedor = 'INSUMO' | 'TERCEIRIZADO' | 'AMBOS';

export type Fornecedor = {
  id: string;
  nome: string;
  razao_social?: string | null;
  tipo: TipoFornecedor;
  ativo: boolean;
  contato_nome?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  cidade?: string | null;
  estado?: string | null;
  especialidades?: unknown;
  _count?: {
    insumos: number;
    itens_terceirizados: number;
  };
};

export const tipoFornecedorLabel: Record<TipoFornecedor, string> = {
  INSUMO: 'Insumos',
  TERCEIRIZADO: 'Terceirizado',
  AMBOS: 'Insumos e terceirização',
};

export const tipoFornecedorClassName: Record<TipoFornecedor, string> = {
  INSUMO: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  TERCEIRIZADO: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  AMBOS: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
};

export const especialidadesDoFornecedor = (valor: unknown): string[] =>
  Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === 'string')
    : [];

export const createColumns = (
  onDelete: (fornecedor: Fornecedor) => void,
): ColumnDef<Fornecedor>[] => [
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
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.nome}</div>
        {row.original.razao_social && (
          <div className="text-xs text-muted-foreground">
            {row.original.razao_social}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge className={tipoFornecedorClassName[row.original.tipo]}>
        {tipoFornecedorLabel[row.original.tipo]}
      </Badge>
    ),
  },
  {
    id: 'localizacao',
    header: 'Localização',
    cell: ({ row }) =>
      [row.original.cidade, row.original.estado].filter(Boolean).join(' / ') ||
      '-',
  },
  {
    id: 'contato',
    header: 'Contato',
    cell: ({ row }) => (
      <div className="max-w-56">
        <div>{row.original.contato_nome || row.original.whatsapp || '-'}</div>
        {row.original.email && (
          <div className="truncate text-xs text-muted-foreground">
            {row.original.email}
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'vinculos',
    header: 'Vínculos',
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">
        {row.original._count?.insumos ?? 0} insumo(s) ·{' '}
        {row.original._count?.itens_terceirizados ?? 0} item(ns)
      </div>
    ),
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.ativo ? 'outline' : 'secondary'}>
        {row.original.ativo ? 'Ativo' : 'Inativo'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const fornecedor = row.original;
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
                <Link
                  href={`/fornecedores/editar/${fornecedor.id}`}
                >
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(fornecedor)}>
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
