'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
} from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { InstalacaoCalendarioEvento } from '@/components/instalacao/InstalacaoCalendarioEvento';
import { useInstalacaoAgenda } from '@/hooks/useInstalacaoAgenda';
import {
  agendaEventoParaCalendario,
  calcularIntervaloVisivel,
  chaveDiaBrasil,
  hojeBrasil,
  parseChaveLocalDate,
  type EventoCalendarioInstalacao,
  vistaRbcParaInterna,
} from '@/lib/instalacao/instalacao-calendario.utils';
import type {
  AgendaInstalacaoEvento,
  ConflitoAgendaItem,
} from '@/lib/instalacao/instalacao.types';
import { INSTALACAO_CALENDARIO_MENSAGENS } from '@/lib/instalacao/instalacao-calendario.messages';
import { cn } from '@/lib/utils';
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconRefresh,
} from '@tabler/icons-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './instalacao-calendario-rbc.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: ptBR, weekStartsOn: 1 }),
  getDay,
  locales: { 'pt-BR': ptBR },
});

function agruparConflitosPorDia(conflitos: ConflitoAgendaItem[]) {
  const mapa = new Map<string, ConflitoAgendaItem[]>();
  for (const conflito of conflitos) {
    const chave = chaveDiaBrasil(conflito.data);
    const lista = mapa.get(chave) ?? [];
    lista.push(conflito);
    mapa.set(chave, lista);
  }
  return mapa;
}

interface InstalacaoCalendarioRbcProps {
  onEventoClick: (evento: AgendaInstalacaoEvento) => void;
  compacto?: boolean;
}

export function InstalacaoCalendarioRbc({
  onEventoClick,
  compacto = false,
}: InstalacaoCalendarioRbcProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(() => parseChaveLocalDate(hojeBrasil()));

  const chaveReferencia = chaveDiaBrasil(date);
  const vistaInterna = vistaRbcParaInterna(view);
  const intervalo = useMemo(
    () => calcularIntervaloVisivel(vistaInterna, chaveReferencia),
    [vistaInterna, chaveReferencia],
  );

  const { eventos, conflitos, carregando, erro, recarregar } = useInstalacaoAgenda(
    {
      data_inicio: intervalo.data_inicio,
      data_fim: intervalo.data_fim,
    },
  );

  const eventosCalendario = useMemo(
    () => eventos.map(agendaEventoParaCalendario),
    [eventos],
  );

  const conflitosPorDia = useMemo(
    () => agruparConflitosPorDia(conflitos),
    [conflitos],
  );

  const tituloPeriodo = useMemo(() => {
    if (view === Views.DAY) {
      return format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR });
    }
    if (view === Views.MONTH) {
      return format(date, 'MMMM yyyy', { locale: ptBR });
    }
    const inicio = parseChaveLocalDate(intervalo.dias[0]);
    const fim = parseChaveLocalDate(intervalo.dias[6]);
    return `${format(inicio, 'd MMM', { locale: ptBR })} — ${format(fim, 'd MMM yyyy', { locale: ptBR })}`;
  }, [view, date, intervalo.dias]);

  const navegar = useCallback((acao: 'PREV' | 'NEXT' | 'TODAY') => {
    if (acao === 'TODAY') {
      setDate(parseChaveLocalDate(hojeBrasil()));
      return;
    }
    const delta =
      view === Views.MONTH ? 30 : view === Views.WEEK ? 7 : 1;
    const novaChave =
      acao === 'PREV'
        ? chaveDiaBrasil(
            new Date(date.getFullYear(), date.getMonth(), date.getDate() - delta),
          )
        : chaveDiaBrasil(
            new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta),
          );
    setDate(parseChaveLocalDate(novaChave));
  }, [view, date]);

  const CabecalhoSemana = useCallback(
    ({ date: dataHeader }: { date: Date }) => {
      const chave = chaveDiaBrasil(dataHeader);
      const conflitosDia = conflitosPorDia.get(chave) ?? [];
      const label = format(dataHeader, 'EEE dd/MM', { locale: ptBR });

      return (
        <div className="flex flex-col items-center gap-0.5 py-1">
          <span className="capitalize">{label}</span>
          {conflitosDia.length > 0 && (
            <span
              className="rbc-header-rbc-conflict"
              title={`${conflitosDia.length} conflito(s) de equipe neste dia`}
            >
              <IconAlertTriangle className="h-3 w-3" />
            </span>
          )}
        </div>
      );
    },
    [conflitosPorDia],
  );

  const CabecalhoMes = useCallback(
    ({ date: dataHeader, label }: { date: Date; label: string }) => {
      const chave = chaveDiaBrasil(dataHeader);
      const conflitosDia = conflitosPorDia.get(chave) ?? [];

      return (
        <div className="flex items-center justify-center gap-1">
          <span>{label}</span>
          {conflitosDia.length > 0 && (
            <IconAlertTriangle
              className="h-3 w-3 text-destructive"
              title="Conflito de equipe"
            />
          )}
        </div>
      );
    },
    [conflitosPorDia],
  );

  const EventoCustomizado = useCallback(
    ({ event }: { event: EventoCalendarioInstalacao }) => (
      <InstalacaoCalendarioEvento
        evento={event.resource}
        compacto={compacto || view === Views.MONTH}
        onClick={() => onEventoClick(event.resource)}
      />
    ),
    [compacto, onEventoClick, view],
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className={cn('pb-3', compacto && 'px-3 pt-3')}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle
                className={cn(
                  'capitalize text-foreground',
                  compacto ? 'text-sm' : 'text-base',
                )}
              >
                {tituloPeriodo}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {eventos.length} visita(s)
                {conflitos.length > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-2 border-destructive/40 bg-destructive/10 text-destructive"
                  >
                    {conflitos.length} conflito(s)
                  </Badge>
                )}
              </p>
            </div>
            {carregando && (
              <IconLoader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Select
              value={view}
              onValueChange={(valor) => setView(valor as View)}
            >
              <SelectTrigger
                className={cn(
                  'border-border bg-background',
                  compacto ? 'h-8 w-[108px] text-xs' : 'h-9 w-[120px]',
                )}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Views.WEEK}>Semanal</SelectItem>
                <SelectItem value={Views.DAY}>Diária</SelectItem>
                <SelectItem value={Views.MONTH}>Mensal</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className={compacto ? 'h-8 px-2 text-xs' : undefined}
              onClick={() => navegar('TODAY')}
            >
              Hoje
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={compacto ? 'h-8 w-8' : 'h-9 w-9'}
              onClick={() => navegar('PREV')}
              aria-label="Período anterior"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={compacto ? 'h-8 w-8' : 'h-9 w-9'}
              onClick={() => navegar('NEXT')}
              aria-label="Próximo período"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={compacto ? 'h-8 px-2 text-xs' : undefined}
              disabled={carregando}
              onClick={() => void recarregar()}
            >
              <IconRefresh className="mr-1 h-3.5 w-3.5" />
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn('px-3 pb-3', !compacto && 'px-4 pb-4')}>
        {erro && (
          <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {erro}
          </div>
        )}

        <div
          className={cn(
            'instalacao-rbc min-w-0',
            compacto && 'instalacao-rbc--compact',
          )}
        >
          <Calendar
            localizer={localizer}
            culture="pt-BR"
            messages={INSTALACAO_CALENDARIO_MENSAGENS}
            events={eventosCalendario}
            view={view}
            date={date}
            onView={setView}
            onNavigate={(novaData) => setDate(novaData)}
            views={[Views.WEEK, Views.DAY, Views.MONTH]}
            defaultView={Views.WEEK}
            popup
            selectable={false}
            toolbar={false}
            style={{
              height: compacto ? 520 : 640,
            }}
            onSelectEvent={(evento) => onEventoClick(evento.resource)}
            components={{
              event: EventoCustomizado,
              week: { header: CabecalhoSemana },
              month: { dateHeader: CabecalhoMes },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
