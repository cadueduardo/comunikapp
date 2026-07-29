'use client';

import { MoreHorizontal } from 'lucide-react';
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

interface AdminProductUpdateCardProps {
  update: ProductUpdate;
  canWrite: boolean;
  canPublish: boolean;
  onRequestReview: (update: ProductUpdate) => void;
  onPublish: (update: ProductUpdate) => void;
}

export function AdminProductUpdateCard({
  update,
  canWrite,
  canPublish,
  onRequestReview,
  onPublish,
}: AdminProductUpdateCardProps) {
  const canRequestReview = update.status === 'DRAFT' && canWrite;
  const canPublishUpdate = update.status === 'IN_REVIEW' && canPublish;
  const canView = update.status === 'PUBLISHED';
  const hasActions = canRequestReview || canPublishUpdate || canView;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-foreground">{update.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {update.summary}
          </p>
        </div>
        {hasActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 shrink-0 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              {canRequestReview && (
                <DropdownMenuItem onClick={() => onRequestReview(update)}>
                  Solicitar revisão
                </DropdownMenuItem>
              )}
              {canPublishUpdate && (
                <DropdownMenuItem onClick={() => onPublish(update)}>
                  Publicar
                </DropdownMenuItem>
              )}
              {canView && (
                <>
                  {(canRequestReview || canPublishUpdate) && (
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
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge>{PRODUCT_UPDATE_STATUS_LABELS[update.status]}</Badge>
        <Badge variant="outline">
          {PRODUCT_UPDATE_CATEGORY_LABELS[update.category]}
        </Badge>
        <Badge variant="secondary">
          {update.origin === 'DEPLOY_AUTOMATION'
            ? 'Gerado pelo deploy'
            : 'Manual'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <p className="text-muted-foreground">Versão</p>
          <p className="font-medium">{update.version || 'Não informada'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Autor</p>
          <p className="truncate font-medium">
            {update.author?.nome || 'Automação de deploy'}
          </p>
        </div>
      </div>
    </div>
  );
}
