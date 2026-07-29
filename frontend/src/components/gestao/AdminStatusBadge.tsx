import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  STORE_STATUS_LABELS,
} from '@/lib/gestao/admin-labels';
import { StoreStatus } from '@/lib/gestao/admin-types';

const STATUS_CLASSES: Record<StoreStatus, string> = {
  ATIVO:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  PENDENTE_VERIFICACAO:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
  INATIVO:
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  BLOQUEADO:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300',
};

export function AdminStatusBadge({
  status,
}: {
  status: StoreStatus;
}) {
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap', STATUS_CLASSES[status])}
    >
      {STORE_STATUS_LABELS[status]}
    </Badge>
  );
}

