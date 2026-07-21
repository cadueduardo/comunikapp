import type {
  PosCalculoCategoriaLinha,
  PosCalculoTotaisSaida,
} from '../utils/pos-calculo-aggregation.util';

export interface PosCalculoPendencia {
  tipo: string;
  descricao: string;
  severidade?: 'info' | 'alerta' | 'critico';
}

export interface PosCalculoMeta {
  moeda: string;
  visao_margem: 'caixa';
  status_fechamento: 'PENDENTE';
  custo_previsto_fonte?: string;
  limitacoes?: string[];
}

export interface PosCalculoResponse extends PosCalculoTotaisSaida {
  os_id: string;
  os_numero?: string;
  status_fechamento: 'PENDENTE';
  meta: PosCalculoMeta;
  categorias: PosCalculoCategoriaLinha[];
  trocas_fornecedor: [];
  pendencias: PosCalculoPendencia[];
}
