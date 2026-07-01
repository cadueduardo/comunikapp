/**
 * Regras de elegibilidade PCP por item e agregações para grid/modais.
 */

const RESPONSABILIDADES_COM_ARTE = new Set([
  'EMPRESA_CRIA',
  'EMPRESA_ADAPTA',
  'CLIENTE_FORNECE',
]);

const STATUS_ARTE_OK_PCP = new Set([
  'NAO_APLICA',
  'APROVADA',
  'LIBERADA_PCP',
  'ARQUIVO_RECEBIDO',
]);

const STATUS_ARTE_PENDENTES = new Set([
  'AGUARDANDO_INICIO',
  'EM_CRIACAO',
  'AGUARDANDO_CLIENTE',
  'REVISAO_SOLICITADA',
  'AGUARDANDO_ARQUIVO_CLIENTE',
]);

export function resolveIdsAlvoLiberacao(
  todosItemIds: string[],
  itemIdsExplicitos?: string[],
  prazosItemIds?: string[],
): string[] {
  if (itemIdsExplicitos && itemIdsExplicitos.length > 0) {
    return itemIdsExplicitos;
  }
  const idsPrazos = (prazosItemIds ?? []).filter(Boolean);
  if (
    idsPrazos.length > 0 &&
    todosItemIds.length > 0 &&
    idsPrazos.length < todosItemIds.length
  ) {
    return idsPrazos;
  }
  return todosItemIds;
}

export interface ItemFulfillmentFields {
  tipo_item?: string | null;
  parametros_tecnicos?: string | null;
  insumos_necessarios?: string | null;
}

export interface ItemLiberacaoContext extends ItemFulfillmentFields {
  id: string;
  produto_servico: string;
  data_prazo_produto?: Date | null;
  status_liberacao_pcp?: string | null;
  responsabilidade_arte?: string | null;
  status_arte?: string | null;
  materiais_disponivel?: boolean | null;
  modo_fulfillment?: string | null;
  personalizacao_modo?: string | null;
}

export function itemTemInsumosProducao(
  insumosJson?: string | null,
): boolean {
  if (!insumosJson?.trim()) {
    return false;
  }
  try {
    const arr = JSON.parse(insumosJson) as unknown;
    return (
      Array.isArray(arr) &&
      arr.length > 0 &&
      arr.some((i) =>
        Boolean(
          (i as { insumo_id?: string; nome?: string })?.insumo_id ||
            (i as { insumo_id?: string; nome?: string })?.nome,
        ),
      )
    );
  } catch {
    return false;
  }
}

/**
 * Resolve tipo comercial do item (SOB_DEMANDA vs PRODUTO_FINITO) a partir do
 * orçamento, snapshot em parametros_tecnicos ou insumos de produção.
 */
export function resolverTipoItemOrcamento(
  item: ItemFulfillmentFields,
): string | null {
  if (item.tipo_item) {
    return item.tipo_item.toUpperCase();
  }

  if (item.parametros_tecnicos) {
    try {
      const params = JSON.parse(item.parametros_tecnicos) as {
        tipo_item?: string;
        produto_finito_id?: string;
      };
      const tipo = String(params?.tipo_item || '').toUpperCase();
      if (tipo) {
        return tipo;
      }
      if (params?.produto_finito_id) {
        return 'PRODUTO_FINITO';
      }
    } catch {
      /* ignora JSON inválido */
    }
  }

  if (itemTemInsumosProducao(item.insumos_necessarios)) {
    return 'SOB_DEMANDA';
  }

  return null;
}

export function comTipoItemOrcamento<T extends { id: string } & ItemFulfillmentFields>(
  item: T,
  tipoPorId: Map<string, string>,
): T & { tipo_item: string | null } {
  return {
    ...item,
    tipo_item: item.tipo_item ?? tipoPorId.get(item.id) ?? null,
  };
}

export interface MotivoBloqueioPcp {
  codigo: string;
  mensagem: string;
}

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

function itemRequerFabricaPcpPorModo(
  item: Pick<
    ItemLiberacaoContext,
    'modo_fulfillment' | 'personalizacao_modo' | 'responsabilidade_arte'
  >,
): boolean {
  const modo = (item.modo_fulfillment || 'PICK').toUpperCase();
  if (modo === 'MAKE' || modo === 'HIBRIDO') {
    return true;
  }

  if (modo === 'PICK') {
    const pers = (item.personalizacao_modo || '').toUpperCase();
    if (pers && pers !== 'NENHUM') {
      return true;
    }
    const arte = (item.responsabilidade_arte || '').toUpperCase();
    if (
      arte &&
      arte !== 'NAO_APLICAVEL' &&
      arte !== 'NAO_APLICA' &&
      RESPONSABILIDADES_COM_ARTE.has(arte)
    ) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Item precisa passar pelo PCP (chão de fábrica)?
 * SOB_DEMANDA → sempre PCP. PRODUTO_FINITO sem personalização → expedição.
 */
export function itemRequerFabricaPcp(
  item: Pick<
    ItemLiberacaoContext,
    | 'modo_fulfillment'
    | 'personalizacao_modo'
    | 'responsabilidade_arte'
    | 'tipo_item'
    | 'parametros_tecnicos'
    | 'insumos_necessarios'
  >,
): boolean {
  const tipo = resolverTipoItemOrcamento(item);
  if (tipo === 'SOB_DEMANDA') {
    return true;
  }
  if (tipo === 'PRODUTO_FINITO') {
    return itemRequerFabricaPcpPorModo(item);
  }
  return itemRequerFabricaPcpPorModo(item);
}

export function isArteOkParaPcp(
  responsabilidadeArte?: string | null,
  statusArte?: string | null,
): boolean {
  if (!produtoRequerArte(responsabilidadeArte, statusArte)) {
    return true;
  }
  return STATUS_ARTE_OK_PCP.has((statusArte || '').toUpperCase());
}

export function getMotivosBloqueioPcp(
  item: ItemLiberacaoContext,
  osMateriaisDisponivel?: boolean,
): MotivoBloqueioPcp[] {
  const motivos: MotivoBloqueioPcp[] = [];

  if (!itemRequerFabricaPcp(item)) {
    return motivos;
  }

  const statusLiberacao = (
    item.status_liberacao_pcp || 'PENDENTE'
  ).toUpperCase();

  if (statusLiberacao === 'BLOQUEADO_AGUARDANDO_SINAL') {
    motivos.push({
      codigo: 'AGUARDANDO_SINAL',
      mensagem: 'Aguardando compensação do sinal (50%) para liberar a produção',
    });
    return motivos;
  }

  if (statusLiberacao === 'LIBERADO') {
    motivos.push({
      codigo: 'JA_LIBERADO',
      mensagem: 'Produto já liberado para PCP',
    });
    return motivos;
  }

  if (!item.data_prazo_produto) {
    motivos.push({
      codigo: 'PRAZO_NAO_DEFINIDO',
      mensagem: 'Prazo de produção não definido',
    });
  }

  if (!isArteOkParaPcp(item.responsabilidade_arte, item.status_arte)) {
    motivos.push({
      codigo: 'ARTE_PENDENTE',
      mensagem: 'Arte pendente de aprovação ou arquivo',
    });
  }

  const materiaisOk =
    item.materiais_disponivel === true || osMateriaisDisponivel === true;
  if (!materiaisOk) {
    motivos.push({
      codigo: 'MATERIAIS',
      mensagem: 'Materiais não confirmados como disponíveis',
    });
  }

  return motivos;
}

export function isElegivelPcp(
  item: ItemLiberacaoContext,
  osMateriaisDisponivel?: boolean,
): boolean {
  if (!itemRequerFabricaPcp(item)) {
    return false;
  }
  return getMotivosBloqueioPcp(item, osMateriaisDisponivel).length === 0;
}

export type StatusAgregadoArte = 'NAO_APLICA' | 'OK' | 'PENDENTE' | 'PARCIAL';

export interface ArteResumoGrid {
  status_agregado: StatusAgregadoArte;
  label: string;
  total_com_arte: number;
  aprovadas: number;
  pendentes: number;
}

export function computeArteResumoGrid(
  itens: ItemLiberacaoContext[],
): ArteResumoGrid {
  const comArte = itens.filter((i) =>
    produtoRequerArte(i.responsabilidade_arte, i.status_arte),
  );

  if (comArte.length === 0) {
    return {
      status_agregado: 'NAO_APLICA',
      label: 'Sem arte',
      total_com_arte: 0,
      aprovadas: 0,
      pendentes: 0,
    };
  }

  const aprovadas = comArte.filter((i) =>
    isArteOkParaPcp(i.responsabilidade_arte, i.status_arte),
  ).length;
  const pendentes = comArte.length - aprovadas;

  if (pendentes === 0) {
    return {
      status_agregado: 'OK',
      label: `${aprovadas}/${comArte.length} ok`,
      total_com_arte: comArte.length,
      aprovadas,
      pendentes,
    };
  }

  if (aprovadas === 0) {
    return {
      status_agregado: 'PENDENTE',
      label: `${pendentes} pendente(s)`,
      total_com_arte: comArte.length,
      aprovadas,
      pendentes,
    };
  }

  return {
    status_agregado: 'PARCIAL',
    label: `${aprovadas}/${comArte.length} ok`,
    total_com_arte: comArte.length,
    aprovadas,
    pendentes,
  };
}

export interface LiberacaoResumoGrid {
  total: number;
  liberados: number;
  pendentes: number;
  expedicao: number;
  parcial: boolean;
}

export function filtrarItensRelevantesPcp(
  itens: ItemLiberacaoContext[],
): ItemLiberacaoContext[] {
  return itens.filter((item) => itemRequerFabricaPcp(item));
}

export function computeLiberacaoResumoGrid(
  itens: ItemLiberacaoContext[],
): LiberacaoResumoGrid {
  const pcpItens = filtrarItensRelevantesPcp(itens);
  const total = pcpItens.length;
  const liberados = pcpItens.filter(
    (i) => (i.status_liberacao_pcp || 'PENDENTE').toUpperCase() === 'LIBERADO',
  ).length;
  const pendentes = total - liberados;
  const expedicao = itens.length - pcpItens.length;
  return {
    total,
    liberados,
    pendentes,
    expedicao,
    parcial: liberados > 0 && pendentes > 0,
  };
}

export function computeStatusOSLiberacaoFromItens(
  itens: ItemLiberacaoContext[],
): 'NENHUM' | 'PARCIAL' | 'COMPLETO' {
  const pcpItens = filtrarItensRelevantesPcp(itens);
  if (pcpItens.length === 0) {
    return 'COMPLETO';
  }
  const liberados = pcpItens.filter(
    (i) => (i.status_liberacao_pcp || 'PENDENTE').toUpperCase() === 'LIBERADO',
  ).length;
  return computeStatusOSLiberacao(pcpItens.length, liberados);
}

export function computeStatusOSLiberacao(
  totalItens: number,
  liberados: number,
): 'NENHUM' | 'PARCIAL' | 'COMPLETO' {
  if (liberados <= 0 || totalItens <= 0) return 'NENHUM';
  if (liberados >= totalItens) return 'COMPLETO';
  return 'PARCIAL';
}

export function labelStatusArte(statusArte?: string | null): string {
  const map: Record<string, string> = {
    NAO_APLICA: 'Sem arte',
    AGUARDANDO_INICIO: 'Na fila',
    EM_CRIACAO: 'Em criação',
    AGUARDANDO_CLIENTE: 'Aguardando cliente',
    REVISAO_SOLICITADA: 'Em revisão',
    APROVADA: 'Aprovada',
    LIBERADA_PCP: 'Aprovada',
    AGUARDANDO_ARQUIVO_CLIENTE: 'Aguardando arquivo',
    ARQUIVO_RECEBIDO: 'Arquivo recebido',
  };
  return map[(statusArte || '').toUpperCase()] || statusArte || '—';
}

export function arteProdutoPendente(statusArte?: string | null): boolean {
  return Boolean(statusArte && STATUS_ARTE_PENDENTES.has(statusArte));
}
