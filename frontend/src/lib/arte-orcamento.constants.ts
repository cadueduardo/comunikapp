/** Constantes de arte espelhadas do backend (somente enums/labels — sem lógica duplicada). */

export const ResponsabilidadeArte = {
  CLIENTE_FORNECE: 'CLIENTE_FORNECE',
  EMPRESA_CRIA: 'EMPRESA_CRIA',
  EMPRESA_ADAPTA: 'EMPRESA_ADAPTA',
  NAO_APLICAVEL: 'NAO_APLICAVEL',
} as const;

export type ResponsabilidadeArteValor =
  (typeof ResponsabilidadeArte)[keyof typeof ResponsabilidadeArte];

export const PoliticaCobrancaArte = {
  NAO_APLICAVEL: 'NAO_APLICAVEL',
  INCLUIDA_NO_PRODUTO: 'INCLUIDA_NO_PRODUTO',
  COBRADA_A_PARTE: 'COBRADA_A_PARTE',
  SEM_CUSTO: 'SEM_CUSTO',
} as const;

export type PoliticaCobrancaArteValor =
  (typeof PoliticaCobrancaArte)[keyof typeof PoliticaCobrancaArte];

export const FinalidadeAnexo = {
  REFERENCIA_VISUAL: 'REFERENCIA_VISUAL',
  DESENHO_TECNICO: 'DESENHO_TECNICO',
  ARTE_PRODUCAO: 'ARTE_PRODUCAO',
} as const;

export type FinalidadeAnexoValor =
  (typeof FinalidadeAnexo)[keyof typeof FinalidadeAnexo];

export const OrigemItemServicoManual = {
  MANUAL: 'MANUAL',
  ARTE_AUTOMATICA: 'ARTE_AUTOMATICA',
} as const;

export const RESPONSABILIDADE_ARTE_OPCOES: Array<{
  value: ResponsabilidadeArteValor;
  label: string;
}> = [
  { value: ResponsabilidadeArte.NAO_APLICAVEL, label: 'Não se aplica' },
  { value: ResponsabilidadeArte.CLIENTE_FORNECE, label: 'Cliente fornece' },
  { value: ResponsabilidadeArte.EMPRESA_CRIA, label: 'Criação interna' },
  { value: ResponsabilidadeArte.EMPRESA_ADAPTA, label: 'Adaptação' },
];

export const POLITICA_COBRANCA_ARTE_OPCOES: Array<{
  value: PoliticaCobrancaArteValor;
  label: string;
}> = [
  {
    value: PoliticaCobrancaArte.INCLUIDA_NO_PRODUTO,
    label: 'Incluso no produto',
  },
  { value: PoliticaCobrancaArte.COBRADA_A_PARTE, label: 'Cobrada à parte' },
  { value: PoliticaCobrancaArte.SEM_CUSTO, label: 'Sem cobrança (cortesia)' },
];

export const FINALIDADE_ANEXO_OPCOES: Array<{
  value: FinalidadeAnexoValor;
  label: string;
}> = [
  { value: FinalidadeAnexo.REFERENCIA_VISUAL, label: 'Referência visual' },
  { value: FinalidadeAnexo.DESENHO_TECNICO, label: 'Desenho técnico' },
  { value: FinalidadeAnexo.ARTE_PRODUCAO, label: 'Arte de produção' },
];

export function arteRequerTrabalhoInterno(
  responsabilidade?: string | null,
): boolean {
  return (
    responsabilidade === ResponsabilidadeArte.EMPRESA_CRIA ||
    responsabilidade === ResponsabilidadeArte.EMPRESA_ADAPTA
  );
}
