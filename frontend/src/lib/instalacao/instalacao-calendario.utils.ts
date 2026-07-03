import type {
  AgendaInstalacaoEvento,
  TurnoPrevisaoInstalacao,
  VistaCalendarioInstalacao,
} from './instalacao.types';

const FUSO_AGENDA = 'America/Sao_Paulo';

const DIA_SEMANA_CURTO: Record<number, string> = {
  0: 'Dom',
  1: 'Seg',
  2: 'Ter',
  3: 'Qua',
  4: 'Qui',
  5: 'Sex',
  6: 'Sáb',
};

/** Chave YYYY-MM-DD alinhada ao backend (`chaveDiaAgenda`). */
export function chaveDiaBrasil(valor: string | Date): string {
  const data = typeof valor === 'string' ? new Date(valor) : valor;
  return data.toLocaleDateString('en-CA', { timeZone: FUSO_AGENDA });
}

/**
 * Dia civil de `data_previsao` (campo só-data, não horário).
 * Normaliza ISO legado em meia-noite UTC para o YYYY-MM-DD pretendido.
 */
export function chaveDiaPrevisaoAgenda(valor: string | Date): string {
  if (typeof valor === 'string') {
    const trimmed = valor.trim();
    const dateOnly = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateOnly) {
      const normalizada = new Date(`${dateOnly[1]}T12:00:00.000Z`);
      return normalizada.toLocaleDateString('en-CA', { timeZone: FUSO_AGENDA });
    }
  }
  const data = typeof valor === 'string' ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) {
    return '';
  }
  return data.toLocaleDateString('en-CA', { timeZone: FUSO_AGENDA });
}

export function hojeBrasil(): string {
  return chaveDiaBrasil(new Date());
}

export function adicionarDiasChave(chave: string, delta: number): string {
  const [ano, mes, dia] = chave.split('-').map(Number);
  const base = new Date(Date.UTC(ano, mes - 1, dia + delta, 12, 0, 0));
  return base.toISOString().slice(0, 10);
}

function diaSemanaBrasil(chave: string): number {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: FUSO_AGENDA,
    weekday: 'short',
  }).formatToParts(new Date(`${chave}T12:00:00.000Z`));
  const weekday = partes.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const mapa: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return mapa[weekday] ?? 1;
}

export function obterSegundaDaSemana(chave: string): string {
  const dow = diaSemanaBrasil(chave);
  const diffParaSegunda = dow === 0 ? -6 : 1 - dow;
  return adicionarDiasChave(chave, diffParaSegunda);
}

export function obterDiasSemana(chaveReferencia: string): string[] {
  const segunda = obterSegundaDaSemana(chaveReferencia);
  return Array.from({ length: 7 }, (_, i) => adicionarDiasChave(segunda, i));
}

export function obterPrimeiroDiaMes(chave: string): string {
  const [ano, mes] = chave.split('-');
  return `${ano}-${mes}-01`;
}

export function obterGradeMes(chaveReferencia: string): string[] {
  const primeiroMes = obterPrimeiroDiaMes(chaveReferencia);
  const segundaGrade = obterSegundaDaSemana(primeiroMes);
  return Array.from({ length: 42 }, (_, i) => adicionarDiasChave(segundaGrade, i));
}

export function calcularIntervaloVisivel(
  vista: VistaCalendarioInstalacao,
  chaveReferencia: string,
): { data_inicio: string; data_fim: string; dias: string[] } {
  if (vista === 'dia') {
    return {
      data_inicio: chaveReferencia,
      data_fim: chaveReferencia,
      dias: [chaveReferencia],
    };
  }

  if (vista === 'semana') {
    const dias = obterDiasSemana(chaveReferencia);
    return {
      data_inicio: dias[0],
      data_fim: dias[6],
      dias,
    };
  }

  const dias = obterGradeMes(chaveReferencia);
  return {
    data_inicio: dias[0],
    data_fim: dias[dias.length - 1],
    dias,
  };
}

export function formatarCabecalhoDia(chave: string, compacto = false): string {
  const data = new Date(`${chave}T12:00:00.000Z`);
  const diaSemana = DIA_SEMANA_CURTO[diaSemanaBrasil(chave)];
  const diaMes = data.toLocaleDateString('pt-BR', {
    timeZone: FUSO_AGENDA,
    day: '2-digit',
    month: compacto ? 'short' : 'long',
  });
  return `${diaSemana}, ${diaMes}`;
}

export function formatarTituloPeriodo(
  vista: VistaCalendarioInstalacao,
  chaveReferencia: string,
): string {
  const data = new Date(`${chaveReferencia}T12:00:00.000Z`);

  if (vista === 'dia') {
    return data.toLocaleDateString('pt-BR', {
      timeZone: FUSO_AGENDA,
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  if (vista === 'semana') {
    const dias = obterDiasSemana(chaveReferencia);
    const inicio = new Date(`${dias[0]}T12:00:00.000Z`);
    const fim = new Date(`${dias[6]}T12:00:00.000Z`);
    const fmtInicio = inicio.toLocaleDateString('pt-BR', {
      timeZone: FUSO_AGENDA,
      day: '2-digit',
      month: 'short',
    });
    const fmtFim = fim.toLocaleDateString('pt-BR', {
      timeZone: FUSO_AGENDA,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `${fmtInicio} — ${fmtFim}`;
  }

  return data.toLocaleDateString('pt-BR', {
    timeZone: FUSO_AGENDA,
    month: 'long',
    year: 'numeric',
  });
}

export function navegarPeriodo(
  vista: VistaCalendarioInstalacao,
  chaveReferencia: string,
  direcao: -1 | 1,
): string {
  if (vista === 'dia') {
    return adicionarDiasChave(chaveReferencia, direcao);
  }

  if (vista === 'semana') {
    return adicionarDiasChave(chaveReferencia, direcao * 7);
  }

  const [ano, mes] = chaveReferencia.split('-').map(Number);
  const novoMes = mes - 1 + direcao;
  const data = new Date(Date.UTC(ano, novoMes, 1, 12, 0, 0));
  return data.toISOString().slice(0, 10);
}

export function mesmoMes(chaveA: string, chaveB: string): boolean {
  return chaveA.slice(0, 7) === chaveB.slice(0, 7);
}

/** Data local (componentes de calendário) a partir da chave YYYY-MM-DD. */
export function parseChaveLocalDate(chave: string): Date {
  const [ano, mes, dia] = chave.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12, 0, 0);
}

export function agruparEventosAgendaPorDia(
  eventos: AgendaInstalacaoEvento[],
): Map<string, AgendaInstalacaoEvento[]> {
  const mapa = new Map<string, AgendaInstalacaoEvento[]>();
  for (const evento of eventos) {
    const chave = chaveDiaPrevisaoAgenda(evento.data_previsao);
    const lista = mapa.get(chave) ?? [];
    lista.push(evento);
    mapa.set(chave, lista);
  }
  return mapa;
}

export function formatarResumoAgendamentosDia(
  eventos: AgendaInstalacaoEvento[],
): string {
  return eventos
    .map((evento) => {
      const equipe = evento.equipe_instalacao?.trim() || 'Equipe não definida';
      const turno = evento.turno_previsao
        ? TURNO_PREVISAO_LABEL[evento.turno_previsao] ?? evento.turno_previsao
        : 'Turno não definido';
      return `OS ${evento.os_numero} — ${equipe} (${turno})`;
    })
    .join('\n');
}

const TURNO_PREVISAO_LABEL: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  INTEIRO: 'Dia inteiro',
};

export function obterUltimoDiaMes(chaveMes: string): string {
  const [ano, mes] = chaveMes.split('-').map(Number);
  const ultimo = new Date(Date.UTC(ano, mes, 0, 12, 0, 0));
  return ultimo.toISOString().slice(0, 10);
}

export function obterMesAnterior(chaveMes: string): string {
  const [ano, mes] = chaveMes.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 2, 1, 12, 0, 0));
  return data.toISOString().slice(0, 10);
}

export function obterProximoMes(chaveMes: string): string {
  const [ano, mes] = chaveMes.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes, 1, 12, 0, 0));
  return data.toISOString().slice(0, 10);
}

export interface EventoCalendarioInstalacao {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: AgendaInstalacaoEvento;
}

const FAIXAS_TURNO: Record<
  TurnoPrevisaoInstalacao,
  { inicioH: number; fimH: number; diaInteiro: boolean }
> = {
  MANHA: { inicioH: 8, fimH: 12, diaInteiro: false },
  TARDE: { inicioH: 13, fimH: 18, diaInteiro: false },
  INTEIRO: { inicioH: 8, fimH: 18, diaInteiro: true },
};

export function agendaEventoParaCalendario(
  evento: AgendaInstalacaoEvento,
): EventoCalendarioInstalacao {
  const chave = chaveDiaPrevisaoAgenda(evento.data_previsao);
  const [ano, mes, dia] = chave.split('-').map(Number);
  const turno = evento.turno_previsao ?? 'INTEIRO';
  const faixa = FAIXAS_TURNO[turno];

  const cliente = evento.cliente_nome ?? 'Cliente não informado';
  const title = `OS ${evento.os_numero} — ${cliente}`;

  if (faixa.diaInteiro) {
    const start = new Date(ano, mes - 1, dia, 0, 0, 0, 0);
    const end = new Date(ano, mes - 1, dia + 1, 0, 0, 0, 0);
    return {
      id: evento.lote_id,
      title,
      start,
      end,
      allDay: true,
      resource: evento,
    };
  }

  return {
    id: evento.lote_id,
    title,
    start: new Date(ano, mes - 1, dia, faixa.inicioH, 0, 0),
    end: new Date(ano, mes - 1, dia, faixa.fimH, 0, 0),
    allDay: false,
    resource: evento,
  };
}

export function extrairLotesEmConflito(
  conflitos: Array<{ lotes: Array<{ lote_id: string }> }>,
): Set<string> {
  const ids = new Set<string>();
  for (const conflito of conflitos) {
    for (const lote of conflito.lotes) {
      ids.add(lote.lote_id);
    }
  }
  return ids;
}

export function calcularIntervaloConflitosLotes(
  lotes: Array<{ data_previsao: string | null }>,
): { data_inicio: string; data_fim: string } | null {
  const chaves = lotes
    .map((lote) => (lote.data_previsao ? chaveDiaPrevisaoAgenda(lote.data_previsao) : null))
    .filter((chave): chave is string => Boolean(chave));

  if (chaves.length === 0) {
    return null;
  }

  const ordenadas = [...chaves].sort();
  return {
    data_inicio: ordenadas[0],
    data_fim: ordenadas[ordenadas.length - 1],
  };
}

export function vistaRbcParaInterna(
  view: string,
): VistaCalendarioInstalacao {
  if (view === 'day') return 'dia';
  if (view === 'month') return 'mes';
  return 'semana';
}
