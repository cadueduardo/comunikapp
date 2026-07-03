'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  montarLinhasGridOs,
  type ModoGridOs,
  type OrdemServicoGridRow,
} from '@/lib/os-grid-aditiva.utils';
import type { OrdemServico } from '@/app/(main)/os/columns';
import { createColumns } from '@/app/(main)/os/columns';

interface OsGridTableProps {
  ordens: OrdemServico[];
  modo: ModoGridOs;
  onInativar: (id: string, motivo: string) => Promise<void>;
  onReativar: (id: string) => Promise<void>;
  onAprovar: (os: OrdemServico) => void;
}

export function OsGridTable({
  ordens,
  modo,
  onInativar,
  onReativar,
  onAprovar,
}: OsGridTableProps) {
  const router = useRouter();
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const onToggleExpand = React.useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const rows = React.useMemo(
    () => montarLinhasGridOs(ordens, { modo, expandedIds }),
    [ordens, modo, expandedIds],
  );

  const columns = React.useMemo(
    () =>
      createColumns(onInativar, onReativar, onAprovar, {
        onToggleExpand,
      }),
    [onInativar, onReativar, onAprovar, onToggleExpand],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const navegarParaOs = React.useCallback(
    (os: OrdemServico) => {
      const href = os.requer_atencao_instalacao
        ? `/os/${os.id}?tab=instalacao`
        : `/os/${os.id}`;
      router.push(href);
    },
    [router],
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const grid = (row.original as OrdemServicoGridRow).__grid;
                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'cursor-pointer hover:bg-muted/50',
                      grid?.tipo === 'filha' && 'bg-muted/20',
                      row.original.requer_atencao_instalacao &&
                        grid?.tipo !== 'filha' &&
                        'bg-amber-50/50 dark:bg-amber-950/15',
                    )}
                    onClick={() => navegarParaOs(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        onClick={
                          cell.column.id === 'actions' ||
                          cell.column.id === 'aprovacao'
                            ? (event) => event.stopPropagation()
                            : undefined
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum resultado encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}
