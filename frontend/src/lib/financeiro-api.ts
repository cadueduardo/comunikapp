import { apiRequest } from './api';

// ============================================================================
// Tipos compartilhados com o backend (Fase 6 - Financeiro minimo)
// Mantidos manualmente em sincronia com:
//   backend/src/financeiro/interfaces/cobranca.interface.ts
//   backend/src/financeiro/enums/cobranca-status.enum.ts
// ============================================================================

export type CobrancaStatus =
  | 'PREVISTA'
  | 'PARCIAL_PAGO'
  | 'VENCIDO'
  | 'LIQUIDADO'
  | 'CANCELADA';

export type ParcelaStatus =
  | 'PREVISTO'
  | 'PARCIAL_PAGO'
  | 'VENCIDO'
  | 'LIQUIDADO'
  | 'CANCELADA';

export type ParcelaTipo = 'AVISTA' | 'ENTRADA' | 'SALDO' | 'PARCELA' | 'FATURADO';

export type RecebimentoMetodo =
  | 'PIX'
  | 'DINHEIRO'
  | 'TRANSFERENCIA'
  | 'CARTAO_DEBITO'
  | 'CARTAO_CREDITO'
  | 'BOLETO'
  | 'OUTRO';

export interface ParcelaResumo {
  id: string;
  ordem: number;
  tipo: string;
  valor_previsto: number;
  valor_recebido: number;
  data_vencimento: string;
  status: string;
  liquidado_em: string | null;
}

export interface CobrancaResumo {
  id: string;
  orcamento_id: string;
  orcamento_numero: string;
  orcamento_titulo: string | null;
  ordens_servico: { id: string; numero: string }[];
  cliente_id: string;
  cliente_nome: string | null;
  tipo: string;
  descricao: string;
  status: string;
  valor_total: number;
  valor_recebido: number;
  valor_saldo: number;
  data_aprovacao: string;
  liquidado_em: string | null;
  cancelado_em: string | null;
  proxima_parcela: ParcelaResumo | null;
  total_parcelas: number;
  criado_em: string;
}

export interface RecebimentoResumo {
  id: string;
  parcela_id: string;
  valor: number;
  data_recebimento: string;
  metodo: string;
  observacoes: string | null;
  forcado: boolean;
  usuario_id: string | null;
  usuario_nome: string | null;
  criado_em: string;
}

export interface CobrancaDetalhe extends CobrancaResumo {
  parcelas: ParcelaResumo[];
  recebimentos: RecebimentoResumo[];
}

export interface ListagemCobrancasResponse {
  data: CobrancaResumo[];
  meta: {
    total: number;
    pagina: number;
    por_pagina: number;
  };
}

export interface FiltrosCobranca {
  status?: string;
  cliente_id?: string;
  data_inicio?: string;
  data_fim?: string;
  pagina?: number;
  por_pagina?: number;
}

export interface RegistrarRecebimentoPayload {
  parcela_id?: string;
  valor: number;
  data_recebimento: string;
  metodo: RecebimentoMetodo;
  observacoes?: string;
  forcado?: boolean;
}

// ============================================================================
// API Client
// ============================================================================

function montarQueryString(params: Record<string, string | number | undefined>): string {
  const partes: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    partes.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return partes.length ? `?${partes.join('&')}` : '';
}

export async function fetchCobrancas(
  filtros: FiltrosCobranca = {},
): Promise<ListagemCobrancasResponse> {
  const qs = montarQueryString({
    status: filtros.status,
    cliente_id: filtros.cliente_id,
    data_inicio: filtros.data_inicio,
    data_fim: filtros.data_fim,
    pagina: filtros.pagina,
    por_pagina: filtros.por_pagina,
  });
  const response = await apiRequest(`/financeiro/cobrancas${qs}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? 'Erro ao listar cobranças');
  }
  return response.json();
}

export async function fetchCobrancaDetalhe(id: string): Promise<CobrancaDetalhe> {
  const response = await apiRequest(`/financeiro/cobrancas/${id}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? 'Erro ao carregar cobrança');
  }
  return response.json();
}

export async function registrarRecebimento(
  cobrancaId: string,
  payload: RegistrarRecebimentoPayload,
): Promise<CobrancaDetalhe> {
  const response = await apiRequest(`/financeiro/cobrancas/${cobrancaId}/recebimentos`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? 'Erro ao registrar recebimento');
  }
  return response.json();
}

export async function cancelarCobranca(
  cobrancaId: string,
  motivo?: string,
): Promise<CobrancaDetalhe> {
  const response = await apiRequest(`/financeiro/cobrancas/${cobrancaId}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? 'Erro ao cancelar cobrança');
  }
  return response.json();
}

/**
 * Faz o download do CSV de cobrancas. Triggera o download no navegador
 * via Blob + link temporario (nao retorna o conteudo para o caller).
 */
export async function exportarCobrancasCsv(filtros: FiltrosCobranca = {}): Promise<void> {
  const qs = montarQueryString({
    status: filtros.status,
    cliente_id: filtros.cliente_id,
    data_inicio: filtros.data_inicio,
    data_fim: filtros.data_fim,
  });
  const response = await apiRequest(`/financeiro/cobrancas/export.csv${qs}`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message ?? 'Erro ao exportar CSV');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `cobrancas-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
