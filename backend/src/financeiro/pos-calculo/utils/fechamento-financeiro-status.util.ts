import { StatusFechamentoFinanceiroOS } from '@prisma/client';

export type StatusFechamentoFinanceiro =
  keyof typeof StatusFechamentoFinanceiroOS;

export interface ResultadoFechamentoStatus {
  status: typeof StatusFechamentoFinanceiroOS.FECHADO;
  alterado: boolean;
}

export interface ResultadoReaberturaStatusOk {
  ok: true;
  status: typeof StatusFechamentoFinanceiroOS.REABERTO;
  versao: number;
  limparFechamento: true;
}

export interface ResultadoReaberturaStatusErro {
  ok: false;
  codigo: 'MOTIVO_OBRIGATORIO' | 'STATUS_INVALIDO';
  mensagem: string;
}

export type ResultadoReaberturaStatus =
  | ResultadoReaberturaStatusOk
  | ResultadoReaberturaStatusErro;

/** Transição idempotente para FECHADO (PENDENTE/EM_CONCILIACAO/REABERTO → FECHADO). */
export function transicionarParaFechado(
  statusAtual: StatusFechamentoFinanceiro,
): ResultadoFechamentoStatus {
  if (statusAtual === StatusFechamentoFinanceiroOS.FECHADO) {
    return {
      status: StatusFechamentoFinanceiroOS.FECHADO,
      alterado: false,
    };
  }

  return {
    status: StatusFechamentoFinanceiroOS.FECHADO,
    alterado: true,
  };
}

/** Reabertura exige motivo não vazio e status atual FECHADO; incrementa versão. */
export function transicionarParaReaberto(params: {
  statusAtual: StatusFechamentoFinanceiro;
  motivo: string | null | undefined;
  versaoAtual: number;
}): ResultadoReaberturaStatus {
  const motivo = params.motivo?.trim() ?? '';
  if (!motivo) {
    return {
      ok: false,
      codigo: 'MOTIVO_OBRIGATORIO',
      mensagem: 'Motivo é obrigatório para reabertura do fechamento financeiro.',
    };
  }

  if (params.statusAtual !== StatusFechamentoFinanceiroOS.FECHADO) {
    return {
      ok: false,
      codigo: 'STATUS_INVALIDO',
      mensagem:
        'Somente fechamento com status FECHADO pode ser reaberto.',
    };
  }

  return {
    ok: true,
    status: StatusFechamentoFinanceiroOS.REABERTO,
    versao: params.versaoAtual + 1,
    limparFechamento: true,
  };
}

/** Avisos soft do MVP: pendências críticas e saldo a pagar (não bloqueia fechamento). */
export function montarAvisosFechamentoMvp(
  pendencias: Array<Pick<PosCalculoPendenciaLike, 'tipo' | 'descricao' | 'severidade'>>,
): string[] {
  const avisos = new Set<string>();

  for (const pendencia of pendencias) {
    if (pendencia.severidade === 'critico') {
      avisos.add(pendencia.descricao);
    }
    if (pendencia.tipo === 'CONTA_A_PAGAR') {
      avisos.add(pendencia.descricao);
    }
  }

  return [...avisos];
}

interface PosCalculoPendenciaLike {
  tipo: string;
  descricao: string;
  severidade?: 'info' | 'alerta' | 'critico';
}
