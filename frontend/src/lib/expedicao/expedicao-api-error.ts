import type { BloqueioFinanceiroConflictBody } from './expedicao.types';

export class ExpedicaoApiError extends Error {
  readonly status: number;
  readonly body: Record<string, unknown>;

  constructor(message: string, status: number, body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ExpedicaoApiError';
    this.status = status;
    this.body = body;
  }

  get isBloqueioFinanceiro(): boolean {
    return this.body.code === 'BLOQUEIO_FINANCEIRO';
  }

  get bloqueioFinanceiro(): BloqueioFinanceiroConflictBody | null {
    if (!this.isBloqueioFinanceiro) return null;
    return this.body as unknown as BloqueioFinanceiroConflictBody;
  }
}
