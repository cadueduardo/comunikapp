'use client';

import { ColumnDef } from '@tanstack/react-table';
import {
  ArrowUpDown,
  Edit,
  FileText,
  MoreHorizontal,
  Trash2,
  UserRoundCog,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ClienteApi } from '@/lib/api-client';

/** Tipo de linha da listagem — espelha o resumo da API. */
export type Cliente = ClienteApi;

function statusClienteClass(status: string) {
  switch (status) {
    case 'ATIVO':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200';
    case 'PROSPECT':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200';
    case 'INATIVO':
      return 'bg-muted text-muted-foreground';
    case 'BLOQUEADO':
      return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export type ClienteColumnsOptions = {
  onInativar?: (cliente: ClienteApi) => void;
  onTransferir?: (cliente: ClienteApi) => void;
  podeEditar?: boolean;
};

/** Menu de ações compartilhado entre Tabela e Cards. */
export function ClienteAcoesMenu({
  cliente,
  onInativar,
  onTransferir,
  podeEditar = true,
}: {
  cliente: ClienteApi;
  onInativar?: (cliente: ClienteApi) => void;
  onTransferir?: (cliente: ClienteApi) => void;
  podeEditar?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu de ações</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/clientes/${cliente.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            Ver ficha
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/orcamentos-v2/novo?cliente_id=${cliente.id}`}>
            <FileText className="mr-2 h-4 w-4" />
            Novo orçamento
          </Link>
        </DropdownMenuItem>
        {podeEditar ? (
          <DropdownMenuItem asChild>
            <Link href={`/clientes/editar/${cliente.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar cadastro
            </Link>
          </DropdownMenuItem>
        ) : null}
        {onTransferir ? (
          <DropdownMenuItem onClick={() => onTransferir(cliente)}>
            <UserRoundCog className="mr-2 h-4 w-4" />
            Transferir carteira
          </DropdownMenuItem>
        ) : null}
        {onInativar ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onInativar(cliente)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Inativar
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const createColumns = (
  options: ClienteColumnsOptions,
): ColumnDef<Cliente>[] => [
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
      <Link
        href={`/clientes/${row.original.id}`}
        className="font-medium text-foreground hover:text-primary hover:underline"
      >
        {row.original.nome}
      </Link>
    ),
  },
  {
    accessorKey: 'documento',
    header: 'Documento',
  },
  {
    id: 'responsavel_comercial',
    header: 'Responsável comercial',
    cell: ({ row }) =>
      row.original.responsavel_comercial?.nome ?? (
        <span className="text-muted-foreground">Sem responsável</span>
      ),
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
    cell: ({ row }) => row.original.email || '—',
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone',
    cell: ({ row }) => row.original.telefone || '—',
  },
  {
    accessorKey: 'cidade',
    header: 'Cidade',
    cell: ({ row }) => row.original.cidade || '—',
  },
  {
    accessorKey: 'tipo_pessoa',
    header: 'Tipo',
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.original.tipo_pessoa === 'PESSOA_FISICA'
          ? 'P. Física'
          : 'P. Jurídica'}
      </Badge>
    ),
  },
  {
    accessorKey: 'status_cliente',
    header: 'Status',
    cell: ({ row }) => (
      <Badge className={statusClienteClass(row.original.status_cliente)}>
        {row.original.status_cliente}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <div className="text-right">
        <ClienteAcoesMenu
          cliente={row.original}
          onInativar={options.onInativar}
          onTransferir={options.onTransferir}
          podeEditar={options.podeEditar}
        />
      </div>
    ),
  },
];
