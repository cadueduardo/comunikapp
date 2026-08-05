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

export interface Atividade {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  origem?: string | null;
  prazo: string;
  prazo_desejado?: string | null;
  concluida_em?: string | null;
  responsavel_id: string;
  cliente_id?: string | null;
  criado_em: string;
}

export function createAtividadesColumns(
  onConcluir: (atividade: Atividade) => void,
  podeGerenciar: boolean,
): ColumnDef<Atividade>[] {
  return [
    {
      accessorKey: 'titulo',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="max-w-[280px]">
          <p className="truncate font-medium text-foreground">
            {row.original.titulo}
          </p>
          {row.original.descricao ? (
            <p className="truncate text-xs text-muted-foreground">
              {row.original.descricao}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
      cell: ({ row }) => <Badge variant="secondary">{row.original.tipo}</Badge>,
    },
    {
      accessorKey: 'prazo',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Prazo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const d = new Date(row.original.prazo);
        return (
          <span className="text-sm text-foreground">
            {Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('pt-BR')}
          </span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.concluida_em ? (
          <Badge variant="outline">Concluída</Badge>
        ) : (
          <Badge>Aberta</Badge>
        ),
    },
    {
      id: 'acoes',
      enableHiding: false,
      cell: ({ row }) => {
        const atividade = row.original;
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
              <DropdownMenuItem asChild>
                <Link href={`/vendas/atividades?id=${atividade.id}`}>
                  Ver
                </Link>
              </DropdownMenuItem>
              {atividade.cliente_id ? (
                <DropdownMenuItem asChild>
                  <Link href={`/clientes/${atividade.cliente_id}`}>
                    Cliente
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              {podeGerenciar && !atividade.concluida_em ? (
                <DropdownMenuItem onClick={() => onConcluir(atividade)}>
                  Concluir
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
