'use client';

import { ClipboardList, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { adminApi } from '@/lib/gestao/admin-api';
import {
  formatAdminDate,
  formatAdminTimelineTitle,
} from '@/lib/gestao/admin-labels';
import { AdminStoreTimelineEvent } from '@/lib/gestao/admin-types';

interface TimelineResponse {
  data: AdminStoreTimelineEvent[];
  definitions?: Record<string, string>;
}

export function AdminStoreTimeline({ storeId }: { storeId: string }) {
  const [events, setEvents] = useState<AdminStoreTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.getStoreTimeline<TimelineResponse>(
        storeId,
        50,
      );
      setEvents(response.data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Não foi possível carregar a timeline da loja.',
      );
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-primary" />
            Timeline da loja
          </CardTitle>
          <CardDescription>
            Exclusões de orçamento e ações administrativas vinculadas a esta
            loja. Útil para suporte (“quem excluiu o orçamento?”).
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            Atualizar
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/gestao/auditoria?lojaId=${encodeURIComponent(storeId)}`}>
              Auditoria admin filtrada
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum evento registrado para esta loja ainda.
          </p>
        ) : (
          <ol className="space-y-4">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">
                      {formatAdminTimelineTitle(event)}
                    </p>
                    {event.summary && (
                      <p className="text-sm text-muted-foreground">
                        {event.summary}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {event.actor
                        ? `${event.actor.kind === 'ADMIN_USER' ? 'Admin' : 'Usuário da loja'}: ${event.actor.nome}${
                            event.actor.email ? ` · ${event.actor.email}` : ''
                          }`
                        : 'Autor não identificado'}
                    </p>
                    {event.reason && (
                      <p className="text-sm">
                        Motivo:{' '}
                        <span className="text-muted-foreground">
                          {event.reason}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <Badge variant="outline">
                      {event.source === 'ADMIN_AUDIT'
                        ? 'Gestão'
                        : 'Operação da loja'}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {formatAdminDate(event.at)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
