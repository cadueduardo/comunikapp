import type { StatusInstalacao } from './instalacao.types';

export interface InstalacaoKanbanColuna {
  id: string;
  title: string;
  status: StatusInstalacao;
  /** Classes Tailwind semânticas (light/dark via variáveis de tema) */
  headerClass: string;
  /** Colunas que não aceitam drop via drag-and-drop */
  dropDisabled?: boolean;
}

export const COLUNAS_INSTALACAO_KANBAN: InstalacaoKanbanColuna[] = [
  {
    id: 'aguardando',
    title: 'Aguardando',
    status: 'AGUARDANDO',
    headerClass: 'border-amber-500/30 bg-amber-500/5',
  },
  {
    id: 'em-andamento',
    title: 'Em andamento',
    status: 'EM_ANDAMENTO',
    headerClass: 'border-blue-500/30 bg-blue-500/5',
  },
  {
    id: 'concluido',
    title: 'Concluído',
    status: 'CONCLUIDO',
    headerClass: 'border-emerald-500/30 bg-emerald-500/5',
    dropDisabled: true,
  },
  {
    id: 'logistica-negativa',
    title: 'Logística negativa',
    status: 'LOGISTICA_NEGATIVA',
    headerClass: 'border-destructive/30 bg-destructive/5',
  },
];

/** Status em que o card não pode ser arrastado (somente leitura no Kanban). */
export const STATUS_LOTE_KANBAN_SEM_DRAG: StatusInstalacao[] = [
  'CONCLUIDO',
  'LOGISTICA_NEGATIVA',
];
