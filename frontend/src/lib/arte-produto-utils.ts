const RESPONSABILIDADES_COM_ARTE = new Set([
  'EMPRESA_CRIA',
  'EMPRESA_ADAPTA',
  'CLIENTE_FORNECE',
]);

const STATUS_ARTE_PENDENTES = new Set([
  'AGUARDANDO_INICIO',
  'EM_CRIACAO',
  'AGUARDANDO_CLIENTE',
  'REVISAO_SOLICITADA',
  'AGUARDANDO_ARQUIVO_CLIENTE',
]);

export function produtoRequerArte(
  responsabilidadeArte?: string | null,
  statusArte?: string | null,
): boolean {
  if (!responsabilidadeArte || responsabilidadeArte === 'NAO_APLICAVEL') {
    return false;
  }
  if (statusArte === 'NAO_APLICA') {
    return false;
  }
  return RESPONSABILIDADES_COM_ARTE.has(responsabilidadeArte);
}

export function arteProdutoPendente(statusArte?: string | null): boolean {
  return Boolean(statusArte && STATUS_ARTE_PENDENTES.has(statusArte));
}

export function isArteOkParaPcp(
  responsabilidadeArte?: string | null,
  statusArte?: string | null,
): boolean {
  if (!produtoRequerArte(responsabilidadeArte, statusArte)) {
    return true;
  }
  const ok = new Set(['NAO_APLICA', 'APROVADA', 'ARQUIVO_RECEBIDO']);
  return ok.has((statusArte || '').toUpperCase());
}

export function getMotivosBloqueioPcpFrontend(item: {
  status_liberacao_pcp?: string | null;
  data_prazo_produto?: string | null;
  responsabilidade_arte?: string | null;
  status_arte?: string | null;
  materiais_disponivel?: boolean | null;
}, osMateriaisDisponivel?: boolean): string[] {
  const motivos: string[] = [];
  if ((item.status_liberacao_pcp || 'PENDENTE').toUpperCase() === 'LIBERADO') {
    return ['Produto já liberado'];
  }
  if (!item.data_prazo_produto) {
    motivos.push('Prazo de produção não definido');
  }
  if (!isArteOkParaPcp(item.responsabilidade_arte, item.status_arte)) {
    motivos.push('Arte pendente de aprovação ou arquivo');
  }
  if (item.materiais_disponivel !== true && osMateriaisDisponivel !== true) {
    motivos.push('Materiais não confirmados');
  }
  return motivos;
}

export const STATUS_ARTE_LABEL: Record<string, string> = {
  NAO_APLICA: 'Sem arte',
  AGUARDANDO_INICIO: 'Na fila',
  EM_CRIACAO: 'Em criação',
  AGUARDANDO_CLIENTE: 'Aguardando cliente',
  REVISAO_SOLICITADA: 'Em revisão',
  APROVADA: 'Aprovada',
  LIBERADA_PCP: 'Liberada para PCP',
  AGUARDANDO_ARQUIVO_CLIENTE: 'Aguardando arquivo do cliente',
  ARQUIVO_RECEBIDO: 'Arquivo recebido',
};
