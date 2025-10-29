// Tipos para o módulo Arte & Aprovação

export enum ArteStatus {
  RASCUNHO = 'RASCUNHO',
  ENVIADA_CLIENTE = 'ENVIADA_CLIENTE',
  APROVADA = 'APROVADA',
  REVISAO_SOLICITADA = 'REVISAO_SOLICITADA',
  BLOQUEADA = 'BLOQUEADA',
  ENVIADA_PCP = 'ENVIADA_PCP'
}

export enum ComentarioTipo {
  INTERNO = 'INTERNO',
  CLIENTE = 'CLIENTE',
  SISTEMA = 'SISTEMA'
}

export interface ArteArquivo {
  id: string;
  nome_arquivo: string;
  nome_original: string;
  tipo_arquivo: string;
  tamanho: number;
  url_arquivo: string;
  url_thumbnail?: string;
  storage_provider: string;
  data_upload: string;
}

export interface ArteComentario {
  id: string;
  usuario_id: string;
  usuario_nome: string;
  comentario: string;
  tipo: ComentarioTipo;
  data_comentario: string;
}

export interface ArteVersao {
  id: string;
  os_id: string;
  servico_id?: string;
  versao: string;
  status: ArteStatus;
  autor_id: string;
  autor_nome: string;
  descricao?: string;
  observacoes?: string;
  data_criacao: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  aprovador_nome?: string;
  aprovado_por_cliente: boolean;
  liberado_para_pcp: boolean; // Indica se foi liberada pelo designer após aprovação do cliente
  liberado_em?: string; // Data em que o designer liberou
  liberado_por?: string; // ID do designer que liberou
  liberador_nome?: string; // Nome do designer que liberou
  arquivos: ArteArquivo[];
  comentarios: ArteComentario[];
}

export interface CreateArteVersaoRequest {
  os_id: string;
  servico_id?: string;
  versao: string;
  status: ArteStatus;
  descricao?: string;
  observacoes?: string;
}

export interface UpdateArteVersaoRequest {
  versao?: string;
  status?: ArteStatus;
  descricao?: string;
  observacoes?: string;
  liberado_para_pcp?: boolean;
  liberado_em?: Date;
  liberado_por?: string;
}

export interface ArteVersaoListResponse {
  versoes: ArteVersao[];
  total: number;
}

// Props para componentes
export interface ArteAprovacaoTabProps {
  osId: string;
  readonly?: boolean;
}

export interface ArteVersaoCardProps {
  versao: ArteVersao;
  onEdit?: (versao: ArteVersao) => void;
  onDelete?: (versaoId: string) => void;
  onView?: (versao: ArteVersao) => void;
  readonly?: boolean;
}

export interface ArteFileUploadProps {
  versaoId: string;
  onUploadSuccess?: (arquivo: ArteArquivo) => void;
  onUploadError?: (error: string) => void;
  readonly?: boolean;
}

export interface ArtePreviewModalProps {
  versao?: ArteVersao;
  isOpen: boolean;
  onClose: () => void;
  osId?: string;
  produtoId?: string;
}

