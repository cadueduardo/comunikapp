/**
 * Contadores exibidos como badge no menu lateral (sidebar).
 * Cada valor = itens que entraram na fila do módulo após `*_desde` (última visita).
 */
export interface ContadoresMenuResponse {
  os: number;
  pcp: number;
  expedicao: number;
  financeiro: number;
  arte: number;
  instalacao: number;
}
