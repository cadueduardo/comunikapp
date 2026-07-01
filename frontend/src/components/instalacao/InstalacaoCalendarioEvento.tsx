'use client';

import { Badge } from '@/components/ui/badge';
import {
  TURNO_PREVISAO_LABEL,
  TURNO_PREVISAO_TONE,
} from '@/lib/instalacao/instalacao-labels';
import type { AgendaInstalacaoEvento } from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';

const TURNO_BADGE_CLASSES = {
  manha:
    'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200',
  tarde: 'border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-200',
  inteiro:
    'border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-200',
};

interface InstalacaoCalendarioEventoProps {
  evento: AgendaInstalacaoEvento;
  compacto?: boolean;
  onClick?: () => void;
}

export function InstalacaoCalendarioEvento({
  evento,
  compacto = false,
  onClick,
}: InstalacaoCalendarioEventoProps) {
  const turno = evento.turno_previsao
    ? TURNO_PREVISAO_TONE[evento.turno_previsao]
    : null;
  const turnoLabel = evento.turno_previsao
    ? TURNO_PREVISAO_LABEL[evento.turno_previsao]
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-md border border-border bg-card p-2 text-left shadow-sm transition-colors hover:bg-muted/50',
        compacto ? 'p-1.5' : 'p-2',
      )}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          className={cn(
            'font-medium text-foreground',
            compacto ? 'text-[10px] leading-tight' : 'text-xs',
          )}
        >
          OS {evento.os_numero}
        </p>
        {turno && turnoLabel && (
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 px-1 py-0 text-[9px]',
              TURNO_BADGE_CLASSES[turno],
            )}
          >
            {turnoLabel}
          </Badge>
        )}
      </div>
      {!compacto && (
        <>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {evento.cliente_nome ?? 'Cliente não informado'}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {evento.equipe_instalacao?.trim() || 'Equipe não definida'}
          </p>
        </>
      )}
      {compacto && (
        <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
          {evento.cliente_nome ?? '—'}
        </p>
      )}
    </button>
  );
}
