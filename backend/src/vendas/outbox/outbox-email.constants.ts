import { createHash } from 'crypto';

/** Eventos canônicos de e-mail interno (Fase 5 / DV-08). Lista fechada. */
export const OUTBOX_EVENTOS = {
  ATIVIDADE_ATRIBUIDA: 'ATIVIDADE_ATRIBUIDA',
  ATIVIDADE_REPROGRAMADA: 'ATIVIDADE_REPROGRAMADA',
  ATIVIDADE_VENCENDO: 'ATIVIDADE_VENCENDO',
} as const;

export type OutboxEvento =
  (typeof OUTBOX_EVENTOS)[keyof typeof OUTBOX_EVENTOS];

export const OUTBOX_TEMPLATES = {
  [OUTBOX_EVENTOS.ATIVIDADE_ATRIBUIDA]: 'vendas.atividade.atribuida',
  [OUTBOX_EVENTOS.ATIVIDADE_REPROGRAMADA]: 'vendas.atividade.reprogramada',
  [OUTBOX_EVENTOS.ATIVIDADE_VENCENDO]: 'vendas.atividade.vencendo',
} as const;

export const OUTBOX_ESTADOS = {
  PENDENTE: 'pendente',
  PROCESSANDO: 'processando',
  ENVIADO: 'enviado',
  DEAD_LETTER: 'dead_letter',
  DESCARTADO: 'descartado',
} as const;

export type OutboxEstado =
  (typeof OUTBOX_ESTADOS)[keyof typeof OUTBOX_ESTADOS];

export const OUTBOX_LOTE_MAX = 20;
export const OUTBOX_CONCURRENCY = 5;
export const OUTBOX_LOCK_TTL_MS = 5 * 60 * 1000;
export const OUTBOX_MAX_TENTATIVAS_DEFAULT = 5;
export const OUTBOX_MAX_TENTATIVAS_LIMITE = 8;

export const OUTBOX_RETENCAO_DIAS = {
  enviado: 30,
  descartado: 30,
  dead_letter: 90,
} as const;

export function hashEmailNormalizado(email: string): string {
  const normalizado = email.trim().toLowerCase();
  return createHash('sha256').update(normalizado, 'utf8').digest('hex');
}

export function emailPareceValido(email: string | null | undefined): boolean {
  if (!email) return false;
  const t = email.trim();
  // Validação sintática mínima — sem confirmar existência.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) && t.length <= 254;
}

export function chaveDedupAtribuida(
  atividadeId: string,
  responsavelId: string,
): string {
  return `email:ATIVIDADE_ATRIBUIDA:${atividadeId}:${responsavelId}`;
}

export function chaveDedupReprogramada(
  atividadeId: string,
  prazoIsoUtc: string,
): string {
  return `email:ATIVIDADE_REPROGRAMADA:${atividadeId}:${prazoIsoUtc}`;
}

export function chaveDedupVencendo(
  atividadeId: string,
  dataOperacionalYYYYMMDD: string,
): string {
  return `email:ATIVIDADE_VENCENDO:${atividadeId}:${dataOperacionalYYYYMMDD}`;
}

export function backoffMs(tentativaAposFalha: number): number {
  const base = 30_000;
  const exp = Math.min(tentativaAposFalha, 6);
  return Math.min(base * 2 ** (exp - 1), 60 * 60 * 1000);
}

export type PayloadAtribuida = {
  atividade_id: string;
  url_destino: string;
};

export type PayloadReprogramada = {
  atividade_id: string;
  prazo_iso: string;
  url_destino: string;
};

export type PayloadVencendo = {
  atividade_id: string;
  data_operacional: string;
  url_destino: string;
};

export type OutboxPayloadSanitizado =
  | PayloadAtribuida
  | PayloadReprogramada
  | PayloadVencendo;
