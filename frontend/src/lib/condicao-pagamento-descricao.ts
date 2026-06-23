/**
 * Gera texto legível da condição de pagamento estruturada (espelha backend ParcelasBuilderService).
 */
export type CondicaoPagamentoTipo =
  | 'A_VISTA'
  | 'ENTRADA_SALDO'
  | 'FATURADO_30'
  | 'FATURADO_60'
  | 'FATURADO_90'
  | 'PARCELADO'
  | 'PERSONALIZADO';

export function gerarDescricaoCondicaoPagamento(params: {
  tipo?: string | null;
  entradaPct?: number | null;
  parcelas?: number | null;
}): string {
  const tipo = params.tipo as CondicaoPagamentoTipo | undefined;
  switch (tipo) {
    case 'A_VISTA':
      return 'Pagamento à vista na aprovação';
    case 'ENTRADA_SALDO': {
      const pct = params.entradaPct ?? 50;
      return `${pct.toFixed(0)}% de entrada e ${(100 - pct).toFixed(0)}% no saldo (entrega)`;
    }
    case 'FATURADO_30':
      return 'Faturado 30 dias após aprovação';
    case 'FATURADO_60':
      return 'Faturado 60 dias após aprovação';
    case 'FATURADO_90':
      return 'Faturado 90 dias após aprovação';
    case 'PARCELADO':
      return `Parcelado em ${params.parcelas ?? 2}x sem juros`;
    case 'PERSONALIZADO':
      return 'Condição personalizada';
    default:
      return '';
  }
}

export function resolverTextoCondicaoPagamento(orcamento: {
  condicao_pagamento_descricao?: string | null;
  condicao_pagamento_tipo?: string | null;
  condicao_pagamento_entrada_pct?: number | null;
  condicao_pagamento_parcelas?: number | null;
  forma_pagamento?: string | null;
}): string {
  const customizada = orcamento.condicao_pagamento_descricao?.trim();
  if (customizada) return customizada;

  const gerada = gerarDescricaoCondicaoPagamento({
    tipo: orcamento.condicao_pagamento_tipo,
    entradaPct: orcamento.condicao_pagamento_entrada_pct,
    parcelas: orcamento.condicao_pagamento_parcelas,
  });
  if (gerada) return gerada;

  const legado = orcamento.forma_pagamento?.trim();
  if (legado) return legado;

  return '50% de entrada, restante na entrega';
}
