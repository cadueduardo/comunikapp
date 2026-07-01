import type {
  FilaPrecificacaoItem,
  OcorrenciaGestao,
  StatusFinanceiroOcorrencia,
} from '@/lib/instalacao/instalacao.types';

type OcorrenciaComValores = Pick<
  OcorrenciaGestao | FilaPrecificacaoItem,
  | 'status_financeiro'
  | 'preco_cliente'
  | 'preco_sugerido'
  | 'custo_interno'
  | 'custo_sugerido'
>;

/** Valor a cobrar do cliente (sugerido ou precificado; zero se já faturado/abonado). */
export function valorCobravelCliente(
  ocorrencia: OcorrenciaComValores,
): number {
  const status = ocorrencia.status_financeiro as StatusFinanceiroOcorrencia;
  if (status === 'FATURADO' || status === 'ABONADO' || status === 'CANCELADO') {
    return 0;
  }
  if (status === 'PRECIFICADO' && ocorrencia.preco_cliente != null) {
    return ocorrencia.preco_cliente;
  }
  return ocorrencia.preco_sugerido ?? 0;
}

export function podePrecificarOcorrencia(
  status: StatusFinanceiroOcorrencia,
): boolean {
  return status === 'PENDENTE_PRECIFICACAO';
}

export function podeGerarOsAditiva(
  ocorrencias: Array<Pick<OcorrenciaGestao, 'status_financeiro'>>,
): boolean {
  return ocorrencias.some((o) => o.status_financeiro === 'PRECIFICADO');
}

export function temOcorrenciasPendentesPrecificacao(
  ocorrencias: Array<Pick<OcorrenciaGestao, 'status_financeiro'>>,
): boolean {
  return ocorrencias.some(
    (o) => o.status_financeiro === 'PENDENTE_PRECIFICACAO',
  );
}

export function temBloqueioAprovacaoFinanceira(
  ocorrencias: Array<Pick<OcorrenciaGestao, 'status_financeiro'>>,
): boolean {
  return ocorrencias.some(
    (o) =>
      o.status_financeiro === 'PENDENTE_PRECIFICACAO' ||
      o.status_financeiro === 'PRECIFICADO',
  );
}
