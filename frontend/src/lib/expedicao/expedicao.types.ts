export type StatusExpedicao =
  | 'AGUARDANDO_SEPARACAO'
  | 'PRONTO_PARA_RETIRADA'
  | 'EM_ROTA_DE_ENTREGA'
  | 'AGUARDANDO_INSTALACAO'
  | 'ENTREGUE_FINALIZADO'
  | 'ARQUIVADO'
  | 'DEVOLVIDA';

export type ModalidadeExpedicao =
  | 'RETIRADA_CLIENTE'
  | 'ENTREGA_TRANSPORTADORA'
  | 'ENTREGA_FROTA_PROPRIA'
  | 'INSTALACAO_NO_LOCAL';

export interface ExpedicaoCardKanban {
  id: string;
  os_id: string;
  os_numero: string;
  status: StatusExpedicao;
  modalidade: ModalidadeExpedicao;
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

export interface ParcelaBloqueioExpedicao {
  id: string;
  tipo: string;
  valor_saldo: number;
  data_vencimento: string;
  status: string;
}

export interface BloqueioFinanceiroExpedicao {
  bloqueado: boolean;
  motivo?: string;
  parcelas?: ParcelaBloqueioExpedicao[];
  link_financeiro?: string;
  os_id?: string;
  os_numero?: string;
  orcamento_numero?: string;
}

export interface ConcluirEntregaPayload {
  recebedor_nome: string;
  recebedor_doc?: string;
  url_assinatura?: string;
  observacoes?: string;
  override_financeiro?: boolean;
  motivo_override_financeiro?: string;
}

export interface ConcluirEntregaResult {
  expedicao_id: string;
  os_id: string;
  status: string;
  data_conclusao: string;
}

export interface BloqueioFinanceiroConflictBody {
  code: 'BLOQUEIO_FINANCEIRO';
  message: string;
  parcelas: ParcelaBloqueioExpedicao[];
  link_financeiro: string;
}

export interface ExpedicaoDetalhe {
  id: string;
  os_id: string;
  status: StatusExpedicao;
  modalidade: ModalidadeExpedicao;
  codigo_rastreio: string | null;
  data_expedida: string | null;
  data_conclusao: string | null;
  recebedor_nome: string | null;
  recebedor_doc: string | null;
  url_assinatura: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  ordem_servico: {
    id: string;
    numero: string;
    nome_servico: string;
    status: string;
    data_prazo: string | null;
    data_entrega_cliente: string | null;
    orcamento_id: string | null;
    retrabalho: boolean;
    endereco_entrega: string | null;
    cliente: {
      id: string;
      nome: string;
      telefone: string | null;
      whatsapp: string | null;
      email: string | null;
    };
  };
  bloqueio_financeiro: BloqueioFinanceiroExpedicao;
}

export interface ExpedicaoKanbanFilters {
  status?: StatusExpedicao;
  modalidade?: ModalidadeExpedicao;
  busca?: string;
  incluir_arquivados?: boolean;
}

export interface ArquivarExpedicaoResult {
  expedicao_id: string;
  os_id: string;
  status_anterior: string;
  status_novo: string;
}

export interface TransformarTemplateResult {
  os_id: string;
  orcamento_id: string;
  templates: Array<{ id: string; nome: string }>;
}

export interface UploadAssinaturaResult {
  url: string;
  token: string;
}
