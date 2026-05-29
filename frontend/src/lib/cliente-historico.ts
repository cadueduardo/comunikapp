export type FiltroHistoricoOrcamento = 'todos' | 'abertos' | 'aprovados' | 'encerrados';

const STATUS_ABERTOS = new Set([
  'rascunho',
  'em_analise',
  'enviado',
  'negociando',
]);

const STATUS_APROVADOS = new Set(['aprovado', 'em_execucao']);

const STATUS_ENCERRADOS = new Set(['concluido', 'rejeitado', 'cancelado', 'excluido']);

export function filtrarOrcamentosPorGrupo<T extends { status?: string | null }>(
  itens: T[],
  filtro: FiltroHistoricoOrcamento,
): T[] {
  if (filtro === 'todos') return itens;

  return itens.filter((item) => {
    const status = (item.status ?? 'rascunho').toLowerCase();
    if (filtro === 'abertos') return STATUS_ABERTOS.has(status);
    if (filtro === 'aprovados') return STATUS_APROVADOS.has(status);
    if (filtro === 'encerrados') return STATUS_ENCERRADOS.has(status);
    return true;
  });
}

export function rotuloStatusOrcamento(status?: string | null): string {
  const s = (status ?? 'rascunho').toLowerCase();
  const map: Record<string, string> = {
    rascunho: 'Rascunho',
    em_analise: 'Em análise',
    enviado: 'Enviado',
    negociando: 'Negociando',
    aprovado: 'Aprovado',
    em_execucao: 'Em execução',
    concluido: 'Concluído',
    rejeitado: 'Rejeitado',
    cancelado: 'Cancelado',
  };
  return map[s] ?? status ?? '—';
}

export function rotuloStatusOS(status: string): string {
  const map: Record<string, string> = {
    FILA: 'Na fila',
    PRODUCAO: 'Em produção',
    ACABAMENTO: 'Acabamento',
    FINALIZADA: 'Finalizada',
    CANCELADA: 'Cancelada',
    AGUARDANDO_APROVACAO: 'Aguardando aprovação',
  };
  return map[status] ?? status;
}
