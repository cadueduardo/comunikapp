'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Eye, Edit, Trash2, Share2 } from 'lucide-react';
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
import { formatCurrency } from '@/lib/utils';

export type Orcamento = {
  id: string;
  numero: string;
  nome_servico: string;
  descricao?: string;
  preco_final: number;
  criado_em: string;
  status_aprovacao?: string;
  cliente?: {
    id: string;
    nome: string;
  };
};

export const createColumns = (
  onDelete: (id: string, nome: string) => void,
  onShare: (orcamento: Orcamento) => void
): ColumnDef<Orcamento>[] => [
  {
    accessorKey: 'numero',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Número
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <Badge variant="secondary">#{row.original.numero}</Badge>;
    },
  },
  {
    accessorKey: 'nome_servico',
    header: 'Serviço',
  },
  {
    accessorKey: 'cliente.nome',
    header: 'Cliente',
    cell: ({ row }) => {
      return row.original.cliente?.nome || '-';
    },
  },
  {
    accessorKey: 'preco_final',
    header: 'Valor',
    cell: ({ row }) => {
      return (
        <span className="font-semibold text-green-600">
          {formatCurrency(row.original.preco_final)}
        </span>
      );
    },
  },
  {
    accessorKey: 'status_aprovacao',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status_aprovacao;
      if (!status || status === 'PENDENTE') {
        return <Badge variant="secondary">Pendente</Badge>;
      }
      
      return (
        <Badge 
          variant={
            status === 'APROVADO' ? 'default' :
            status === 'REJEITADO' ? 'destructive' :
            'secondary'
          }
          className={
            status === 'APROVADO' ? 'text-xs bg-green-100 text-green-800 border-green-200' :
            status === 'REJEITADO' ? 'text-xs' :
            status === 'NEGOCIANDO' ? 'text-xs bg-blue-100 text-blue-800 border-blue-200' :
            'text-xs'
          }
        >
          {status === 'APROVADO' ? '✅ Aprovado' :
           status === 'REJEITADO' ? '❌ Rejeitado' :
           status === 'NEGOCIANDO' ? '🔄 Negociando' :
           status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'criado_em',
    header: 'Data',
    cell: ({ row }) => {
      return new Date(row.original.criado_em).toLocaleDateString('pt-BR');
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const orcamento = row.original;
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
              <DropdownMenuItem onClick={() => onShare(orcamento)}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/orcamentos/${orcamento.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/orcamentos/${orcamento.id}/editar`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(orcamento.id, orcamento.nome_servico)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
]; 