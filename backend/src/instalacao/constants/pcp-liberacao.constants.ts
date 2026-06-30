/**
 * Status de liberação PCP por item de OS.
 * Arte & Aprovação permanece independente destes estados.
 */
export const StatusLiberacaoPcp = {
  PENDENTE: 'PENDENTE',
  BLOQUEADO_AGUARDANDO_SINAL: 'BLOQUEADO_AGUARDANDO_SINAL',
  LIBERADO: 'LIBERADO',
  EM_PRODUCAO: 'EM_PRODUCAO',
  CONCLUIDO: 'CONCLUIDO',
} as const;

export type StatusLiberacaoPcpValor =
  (typeof StatusLiberacaoPcp)[keyof typeof StatusLiberacaoPcp];
