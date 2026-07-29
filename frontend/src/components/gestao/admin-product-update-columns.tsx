'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
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
import {
  PRODUCT_UPDATE_CATEGORY_LABELS,
  PRODUCT_UPDATE_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import { ProductUpdate } from '@/lib/gestao/admin-types';

export function createAdminProductUpdateColumns(options: {
  canWrite: boolean;
  canPublish: boolean;
  onRequestReview: (update: ProductUpdate) => void;
  onPublish: (update: ProductUpdate) => void;
}): ColumnDef<ProductUpdate>[] {
  return [
    {
      accessorKey: 'title',
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
        <div className="max-w-md">
          <p className="font-medium">{row.original.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {row.original.summary}
          </p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge>{PRODUCT_UPDATE_STATUS_LABELS[row.original.status]}</Badge>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => (
        <Badge variant="outline">
          {PRODUCT_UPDATE_CATEGORY_LABELS[row.original.category]}
        </Badge>
      ),
    },
    {
      accessorKey: 'version',
      header: 'Versão',
      cell: ({ row }) => row.original.version || '—',
    },
    {
      id: 'origin',
      header: 'Origem',
      cell: ({ row }) =>
        row.original.origin === 'DEPLOY_AUTOMATION'
          ? 'Deploy'
          : 'Manual',
    },
    {
      id: 'author',
      header: 'Autor',
      cell: ({ row }) =>
        row.original.author?.nome || 'Automação de deploy',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const update = row.original;
        const canRequestReview =
          update.status === 'DRAFT' && options.canWrite;
        const canPublish =
          update.status === 'IN_REVIEW' && options.canPublish;
        const canView = update.status === 'PUBLISHED';

        if (!canRequestReview && !canPublish && !canView) {
          return null;
        }

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
                {canRequestReview && (
                  <DropdownMenuItem
                    onClick={() => options.onRequestReview(update)}
                  >
                    Solicitar revisão
                  </DropdownMenuItem>
                )}
                {canPublish && (
                  <DropdownMenuItem onClick={() => options.onPublish(update)}>
                    Publicar
                  </DropdownMenuItem>
                )}
                {canView && (
                  <>
                    {(canRequestReview || canPublish) && (
                      <DropdownMenuSeparator />
                    )}
                    <DropdownMenuItem asChild>
                      <a
                        href={`/novidades/${update.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ver publicação
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
