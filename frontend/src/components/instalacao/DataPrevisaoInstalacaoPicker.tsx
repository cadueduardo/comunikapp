'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { instalacaoApi } from '@/lib/instalacao/instalacao-api';
import {
  agruparEventosAgendaPorDia,
  formatarResumoAgendamentosDia,
  hojeBrasil,
  mesmoMes,
  obterGradeMes,
  obterMesAnterior,
  obterPrimeiroDiaMes,
  obterProximoMes,
  obterUltimoDiaMes,
  parseChaveLocalDate,
} from '@/lib/instalacao/instalacao-calendario.utils';
import type { AgendaInstalacaoEvento } from '@/lib/instalacao/instalacao.types';
import { cn } from '@/lib/utils';
import {
  IconAlertTriangle,
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
} from '@tabler/icons-react';

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

interface DataPrevisaoInstalacaoPickerProps {
  id?: string;
  valor: string;
  onChange: (valor: string) => void;
  equipeInstalacao?: string;
  disabled?: boolean;
  rotulo?: string;
}

function formatarDataExibicao(chave: string): string {
  if (!chave) return 'Selecione a data';
  const data = parseChaveLocalDate(chave);
  return data.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatarTituloMes(chaveMes: string): string {
  const data = parseChaveLocalDate(chaveMes);
  return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function DataPrevisaoInstalacaoPicker({
  id,
  valor,
  onChange,
  equipeInstalacao,
  disabled = false,
  rotulo = 'Data prevista',
}: DataPrevisaoInstalacaoPickerProps) {
  const [aberto, setAberto] = useState(false);
  const [mesVisivel, setMesVisivel] = useState(() =>
    obterPrimeiroDiaMes(valor || hojeBrasil()),
  );
  const [eventos, setEventos] = useState<AgendaInstalacaoEvento[]>([]);
  const [carregando, setCarregando] = useState(false);

  const eventosPorDia = useMemo(
    () => agruparEventosAgendaPorDia(eventos),
    [eventos],
  );

  const carregarMes = useCallback(async (chaveMes: string) => {
    setCarregando(true);
    try {
      const resposta = await instalacaoApi.consultarAgenda({
        data_inicio: chaveMes,
        data_fim: obterUltimoDiaMes(chaveMes),
      });
      setEventos(resposta.eventos);
    } catch {
      setEventos([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (!aberto) return;
    void carregarMes(mesVisivel);
  }, [aberto, mesVisivel, carregarMes]);

  useEffect(() => {
    if (!aberto || !valor) return;
    const mesValor = obterPrimeiroDiaMes(valor);
    if (!mesmoMes(mesValor, mesVisivel)) {
      setMesVisivel(mesValor);
    }
  }, [aberto, valor, mesVisivel]);

  const diasGrade = useMemo(() => obterGradeMes(mesVisivel), [mesVisivel]);
  const agendamentosSelecionados = valor
    ? (eventosPorDia.get(valor) ?? [])
    : [];

  const equipeNormalizada = equipeInstalacao?.trim().toLowerCase() ?? '';
  const conflitoEquipe = agendamentosSelecionados.some(
    (evento) =>
      equipeNormalizada.length > 0 &&
      (evento.equipe_instalacao?.trim().toLowerCase() ?? '') ===
        equipeNormalizada,
  );

  function selecionarDia(chave: string) {
    onChange(chave);
  }

  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{rotulo}</Label>
      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              'h-10 w-full min-w-0 justify-start px-3 text-left font-normal',
              !valor && 'text-muted-foreground',
            )}
          >
            <IconCalendar className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">{formatarDataExibicao(valor)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(calc(100vw-1.5rem),22rem)] p-3"
          align="start"
          side="bottom"
          avoidCollisions={false}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() =>
                setMesVisivel((atual) => obterMesAnterior(atual))
              }
              aria-label="Mês anterior"
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center text-sm font-medium capitalize">
              {formatarTituloMes(mesVisivel)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setMesVisivel((atual) => obterProximoMes(atual))}
              aria-label="Próximo mês"
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
            {DIAS_SEMANA.map((dia) => (
              <span key={dia}>{dia}</span>
            ))}
          </div>

          <div className="relative grid grid-cols-7 gap-1">
            {carregando && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-background/70">
                <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {diasGrade.map((chave) => {
              const diaMes = Number(chave.slice(8, 10));
              const foraDoMes = !mesmoMes(chave, mesVisivel);
              const agendamentosDia = eventosPorDia.get(chave) ?? [];
              const temAgendamento = agendamentosDia.length > 0;
              const selecionado = valor === chave;
              const hoje = chave === hojeBrasil();
              const resumo = temAgendamento
                ? formatarResumoAgendamentosDia(agendamentosDia)
                : undefined;

              return (
                <button
                  key={chave}
                  type="button"
                  title={resumo}
                  disabled={disabled}
                  onClick={() => {
                    selecionarDia(chave);
                  }}
                  className={cn(
                    'relative flex h-9 w-full items-center justify-center rounded-md text-sm transition-colors',
                    foraDoMes && 'text-muted-foreground/50',
                    !foraDoMes && !selecionado && 'hover:bg-muted',
                    selecionado &&
                      'bg-primary text-primary-foreground hover:bg-primary',
                    hoje &&
                      !selecionado &&
                      'ring-1 ring-primary/40 ring-inset',
                    temAgendamento &&
                      !selecionado &&
                      'bg-amber-500/15 font-semibold text-amber-900 dark:text-amber-100',
                  )}
                >
                  {diaMes}
                  {temAgendamento && (
                    <span
                      className={cn(
                        'absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full',
                        selecionado ? 'bg-primary-foreground' : 'bg-amber-600',
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Dia com instalação
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Selecionado
              </span>
            </div>

            {agendamentosSelecionados.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs text-amber-950 dark:text-amber-100">
                <p className="mb-1 flex items-center gap-1 font-medium">
                  <IconAlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  {agendamentosSelecionados.length} instalação(ões) neste dia
                </p>
                <ul className="space-y-0.5">
                  {agendamentosSelecionados.map((evento) => (
                    <li key={evento.lote_id} className="break-words">
                      OS {evento.os_numero} —{' '}
                      {evento.equipe_instalacao?.trim() ||
                        'Equipe não definida'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {valor && agendamentosSelecionados.length > 0 && (
        <Alert
          className={cn(
            'border-amber-500/40 bg-amber-500/10 py-2 text-amber-950 dark:text-amber-100 [&>svg]:text-amber-700',
            conflitoEquipe &&
              'border-destructive/50 bg-destructive/10 text-destructive [&>svg]:text-destructive',
          )}
        >
          <IconAlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            {conflitoEquipe ? (
              <>
                <strong>Atenção:</strong> a equipe{' '}
                <strong>{equipeInstalacao?.trim()}</strong> já tem instalação
                em {formatarDataExibicao(valor)}.
              </>
            ) : (
              <>
                Já existem {agendamentosSelecionados.length} instalação(ões)
                agendadas para {formatarDataExibicao(valor)}. Equipes:{' '}
                {[
                  ...new Set(
                    agendamentosSelecionados.map(
                      (e) => e.equipe_instalacao?.trim() || 'Não definida',
                    ),
                  ),
                ].join(', ')}
                .
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
