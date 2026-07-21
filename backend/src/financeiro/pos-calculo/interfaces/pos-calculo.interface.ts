import type {
  PosCalculoCategoriaLinha,
  PosCalculoTotaisSaida,
} from '../utils/pos-calculo-aggregation.util';
import type { StatusFechamentoFinanceiroOS } from '@prisma/client';

export interface PosCalculoPendencia {
  tipo: string;
  descricao: string;
  severidade?: 'info' | 'alerta' | 'critico';
}

export interface PosCalculoMeta {
  moeda: string;
  visao_margem: 'caixa';
  status_fechamento: StatusFechamentoFinanceiroOS;
  custo_previsto_fonte?: string;
  limitacoes?: string[];
}

export type PosCalculoTrocaFornecedorTipo =
  | 'SUBSTITUICAO_PEDIDO'
  | 'DESVIO_PREVISTO';

export interface PosCalculoTrocaFornecedor {
  tipo: PosCalculoTrocaFornecedorTipo;
  pedido_id?: string;
  pedido_numero?: string;
  fornecedor_previsto_id?: string;
  fornecedor_previsto_nome?: string;
  fornecedor_efetivo_id?: string;
  fornecedor_efetivo_nome?: string;
  motivo?: string;
  em?: string;
}

export interface PosCalculoResponse extends PosCalculoTotaisSaida {
  os_id: string;
  os_numero?: string;
  status_fechamento: StatusFechamentoFinanceiroOS;
  meta: PosCalculoMeta;
  categorias: PosCalculoCategoriaLinha[];
  trocas_fornecedor: PosCalculoTrocaFornecedor[];
  pendencias: PosCalculoPendencia[];
}
