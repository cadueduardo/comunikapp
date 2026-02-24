/**
 * Interfaces TypeScript para entidades de workflow PCP
 * Definicoes de tipos para workflow_instancia, etapa_instancia, checklist_instancia, apontamento
 */

import { WorkflowData } from './os.interfaces';

// ===== INTERFACES PRINCIPAIS =====

export interface WorkflowInstanciaData {
  id: string;
  os_id: string;
  workflow_id: string;
  status: StatusWorkflowInstancia;
  etapa_atual?: string;
  data_inicio: Date;
  data_fim?: Date;
  criado_em: Date;
  atualizado_em: Date;

  // Relacionamentos
  workflow?: WorkflowData;
  etapas?: EtapaInstanciaData[];
}

export interface EtapaInstanciaData {
  id: string;
  workflow_instancia_id: string;
  etapa_nome: string;
  ordem: number;
  status: StatusEtapaInstancia;
  data_inicio?: Date;
  data_fim?: Date;
  responsavel_id?: string;
  tempo_estimado?: number; // em minutos
  tempo_real?: number; // em minutos
  observacoes?: string;
  criado_em: Date;
  atualizado_em: Date;

  // Relacionamentos
  workflow_instancia?: WorkflowInstanciaData;
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

  // Relacionamentos
  etapa_instancia?: EtapaInstanciaData;
}

export interface ApontamentoData {
  id: string;
  os_id: string;
  etapa_instancia_id?: string;
  tipo: TipoApontamento;
  data_apontamento: Date;
  usuario_id: string;
  observacoes?: string;
  quantidade_produzida?: number | any; // Prisma retorna Decimal
  quantidade_refugo?: number | any; // Prisma retorna Decimal
  tempo_gasto?: number; // em minutos
  ip_origem?: string;
  user_agent?: string;
  criado_em: Date;

  // Relacionamentos
  os?: any; // OrdemServicoData
  etapa_instancia?: EtapaInstanciaData;
}

// ===== ENUMS =====

export enum StatusWorkflowInstancia {
  ATIVO = 'ATIVO',
  PAUSADO = 'PAUSADO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
}

export enum StatusEtapaInstancia {
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

// ===== DTOs PARA CRIAÇÃO =====

export interface CreateWorkflowInstanciaDto {
  os_id: string;
  workflow_id: string;
  etapa_atual?: string;
}

export interface CreateEtapaInstanciaDto {
  workflow_instancia_id: string;
  etapa_nome: string;
  ordem: number;
  responsavel_id?: string;
  tempo_estimado?: number;
  observacoes?: string;
}

export interface CreateChecklistInstanciaDto {
  etapa_instancia_id: string;
  item_descricao: string;
  obrigatorio?: boolean;
  ordem?: number;
}

export interface CreateApontamentoDto {
  os_id: string;
  etapa_instancia_id?: string;
  tipo: TipoApontamento;
  observacoes?: string;
  quantidade_produzida?: number;
  quantidade_refugo?: number;
  tempo_gasto?: number;
  ip_origem?: string;
  user_agent?: string;
}

// ===== DTOs PARA ATUALIZAÇÃO =====

export interface UpdateWorkflowInstanciaDto {
  status?: StatusWorkflowInstancia;
  etapa_atual?: string;
  data_fim?: Date;
}

export interface UpdateEtapaInstanciaDto {
  status?: StatusEtapaInstancia;
  data_inicio?: Date;
  data_fim?: Date;
  responsavel_id?: string;
  tempo_real?: number;
  observacoes?: string;
}

export interface UpdateChecklistInstanciaDto {
  concluido?: boolean;
  concluido_por?: string;
  data_conclusao?: Date;
  observacoes?: string;
}

// ===== INTERFACES PARA RESPONSE =====

export interface WorkflowInstanciaResponse {
  id: string;
  os_id: string;
  workflow_id: string;
  status: StatusWorkflowInstancia;
  etapa_atual?: string;
  data_inicio: string; // ISO string
  data_fim?: string; // ISO string
  criado_em: string; // ISO string
  atualizado_em: string; // ISO string

  // Relacionamentos opcionais
  workflow?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  etapas?: EtapaInstanciaResponse[];
}

export interface EtapaInstanciaResponse {
  id: string;
  workflow_instancia_id: string;
  etapa_nome: string;
  ordem: number;
  status: StatusEtapaInstancia;
  data_inicio?: string; // ISO string
  data_fim?: string; // ISO string
  responsavel_id?: string;
  tempo_estimado?: number;
  tempo_real?: number;
  observacoes?: string;
  criado_em: string; // ISO string
  atualizado_em: string; // ISO string

  // Relacionamentos opcionais
  checklists?: ChecklistInstanciaResponse[];
  apontamentos?: ApontamentoResponse[];
}

export interface ChecklistInstanciaResponse {
  id: string;
  etapa_instancia_id: string;
  item_descricao: string;
  obrigatorio: boolean;
  concluido: boolean;
  concluido_por?: string;
  data_conclusao?: string; // ISO string
  observacoes?: string;
  ordem: number;
  criado_em: string; // ISO string
  atualizado_em: string; // ISO string
}

export interface ApontamentoResponse {
  id: string;
  os_id: string;
  etapa_instancia_id?: string;
  tipo: TipoApontamento;
  data_apontamento: string; // ISO string
  usuario_id: string;
  observacoes?: string;
  quantidade_produzida?: number;
  quantidade_refugo?: number;
  tempo_gasto?: number;
  ip_origem?: string;
  user_agent?: string;
  criado_em: string; // ISO string
}

// ===== INTERFACES PARA ESTATÍSTICAS =====

export interface EstatisticasWorkflow {
  total_instancias: number;
  instancias_ativas: number;
  instancias_concluidas: number;
  instancias_pausadas: number;
  tempo_medio_execucao: number; // em minutos
  etapas_mais_demoradas: Array<{
    etapa_nome: string;
    tempo_medio: number;
    quantidade: number;
  }>;
}

export interface EstatisticasApontamento {
  total_apontamentos: number;
  apontamentos_hoje: number;
  tempo_total_producao: number; // em minutos
  quantidade_total_produzida: number;
  quantidade_total_refugo: number;
  eficiencia: number; // percentual
}
