/**
 * Mapeamento entre o eixo comercial canônico (DV-14) e o `status` legado.
 * Fonte: docs/modulo-vendas/fase-0/04-maquina-de-estados-comercial.md §7.
 */

export enum OrcamentoStatusComercial {
  RASCUNHO = 'rascunho',
  AGUARDANDO_ALCADA = 'aguardando_alcada',
  ENVIADA = 'enviada',
  EM_NEGOCIACAO = 'em_negociacao',
  REVISAO_SOLICITADA = 'revisao_solicitada',
  EXPIRADA = 'expirada',
  ACEITA = 'aceita',
  PEDIDO_CONFIRMADO = 'pedido_confirmado',
  PERDIDA = 'perdida',
  CANCELADA = 'cancelada',
}

/** Valores legados ainda gravados em `orcamento.status` para compatibilidade. */
export enum OrcamentoStatusLegado {
  RASCUNHO = 'rascunho',
  PENDENTE = 'pendente',
  ENVIADO = 'enviado',
  EM_ANALISE = 'em_analise',
  NEGOCIANDO = 'negociando',
  APROVADO = 'aprovado',
  REJEITADO = 'rejeitado',
  EM_EXECUCAO = 'em_execucao',
  CONCLUIDO = 'concluido',
  CANCELADO = 'cancelado',
}

export type StatusAprovacaoDerivado =
  | 'PENDENTE'
  | 'APROVADO'
  | 'REJEITADO'
  | 'CANCELADO';

function normalizar(status: string | null | undefined): string {
  return String(status ?? '')
    .trim()
    .toLowerCase();
}

/**
 * Converte o status legado (ou valor fora do enum antigo) para o eixo comercial.
 * `possuiOs` distingue `aprovado` → `aceita` vs `pedido_confirmado`.
 */
export function mapearStatusLegadoParaComercial(
  statusLegado: string | null | undefined,
  possuiOs = false,
): OrcamentoStatusComercial {
  const valor = normalizar(statusLegado);

  switch (valor) {
    case OrcamentoStatusLegado.RASCUNHO:
    case OrcamentoStatusLegado.PENDENTE:
    case '':
      return OrcamentoStatusComercial.RASCUNHO;
    case OrcamentoStatusLegado.ENVIADO:
    case OrcamentoStatusLegado.EM_ANALISE:
      return OrcamentoStatusComercial.ENVIADA;
    case OrcamentoStatusLegado.NEGOCIANDO:
      return OrcamentoStatusComercial.EM_NEGOCIACAO;
    case OrcamentoStatusLegado.APROVADO:
      return possuiOs
        ? OrcamentoStatusComercial.PEDIDO_CONFIRMADO
        : OrcamentoStatusComercial.ACEITA;
    case OrcamentoStatusLegado.REJEITADO:
      return OrcamentoStatusComercial.PERDIDA;
    case OrcamentoStatusLegado.EM_EXECUCAO:
    case OrcamentoStatusLegado.CONCLUIDO:
      return OrcamentoStatusComercial.PEDIDO_CONFIRMADO;
    case OrcamentoStatusLegado.CANCELADO:
      return OrcamentoStatusComercial.CANCELADA;
    case OrcamentoStatusComercial.AGUARDANDO_ALCADA:
    case OrcamentoStatusComercial.ENVIADA:
    case OrcamentoStatusComercial.EM_NEGOCIACAO:
    case OrcamentoStatusComercial.REVISAO_SOLICITADA:
    case OrcamentoStatusComercial.EXPIRADA:
    case OrcamentoStatusComercial.ACEITA:
    case OrcamentoStatusComercial.PEDIDO_CONFIRMADO:
    case OrcamentoStatusComercial.PERDIDA:
    case OrcamentoStatusComercial.CANCELADA:
      return valor as OrcamentoStatusComercial;
    default:
      return OrcamentoStatusComercial.RASCUNHO;
  }
}

/** Derivação inversa: o que gravar em `orcamento.status` a partir do canônico. */
export function mapearStatusComercialParaLegado(
  statusComercial: OrcamentoStatusComercial | string,
): OrcamentoStatusLegado {
  switch (normalizar(statusComercial)) {
    case OrcamentoStatusComercial.RASCUNHO:
    case OrcamentoStatusComercial.AGUARDANDO_ALCADA:
      return OrcamentoStatusLegado.RASCUNHO;
    case OrcamentoStatusComercial.ENVIADA:
    case OrcamentoStatusComercial.EXPIRADA:
      return OrcamentoStatusLegado.ENVIADO;
    case OrcamentoStatusComercial.EM_NEGOCIACAO:
    case OrcamentoStatusComercial.REVISAO_SOLICITADA:
      return OrcamentoStatusLegado.NEGOCIANDO;
    case OrcamentoStatusComercial.ACEITA:
    case OrcamentoStatusComercial.PEDIDO_CONFIRMADO:
      return OrcamentoStatusLegado.APROVADO;
    case OrcamentoStatusComercial.PERDIDA:
      return OrcamentoStatusLegado.REJEITADO;
    case OrcamentoStatusComercial.CANCELADA:
      return OrcamentoStatusLegado.CANCELADO;
    default:
      return OrcamentoStatusLegado.RASCUNHO;
  }
}

/**
 * `status_aprovacao` continua derivado do mesmo ponto de escrita até os
 * consumidores serem migrados. Não recebe escrita direta em código novo.
 */
export function mapearStatusComercialParaAprovacao(
  statusComercial: OrcamentoStatusComercial | string,
): StatusAprovacaoDerivado {
  switch (normalizar(statusComercial)) {
    case OrcamentoStatusComercial.ACEITA:
    case OrcamentoStatusComercial.PEDIDO_CONFIRMADO:
      return 'APROVADO';
    case OrcamentoStatusComercial.PERDIDA:
      return 'REJEITADO';
    case OrcamentoStatusComercial.CANCELADA:
      return 'CANCELADO';
    default:
      return 'PENDENTE';
  }
}

/** Payload de dual-write a partir de um status legado recebido pela API. */
export function montarAtualizacaoStatusDual(
  statusLegado: string,
  possuiOs = false,
): {
  status: string;
  status_comercial: OrcamentoStatusComercial;
  status_aprovacao: StatusAprovacaoDerivado;
} {
  const status_comercial = mapearStatusLegadoParaComercial(
    statusLegado,
    possuiOs,
  );
  return {
    status: normalizar(statusLegado) || OrcamentoStatusLegado.RASCUNHO,
    status_comercial,
    status_aprovacao: mapearStatusComercialParaAprovacao(status_comercial),
  };
}
