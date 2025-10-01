export interface WorkflowInstanciaData {
  id: string;
  os_id: string;
  workflow_id: string;
  status: 'ATIVO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
  etapa_atual?: string;
  data_inicio: Date;
  data_fim?: Date;
  criado_em: Date;
  atualizado_em: Date;
  workflow?: any; // TODO: Definir interface WorkflowData
  etapas?: EtapaInstanciaData[];
}

export interface EtapaInstanciaData {
  id: string;
  workflow_instancia_id: string;
  etapa_nome: string;
  ordem: number;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'PAUSADA' | 'CANCELADA';
  data_inicio?: Date;
  data_fim?: Date;
  responsavel_id?: string;
  tempo_estimado?: number;
  tempo_real?: number;
  observacoes?: string;
  criado_em: Date;
  atualizado_em: Date;
  checklists?: ChecklistInstanciaData[];
  apontamentos?: ApontamentoData[];
}

export interface ChecklistInstanciaData {
  id: string;
  etapa_instancia_id: string;
  item_descricao: string;
  obrigatorio: boolean;
  concluido: boolean;
  concluido_por?: string;
  data_conclusao?: Date;
  observacoes?: string;
  ordem: number;
  criado_em: Date;
  atualizado_em: Date;
}

export interface ApontamentoData {
  id: string;
  os_id: string;
  etapa_instancia_id?: string;
  tipo: 'INICIO' | 'PAUSA' | 'RETOMADA' | 'CONCLUSAO' | 'REFUGO';
  data_apontamento: Date;
  usuario_id: string;
  observacoes?: string;
  quantidade_produzida?: number | any; // Decimal do Prisma
  quantidade_refugo?: number | any; // Decimal do Prisma
  tempo_gasto?: number;
  ip_origem?: string;
  user_agent?: string;
  criado_em: Date;
}

export interface CreateWorkflowInstanciaDto {
  os_id: string;
  workflow_id: string;
  etapa_atual?: string;
}

export interface UpdateWorkflowInstanciaDto {
  status?: 'ATIVO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
  etapa_atual?: string;
  data_fim?: Date;
}

export interface CreateEtapaInstanciaDto {
  workflow_instancia_id: string;
  etapa_nome: string;
  ordem: number;
  responsavel_id?: string;
  tempo_estimado?: number;
  observacoes?: string;
}

export interface UpdateEtapaInstanciaDto {
  status?: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'PAUSADA' | 'CANCELADA';
  data_inicio?: Date;
  data_fim?: Date;
  responsavel_id?: string;
  tempo_real?: number;
  observacoes?: string;
}

export interface CreateApontamentoDto {
  os_id: string;
  etapa_instancia_id?: string;
  tipo: 'INICIO' | 'PAUSA' | 'RETOMADA' | 'CONCLUSAO' | 'REFUGO';
  usuario_id?: string;
  observacoes?: string;
  quantidade_produzida?: number;
  quantidade_refugo?: number;
  tempo_gasto?: number;
  ip_origem?: string;
  user_agent?: string;
}

export interface UpdateApontamentoDto {
  observacoes?: string;
  quantidade_produzida?: number;
  quantidade_refugo?: number;
  tempo_gasto?: number;
}
