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
