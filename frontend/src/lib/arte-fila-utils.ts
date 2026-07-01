/**
 * Mapeia status_arte para a coluna do kanban `/arte` (sem colunas extras).
 */
export function statusArteParaColunaKanban(status: string): string {
  if (status === 'LIBERADA_PCP') return 'APROVADA';
  if (status === 'AGUARDANDO_ARQUIVO_CLIENTE') return 'AGUARDANDO_INICIO';
  if (status === 'ARQUIVO_RECEBIDO') return 'EM_CRIACAO';
  return status;
}
