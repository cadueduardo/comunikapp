'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { IconLoader2 } from '@tabler/icons-react';
import type { AgendaInstalacaoEvento } from '@/lib/instalacao/instalacao.types';

const InstalacaoCalendarioRbc = dynamic(
  () =>
    import('./InstalacaoCalendarioRbc').then(
      (mod) => mod.InstalacaoCalendarioRbc,
    ),
  {
    ssr: false,
    loading: () => (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-24 text-muted-foreground">
          <IconLoader2 className="mr-2 h-5 w-5 animate-spin" />
          Carregando calendário...
        </CardContent>
      </Card>
    ),
  },
);

interface InstalacaoCalendarioProps {
  onEventoClick: (evento: AgendaInstalacaoEvento) => void;
  /** Layout lateral no desktop (~40% da largura). */
  compacto?: boolean;
}

export function InstalacaoCalendario({
  onEventoClick,
  compacto = false,
}: InstalacaoCalendarioProps) {
  return (
    <InstalacaoCalendarioRbc
      onEventoClick={onEventoClick}
      compacto={compacto}
    />
  );
}
