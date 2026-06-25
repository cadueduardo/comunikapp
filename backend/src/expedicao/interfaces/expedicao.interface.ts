import { BLOQUEIO_FINANCEIRO_CODE } from '../constants/bloqueio-financeiro.code';

export type MotivoLiberacaoFinanceira = 'SEM_ORCAMENTO' | 'SEM_COBRANCA';

export type MotivoBloqueioFinanceiro =
  | MotivoLiberacaoFinanceira
  | 'PARCELAS_EM_ABERTO';

export interface ParcelaBloqueioExpedicao {
  id: string;
  tipo: string;
  valor_saldo: number;
  data_vencimento: string;
  status: string;
}

export interface ResultadoBloqueioFinanceiro {
  bloqueado: boolean;
  motivo?: MotivoBloqueioFinanceiro;
  parcelas?: ParcelaBloqueioExpedicao[];
  cobranca_id?: string;
  os_id?: string;
  os_numero?: string;
  orcamento_numero?: string;
  link_financeiro?: string;
}

export interface BloqueioFinanceiroConflictBody {
  code: typeof BLOQUEIO_FINANCEIRO_CODE;
  message: string;
  parcelas: ParcelaBloqueioExpedicao[];
  link_financeiro: string;
}

export interface ExpedicaoCardKanban {
  id: string;
  os_id: string;
  os_numero: string;
  status: string;
  modalidade: string;
  codigo_rastreio: string | null;
  titulo: string;
  cliente: string;
  cliente_telefone: string | null;
  endereco_entrega: string | null;
  data_prazo: string | null;
  data_expedida: string | null;
  criado_em: string;
  atualizado_em: string;
  orcamento_id: string | null;
  retrabalho: boolean;
  bloqueado_financeiro: boolean;
  link_financeiro: string | null;
}

export interface ExpedicaoKanbanStats {
  total: number;
  por_status: Record<string, number>;
}

export interface ExpedicaoKanbanResponse {
  colunas: Record<string, ExpedicaoCardKanban[]>;
  cards: ExpedicaoCardKanban[];
  stats: ExpedicaoKanbanStats;
}

export interface ExpedicaoDetalheCliente {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
}

export interface ExpedicaoDetalheOs {
  id: string;
  numero: string;
  nome_servico: string;
  status: string;
  data_prazo: string | null;
  data_entrega_cliente: string | null;
  orcamento_id: string | null;
  retrabalho: boolean;
  cliente: ExpedicaoDetalheCliente;
  endereco_entrega: string | null;
}

export interface ExpedicaoDetalhe {
  id: string;
  os_id: string;
  status: string;
  modalidade: string;
  codigo_rastreio: string | null;
  data_expedida: string | null;
  data_conclusao: string | null;
  recebedor_nome: string | null;
  recebedor_doc: string | null;
  url_assinatura: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  ordem_servico: ExpedicaoDetalheOs;
  bloqueio_financeiro: ResultadoBloqueioFinanceiro;
}

export interface AtualizarStatusExpedicaoResult {
  expedicao_id: string;
  os_id: string;
  status_anterior: string;
  status_novo: string;
}

export interface ConcluirEntregaResult {
  expedicao_id: string;
  os_id: string;
  status: string;
  data_conclusao: string;
}
