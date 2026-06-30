import { StatusArte } from './arte.enums';

/** Status que permitem a ação "assumir" na fila. */
export const STATUS_PERMITIDOS_ASSUMIR: StatusArte[] = [
  StatusArte.AGUARDANDO_INICIO,
  StatusArte.EM_CRIACAO,
  StatusArte.REVISAO_SOLICITADA,
];

const TRANSICOES_STATUS: Partial<Record<StatusArte, StatusArte[]>> = {
  [StatusArte.AGUARDANDO_INICIO]: [StatusArte.EM_CRIACAO],
  [StatusArte.EM_CRIACAO]: [
    StatusArte.AGUARDANDO_CLIENTE,
    StatusArte.APROVADA,
    StatusArte.LIBERADA_PCP,
  ],
  [StatusArte.AGUARDANDO_CLIENTE]: [
    StatusArte.APROVADA,
    StatusArte.REVISAO_SOLICITADA,
    StatusArte.EM_CRIACAO,
  ],
  [StatusArte.REVISAO_SOLICITADA]: [StatusArte.EM_CRIACAO, StatusArte.APROVADA],
  [StatusArte.APROVADA]: [StatusArte.LIBERADA_PCP, StatusArte.EM_CRIACAO],
  [StatusArte.LIBERADA_PCP]: [],
};

export function transicaoStatusArtePermitida(
  atual: StatusArte,
  proximo: StatusArte,
): boolean {
  const permitidos = TRANSICOES_STATUS[atual];
  if (!permitidos) {
    return false;
  }
  return permitidos.includes(proximo);
}
