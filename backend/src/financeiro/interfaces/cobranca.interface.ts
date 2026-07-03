/**
 * Interfaces de retorno da Cobranca para a API.
 *
 * Decimal e' convertido para number antes de sair do backend para evitar
 * confusao no consumidor (ja temos historico de bugs com Prisma.Decimal
 * serializando como string).
 */

export interface ParcelaResumo {
  id: string;
  ordem: number;
  tipo: string; // ParcelaTipo
  valor_previsto: number;
  valor_recebido: number;
  data_vencimento: string; // ISO 8601
  status: string; // ParcelaStatus
  liquidado_em: string | null;
}

export interface CobrancaResumo {
  id: string;
  orcamento_id: string;
  orcamento_numero: string;
  orcamento_titulo: string | null;
  ordens_servico: { id: string; numero: string }[];
  cliente_id: string | null;
  cliente_nome: string | null;
  tipo: string; // CondicaoPagamentoTipo
  descricao: string | null;
  status: string; // CobrancaStatus
  valor_total: number;
  valor_recebido: number;
  valor_saldo: number;
  data_aprovacao: string; // ISO 8601
  liquidado_em: string | null;
  cancelado_em: string | null;
  proxima_parcela: ParcelaResumo | null;
  proxima_parcela_recebivel: ParcelaResumo | null;
  pode_registrar_recebimento: boolean;
  motivo_bloqueio_recebimento: string | null;
  total_parcelas: number;
  criado_em: string;
}

export interface RecebimentoResumo {
  id: string;
  parcela_id: string | null;
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

/**
 * Dados que o orcamento passa ao financeiro no momento da aprovacao.
 */
export interface DadosCondicaoPagamentoOrcamento {
  tipo: string; // CondicaoPagamentoTipo
  entrada_pct: number | null; // 0-100
  parcelas: number | null; // >=2 quando PARCELADO
  descricao: string | null; // override do texto auto-gerado
  valor_total: number;
  data_aprovacao: Date;
  /** Prazo de entrega em dias corridos (parseado de orcamento.prazo_entrega). */
  prazo_entrega_dias: number;
  cliente_id: string | null;
}
