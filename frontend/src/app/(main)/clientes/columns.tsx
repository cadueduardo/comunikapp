'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, Edit, Trash2, FileText } from 'lucide-react';
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

export type Cliente = {
  id: string;
  nome: string;
  tipo_pessoa: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  documento: string;
  email?: string;
  telefone?: string;
  cidade?: string;
  status_cliente: 'ATIVO' | 'INATIVO' | 'PROSPECT' | 'BLOQUEADO';
  criado_em: string;
};

export const createColumns = (
  onDelete: (id: string) => void
): ColumnDef<Cliente>[] => [
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
    accessorKey: 'documento',
    header: 'Documento',
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      return row.original.email || '-';
    },
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone',
    cell: ({ row }) => {
      return row.original.telefone || '-';
    },
  },
  {
    accessorKey: 'cidade',
    header: 'Cidade',
    cell: ({ row }) => {
      return row.original.cidade || '-';
    },
  },
  {
    accessorKey: 'tipo_pessoa',
    header: 'Tipo',
    cell: ({ row }) => {
      return (
        <Badge variant="outline">
          {row.original.tipo_pessoa === 'PESSOA_FISICA' ? 'P. Física' : 'P. Jurídica'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'status_cliente',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status_cliente;
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'ATIVO': return 'bg-green-100 text-green-800';
          case 'PROSPECT': return 'bg-blue-100 text-blue-800';
          case 'INATIVO': return 'bg-gray-100 text-gray-800';
          case 'BLOQUEADO': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      };
      
      return (
        <Badge className={`${getStatusColor(status)} hover:${getStatusColor(status)}`}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'criado_em',
    header: 'Desde',
    cell: ({ row }) => {
      return new Date(row.original.criado_em).toLocaleDateString('pt-BR');
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const cliente = row.original;
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
                <Link href={`/orcamentos/novo?clienteId=${cliente.id}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Novo Orçamento
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/clientes/editar/${cliente.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(cliente.id)}
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