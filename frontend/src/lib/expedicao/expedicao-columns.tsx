import {
  IconCircleCheck,
  IconPackage,
  IconTruck,
  IconTool,
  IconBuildingStore,
} from '@tabler/icons-react';
import type { KanbanColumn } from '@/components/ui/kanban-board';
import type { StatusExpedicao } from './expedicao.types';

export const EXPEDICAO_KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'aguardando_separacao',
    title: 'Aguardando separação',
    status: 'AGUARDANDO_SEPARACAO',
    color: 'bg-slate-100',
    icon: <IconPackage className="h-4 w-4" />,
  },
  {
    id: 'pronto_retirada',
    title: 'Pronto para retirada',
    status: 'PRONTO_PARA_RETIRADA',
    color: 'bg-amber-100',
    icon: <IconBuildingStore className="h-4 w-4" />,
  },
  {
    id: 'em_rota',
    title: 'Em rota de entrega',
    status: 'EM_ROTA_DE_ENTREGA',
    color: 'bg-blue-100',
    icon: <IconTruck className="h-4 w-4" />,
  },
  {
    id: 'aguardando_instalacao',
    title: 'Aguardando instalação',
    status: 'AGUARDANDO_INSTALACAO',
    color: 'bg-violet-100',
    icon: <IconTool className="h-4 w-4" />,
  },
  {
    id: 'entregue',
    title: 'Entregue',
    status: 'ENTREGUE_FINALIZADO',
    color: 'bg-green-100',
    icon: <IconCircleCheck className="h-4 w-4" />,
  },
];

export const MODALIDADE_EXPEDICAO_LABEL: Record<string, string> = {
  RETIRADA_CLIENTE: 'Retirada no balcão',
  ENTREGA_TRANSPORTADORA: 'Transportadora',
  ENTREGA_FROTA_PROPRIA: 'Entrega própria',
  INSTALACAO_NO_LOCAL: 'Instalação no local',
};

export const STATUS_EXPEDICAO_LABEL: Record<string, string> = {
  AGUARDANDO_SEPARACAO: 'Aguardando separação',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  EM_ROTA_DE_ENTREGA: 'Em rota de entrega',
  AGUARDANDO_INSTALACAO: 'Aguardando instalação',
  ENTREGUE_FINALIZADO: 'Entregue',
  ARQUIVADO: 'Arquivado',
  DEVOLVIDA: 'Devolvida',
};

export const MOTIVOS_DEVOLUCAO_EXPEDICAO = [
  'Material com defeito',
  'Erro de especificação',
  'Peça faltando',
  'Acabamento inadequado',
  'Dimensões incorretas',
  'Outro',
] as const;

export const STATUS_EXPEDICAO_KANBAN_PATCH = new Set<StatusExpedicao>([
  'AGUARDANDO_SEPARACAO',
  'PRONTO_PARA_RETIRADA',
  'EM_ROTA_DE_ENTREGA',
  'AGUARDANDO_INSTALACAO',
]);
