import type { OrdemServico } from '@/app/(main)/os/columns';

export interface StatusExibicaoConfig {
  chave: string;
  label: string;
  color: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
}

const BASE_STATUS: Record<string, StatusExibicaoConfig> = {
  FILA: {
    chave: 'FILA',
    label: 'Na Fila',
    color: 'bg-gray-100 text-gray-800',
    variant: 'secondary',
  },
  PRODUCAO: {
    chave: 'PRODUCAO',
    label: 'Em Produção',
    color: 'bg-blue-100 text-blue-800',
    variant: 'default',
  },
  EM_WORKFLOW: {
    chave: 'EM_WORKFLOW',
    label: 'Em workflow',
    color: 'bg-slate-100 text-slate-800',
    variant: 'secondary',
  },
  ACABAMENTO: {
    chave: 'ACABAMENTO',
    label: 'Acabamento',
    color: 'bg-yellow-100 text-yellow-800',
    variant: 'outline',
  },
  FINALIZADA: {
    chave: 'FINALIZADA',
    label: 'Finalizada',
    color: 'bg-green-100 text-green-800',
    variant: 'default',
  },
  CANCELADA: {
    chave: 'CANCELADA',
    label: 'Cancelada',
    color: 'bg-red-100 text-red-800',
    variant: 'destructive',
  },
  AGUARDANDO_MATERIAL: {
    chave: 'AGUARDANDO_MATERIAL',
    label: 'Aguardando Material',
    color: 'bg-orange-100 text-orange-800',
    variant: 'outline',
  },
  PAUSADA: {
    chave: 'PAUSADA',
    label: 'Pausada',
    color: 'bg-gray-100 text-gray-600',
    variant: 'secondary',
  },
  AGUARDANDO_APROVACAO_TECNICA: {
    chave: 'AGUARDANDO_APROVACAO_TECNICA',
    label: 'Aguardando Aprovação Técnica',
    color: 'bg-blue-100 text-blue-800',
    variant: 'outline',
  },
  APROVADA_TECNICA: {
    chave: 'APROVADA_TECNICA',
    label: 'Aprovada Tecnicamente',
    color: 'bg-green-100 text-green-800',
    variant: 'default',
  },
  REJEITADA: {
    chave: 'REJEITADA',
    label: 'Rejeitada',
    color: 'bg-red-100 text-red-800',
    variant: 'destructive',
  },
  PARCIALMENTE_LIBERADA: {
    chave: 'PARCIALMENTE_LIBERADA',
    label: 'Parcialmente liberada',
    color: 'bg-purple-100 text-purple-800',
    variant: 'outline',
  },
  LIBERADA_PARA_PCP: {
    chave: 'LIBERADA_PARA_PCP',
    label: 'Liberada para PCP',
    color: 'bg-indigo-100 text-indigo-800',
    variant: 'default',
  },
  EM_INSTALACAO: {
    chave: 'EM_INSTALACAO',
    label: 'Em instalação',
    color: 'bg-teal-100 text-teal-800',
    variant: 'default',
  },
  AGUARDANDO_RELATORIO_TECNICO: {
    chave: 'AGUARDANDO_RELATORIO_TECNICO',
    label: 'Aguardando relatório técnico',
    color: 'bg-amber-100 text-amber-900',
    variant: 'outline',
  },
  EM_EXPEDICAO: {
    chave: 'EM_EXPEDICAO',
    label: 'Em expedição',
    color: 'bg-violet-100 text-violet-800',
    variant: 'default',
  },
};

const EXPEDICAO_LABEL: Record<string, string> = {
  AGUARDANDO_SEPARACAO: 'Em expedição — separação',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  EM_ROTA_DE_ENTREGA: 'Em rota de entrega',
  AGUARDANDO_INSTALACAO: 'Aguardando instalação',
  AGUARDANDO_FECHAMENTO: 'Aguardando fechamento',
};

const EXPEDICAO_ATIVA = new Set([
  'AGUARDANDO_SEPARACAO',
  'PRONTO_PARA_RETIRADA',
  'EM_ROTA_DE_ENTREGA',
  'AGUARDANDO_INSTALACAO',
  'AGUARDANDO_FECHAMENTO',
]);

/**
 * Status exibido no grid da OS — prioriza fases pós-produção (instalação/expedição)
 * quando o campo `status` da OS já foi para FINALIZADA.
 */
export function resolverStatusExibicaoOs(
  os: Pick<OrdemServico, 'status' | 'status_instalacao_os' | 'status_expedicao'>,
): StatusExibicaoConfig {
  const statusInstalacao = (os.status_instalacao_os ?? '').toUpperCase();

  if (statusInstalacao === 'EM_ANDAMENTO') {
    return BASE_STATUS.EM_INSTALACAO;
  }

  if (statusInstalacao === 'AGUARDANDO_RELATORIO_TECNICO') {
    return BASE_STATUS.AGUARDANDO_RELATORIO_TECNICO;
  }

  const statusExpedicao = (os.status_expedicao ?? '').toUpperCase();
  if (statusExpedicao && EXPEDICAO_ATIVA.has(statusExpedicao)) {
    const label = EXPEDICAO_LABEL[statusExpedicao] ?? 'Em expedição';
    return {
      ...BASE_STATUS.EM_EXPEDICAO,
      label,
    };
  }

  const status = (os.status || '').toUpperCase();
  return (
    BASE_STATUS[status] ?? {
      chave: status,
      label: status || '—',
      color: 'bg-gray-100 text-gray-800',
      variant: 'secondary',
    }
  );
}
