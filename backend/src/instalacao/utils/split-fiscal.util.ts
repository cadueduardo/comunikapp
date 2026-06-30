import { TipoOcorrencia } from '@prisma/client';

export type TipoFaturamento = 'PRODUTO' | 'SERVICO';

export interface SplitFiscalDetalhe {
  origem: string;
  descricao: string;
  tipo_faturamento: TipoFaturamento;
  valor: number;
}

export interface SplitFiscalResultado {
  os_id: string;
  total_nfe: number;
  total_nfs: number;
  total_geral: number;
  detalhes: SplitFiscalDetalhe[];
  instrucao_nfe: string;
  instrucao_nfs: string;
}

export function tipoFaturamentoOcorrencia(
  tipo: TipoOcorrencia,
): TipoFaturamento {
  if (tipo === TipoOcorrencia.MATERIAL_EXTRA) {
    return 'PRODUTO';
  }
  return 'SERVICO';
}

export function arredondarMoeda(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function formatarMoedaBrl(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
