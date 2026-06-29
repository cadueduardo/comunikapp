export enum ResponsabilidadeArte {
  CLIENTE_FORNECE = 'CLIENTE_FORNECE',
  EMPRESA_CRIA = 'EMPRESA_CRIA',
  EMPRESA_ADAPTA = 'EMPRESA_ADAPTA',
  NAO_APLICAVEL = 'NAO_APLICAVEL',
}

export enum PoliticaCobrancaArte {
  NAO_APLICAVEL = 'NAO_APLICAVEL',
  INCLUIDA_NO_PRODUTO = 'INCLUIDA_NO_PRODUTO',
  COBRADA_A_PARTE = 'COBRADA_A_PARTE',
  SEM_CUSTO = 'SEM_CUSTO',
}

export enum FinalidadeAnexo {
  REFERENCIA_VISUAL = 'REFERENCIA_VISUAL',
  DESENHO_TECNICO = 'DESENHO_TECNICO',
  ARTE_PRODUCAO = 'ARTE_PRODUCAO',
}

export enum StatusArte {
  NAO_APLICA = 'NAO_APLICA',
  AGUARDANDO_INICIO = 'AGUARDANDO_INICIO',
  EM_CRIACAO = 'EM_CRIACAO',
  AGUARDANDO_CLIENTE = 'AGUARDANDO_CLIENTE',
  REVISAO_SOLICITADA = 'REVISAO_SOLICITADA',
  APROVADA = 'APROVADA',
  LIBERADA_PCP = 'LIBERADA_PCP',
  AGUARDANDO_ARQUIVO_CLIENTE = 'AGUARDANDO_ARQUIVO_CLIENTE',
  ARQUIVO_RECEBIDO = 'ARQUIVO_RECEBIDO',
}

export enum ModeloPrecificacaoArte {
  HORA = 'HORA',
}

export enum OrigemItemServicoManual {
  MANUAL = 'MANUAL',
  ARTE_AUTOMATICA = 'ARTE_AUTOMATICA',
}

export const RESPONSABILIDADES_FILA_INTERNA: ResponsabilidadeArte[] = [
  ResponsabilidadeArte.EMPRESA_CRIA,
  ResponsabilidadeArte.EMPRESA_ADAPTA,
];

export const STATUS_ARTE_FILA_PENDENTES: StatusArte[] = [
  StatusArte.AGUARDANDO_INICIO,
  StatusArte.EM_CRIACAO,
  StatusArte.REVISAO_SOLICITADA,
];

/** Colunas do kanban `/arte` — inclui aguardando cliente e concluídas. */
export const STATUS_ARTE_KANBAN: StatusArte[] = [
  StatusArte.AGUARDANDO_INICIO,
  StatusArte.EM_CRIACAO,
  StatusArte.AGUARDANDO_CLIENTE,
  StatusArte.REVISAO_SOLICITADA,
  StatusArte.APROVADA,
  StatusArte.LIBERADA_PCP,
];

export const SERVICO_ARTE_SISTEMA_NOME = 'Criação de arte (sistema)';

export const DESCRICAO_SERVICO_ARTE_AUTOMATICA =
  'Criação de arte (injeção automática pelo módulo Arte & Aprovação)';
