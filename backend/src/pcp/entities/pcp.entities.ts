// Entidades de domínio para o módulo PCP
export interface SetorProdutivo {
  id: string;
  loja_id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  ordem: number;
  criado_em: Date;
  atualizado_em: Date;
}

export interface WorkflowInstanciaSetor {
  id: string;
  instancia_id: string;
  setor_id: string;
  item_os_id: string;
  status: StatusSetorProdutivo;
  operador_id?: string;
  data_inicio?: Date;
  data_conclusao?: Date;
  observacoes?: string;
  criado_em: Date;
  atualizado_em: Date;
}

export enum StatusSetorProdutivo {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  PAUSADA = 'PAUSADA',
  CANCELADA = 'CANCELADA',
}

export enum TipoApontamento {
  INICIO = 'INICIO',
  PAUSA = 'PAUSA',
  RETOMADA = 'RETOMADA',
  CONCLUSAO = 'CONCLUSAO',
  REFUGO = 'REFUGO',
}

// Interfaces para integração com sistema existente
export interface OSCardKanban {
  id: string;
  os_id?: string;
  operador_id?: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA' | 'NORMAL' | 'URGENTE';
  responsavel: string;
  data_prazo: string;
  progresso: number;
  alertas: string[];
  /** false quando a OS ainda não possui WorkflowInstancia vinculada. */
  tem_workflow: boolean;
  workflow_id?: string;
  workflow_nome?: string;
  workflow_setores_nomes?: string[];
  setor_atual?: string;
  operador_atual?: string;
  tempo_previsto_min?: number;
  tempo_previsto_horas?: number;
  maquina_prevista?: {
    id?: string;
    nome?: string;
  } | null;
  /** ID da linha WorkflowInstanciaSetor (usar em mover-setor). */
  instancia_setor_id?: string;
  setor_id?: string;
  etapa_ordem?: number;
  /** Setores permitidos como destino na proxima movimentacao. */
  proximos_setores_ids?: string[];
  /** OS devolvida da expedição para retrabalho no PCP. */
  retrabalho?: boolean;
}

export interface KanbanStats {
  total: number;
  fila: number;
  producao: number;
  concluida: number;
  rejeitada: number;
  atrasadas: number;
  criticas: number;
  por_setor: Record<string, number>;
}

export interface KanbanSetorColuna {
  id: string;
  setor_id: string;
  titulo: string;
  cor: string;
  ordem: number;
  total: number;
  pendentes: number;
  em_andamento: number;
  pausadas: number;
  atrasadas: number;
  score_gargalo: number;
  nivel_gargalo: 'BAIXO' | 'MEDIO' | 'ALTO';
  cards: OSCardKanban[];
}

export interface KanbanPorSetores {
  colunas: KanbanSetorColuna[];
  total: number;
  gerado_em: string;
}
