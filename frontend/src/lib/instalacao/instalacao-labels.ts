export const STATUS_FINANCEIRO_OCORRENCIA_LABEL: Record<string, string> = {
  PENDENTE_PRECIFICACAO: 'Pendente de precificação',
  PRECIFICADO: 'Precificado',
  FATURADO: 'Faturado',
  ABONADO: 'Abonado',
  CANCELADO: 'Cancelado',
};

export const STATUS_FINANCEIRO_OCORRENCIA_TONE: Record<
  string,
  'default' | 'warn' | 'success' | 'destructive'
> = {
  PENDENTE_PRECIFICACAO: 'warn',
  PRECIFICADO: 'default',
  FATURADO: 'success',
  ABONADO: 'destructive',
  CANCELADO: 'destructive',
};

export const FILA_PRECIFICACAO_STATUS_FILTROS = [
  { value: 'PENDENTE_PRECIFICACAO', label: 'Pendentes' },
  { value: 'PRECIFICADO', label: 'Precificados' },
] as const;

export const STATUS_INSTALACAO_LABEL: Record<string, string> = {
  AGUARDANDO: 'Aguardando',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  LOGISTICA_NEGATIVA: 'Logística negativa',
};

export const STATUS_INSTALACAO_TONE: Record<
  string,
  'default' | 'warn' | 'success' | 'destructive'
> = {
  AGUARDANDO: 'warn',
  EM_ANDAMENTO: 'default',
  CONCLUIDO: 'success',
  LOGISTICA_NEGATIVA: 'destructive',
};

export const ORIGEM_CONCLUSAO_LOTE_LABEL: Record<string, string> = {
  CAMPO: 'Aplicativo de campo',
  GESTAO: 'Aprovação da gestão',
};

export const MOTIVO_SEM_ASSINATURA_LABEL: Record<string, string> = {
  CLIENTE_AUSENTE: 'Cliente ausente no local',
  CLIENTE_RECUSOU_ASSINAR: 'Cliente recusou assinar',
  ASSINATURA_CANAL_ALTERNATIVO:
    'Assinatura obtida por outro canal (e-mail, WhatsApp, etc.)',
  INSTALADOR_SEM_APP: 'Instalador não finalizou no aplicativo de campo',
  EVIDENCIA_SUFICIENTE: 'Evidências fotográficas consideradas suficientes',
  OUTROS: 'Outros',
};

export const MOTIVOS_SEM_ASSINATURA_OPCOES = [
  { value: 'CLIENTE_AUSENTE', label: MOTIVO_SEM_ASSINATURA_LABEL.CLIENTE_AUSENTE },
  {
    value: 'CLIENTE_RECUSOU_ASSINAR',
    label: MOTIVO_SEM_ASSINATURA_LABEL.CLIENTE_RECUSOU_ASSINAR,
  },
  {
    value: 'ASSINATURA_CANAL_ALTERNATIVO',
    label: MOTIVO_SEM_ASSINATURA_LABEL.ASSINATURA_CANAL_ALTERNATIVO,
  },
  {
    value: 'INSTALADOR_SEM_APP',
    label: MOTIVO_SEM_ASSINATURA_LABEL.INSTALADOR_SEM_APP,
  },
  {
    value: 'EVIDENCIA_SUFICIENTE',
    label: MOTIVO_SEM_ASSINATURA_LABEL.EVIDENCIA_SUFICIENTE,
  },
  { value: 'OUTROS', label: MOTIVO_SEM_ASSINATURA_LABEL.OUTROS },
] as const;

export const TIPO_OCORRENCIA_LABEL: Record<string, string> = {
  VISITA_IMPRODUTIVA: 'Visita improdutiva',
  MATERIAL_EXTRA: 'Material extra',
  SERVICO_ADICIONAL: 'Serviço adicional',
  RETRABALHO: 'Retrabalho',
};

export const TIPOS_OCORRENCIA_OPTIONS = Object.entries(TIPO_OCORRENCIA_LABEL).map(
  ([value, label]) => ({ value, label }),
);

export const STATUS_INSTALACAO_OS_LABEL: Record<string, string> = {
  EM_ANDAMENTO: 'Em andamento',
  AGUARDANDO_RELATORIO_TECNICO: 'Aguardando relatório técnico',
  CONCLUIDA: 'Concluída',
};

export const STATUS_INSTALACAO_OS_TONE: Record<
  string,
  'default' | 'warn' | 'success' | 'destructive'
> = {
  EM_ANDAMENTO: 'default',
  AGUARDANDO_RELATORIO_TECNICO: 'warn',
  CONCLUIDA: 'success',
};

export const STATUS_INSTALACAO_OS_FILTROS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'EM_ANDAMENTO', label: 'Em andamento' },
  {
    value: 'AGUARDANDO_RELATORIO_TECNICO',
    label: 'Aguardando relatório técnico',
  },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'sem_status', label: 'Sem status definido' },
] as const;

export const TURNO_PREVISAO_LABEL: Record<string, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  INTEIRO: 'Dia inteiro',
};

export const TURNO_PREVISAO_OPCOES = [
  { value: 'MANHA', label: TURNO_PREVISAO_LABEL.MANHA },
  { value: 'TARDE', label: TURNO_PREVISAO_LABEL.TARDE },
  { value: 'INTEIRO', label: TURNO_PREVISAO_LABEL.INTEIRO },
] as const;

export const TURNO_PREVISAO_TONE: Record<
  string,
  'manha' | 'tarde' | 'inteiro'
> = {
  MANHA: 'manha',
  TARDE: 'tarde',
  INTEIRO: 'inteiro',
};
