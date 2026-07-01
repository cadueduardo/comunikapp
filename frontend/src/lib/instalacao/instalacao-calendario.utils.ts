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
  const chave = chaveDiaBrasil(evento.data_previsao);
  const [ano, mes, dia] = chave.split('-').map(Number);
  const turno = evento.turno_previsao ?? 'INTEGRO';
  const faixa = FAIXAS_TURNO[turno];

  const cliente = evento.cliente_nome ?? 'Cliente não informado';
  const title = `OS ${evento.os_numero} — ${cliente}`;

  if (faixa.diaInteiro) {
    const data = new Date(ano, mes - 1, dia);
    return {
      id: evento.lote_id,
      title,
      start: data,
      end: data,
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

export function vistaRbcParaInterna(
  view: string,
): VistaCalendarioInstalacao {
  if (view === 'day') return 'dia';
  if (view === 'month') return 'mes';
  return 'semana';
}
