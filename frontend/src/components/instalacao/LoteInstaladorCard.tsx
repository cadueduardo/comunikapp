'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  STATUS_INSTALACAO_LABEL,
  STATUS_INSTALACAO_TONE,
} from '@/lib/instalacao/instalacao-labels';
import type { LoteInstaladorResumo } from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';
import { IconMapPin, IconPackage } from '@tabler/icons-react';
import Link from 'next/link';

const TONE_CLASSES = {
  default: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  success:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
  destructive:
    'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200',
};

interface LoteInstaladorCardProps {
  lote: LoteInstaladorResumo;
}

export function LoteInstaladorCard({ lote }: LoteInstaladorCardProps) {
  const os = lote.item_os.os;
  const tone = STATUS_INSTALACAO_TONE[lote.status_instalacao] ?? 'default';

  return (
    <Link href={`/instalador/lotes/${lote.id}`} className="block w-full min-w-0">
      <Card className="w-full min-w-0 border-border bg-card transition-colors hover:bg-accent/40">
        <CardContent className="flex w-full min-w-0 flex-col gap-3 p-4">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                OS {os.numero}
              </p>
              <p className="line-clamp-2 break-words text-xs text-muted-foreground">
                {os.nome_servico}
              </p>
            </div>
            <Badge
              className={cn('shrink-0 whitespace-nowrap', TONE_CLASSES[tone])}
            >
              {STATUS_INSTALACAO_LABEL[lote.status_instalacao]}
            </Badge>
          </div>

          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <IconMapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {lote.bairro}, {lote.cidade}/{lote.uf}
            </span>
          </div>

          <div className="flex min-w-0 items-center gap-2 text-sm text-foreground">
            <IconPackage className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {lote.quantidade_alocada} un. — {lote.item_os.produto_servico || 'Produto'}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
