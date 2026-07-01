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

export const TURNO_PREVISAO_TONE: Record<
  string,
  'manha' | 'tarde' | 'inteiro'
> = {
  MANHA: 'manha',
  TARDE: 'tarde',
  INTEIRO: 'inteiro',
};
