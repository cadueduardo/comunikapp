import {
  FulfillmentPadrao,
  ModoFulfillmentItem,
  ModoPersonalizacao,
} from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

export interface ProdutoFinitoFulfillmentContext {
  personalizavel: boolean;
  fulfillment_padrao: FulfillmentPadrao;
  loja_id: string;
}

export interface PersonalizacaoOrcamentoContext {
  modo: ModoPersonalizacao;
  estampa_id?: string | null;
  processo_id?: string | null;
  valores_campos?: unknown;
  grade_distribuicao?: unknown;
}

export interface PropagacaoPersonalizacaoItemOS {
  modo_fulfillment: ModoFulfillmentItem;
  personalizacao_modo: ModoPersonalizacao | null;
  estampa_id: string | null;
  valores_personalizacao: unknown;
  grade_distribuicao: unknown;
  snapshot_auditoria: Record<string, unknown> | null;
}

/**
 * Clona JSON para snapshot imutável de auditoria (histórico comercial).
 */
export function clonarJsonSnapshot<T>(valor: T | null | undefined): T | null {
  if (valor === null || valor === undefined) {
    return null;
  }
  return JSON.parse(JSON.stringify(valor)) as T;
}

/**
 * Motor de roteamento PCP/Estoque por item de OS derivado de produto finito.
 */
export function resolverModoFulfillmentItem(params: {
  tipoItem?: string | null;
  produtoFinito?: ProdutoFinitoFulfillmentContext | null;
  personalizacao?: PersonalizacaoOrcamentoContext | null;
}): ModoFulfillmentItem {
  const tipoPrateleira =
    String(params.tipoItem || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO';

  if (!tipoPrateleira) {
    return ModoFulfillmentItem.PICK;
  }

  const personalizavel = Boolean(params.produtoFinito?.personalizavel);
  const modoPers = params.personalizacao?.modo ?? ModoPersonalizacao.NENHUM;

  if (!personalizavel || modoPers === ModoPersonalizacao.NENHUM) {
    return ModoFulfillmentItem.PICK;
  }

  if (
    modoPers === ModoPersonalizacao.ESTAMPA ||
    modoPers === ModoPersonalizacao.IMPRINT_LIVRE ||
    modoPers === ModoPersonalizacao.ARTE_SOB_MEDIDA
  ) {
    const fulfillment =
      params.produtoFinito?.fulfillment_padrao ?? FulfillmentPadrao.ESTOQUE;

    if (fulfillment === FulfillmentPadrao.PRODUCAO) {
      return ModoFulfillmentItem.MAKE;
    }

    if (fulfillment === FulfillmentPadrao.HIBRIDO) {
      return ModoFulfillmentItem.HIBRIDO;
    }

    // ESTOQUE + personalização ativa: reservar base e enviar ao PCP (HIBRIDO).
    return ModoFulfillmentItem.HIBRIDO;
  }

  return ModoFulfillmentItem.PICK;
}

/**
 * Propaga personalização do ProdutoOrcamento para campos de ItemOS.
 */
export function resolverPropagacaoPersonalizacaoItemOS(params: {
  tipoItem?: string | null;
  produtoFinito?: ProdutoFinitoFulfillmentContext | null;
  personalizacao?: PersonalizacaoOrcamentoContext | null;
}): PropagacaoPersonalizacaoItemOS {
  const modoFulfillment = resolverModoFulfillmentItem(params);
  const pers = params.personalizacao;

  if (!pers || pers.modo === ModoPersonalizacao.NENHUM) {
    return {
      modo_fulfillment: modoFulfillment,
      personalizacao_modo: null,
      estampa_id: null,
      valores_personalizacao: null,
      grade_distribuicao: null,
      snapshot_auditoria: null,
    };
  }

  const valoresSnapshot = clonarJsonSnapshot(pers.valores_campos);
  const gradeSnapshot = clonarJsonSnapshot(pers.grade_distribuicao);

  return {
    modo_fulfillment: modoFulfillment,
    personalizacao_modo: pers.modo,
    estampa_id: pers.estampa_id ?? null,
    valores_personalizacao: valoresSnapshot,
    grade_distribuicao: gradeSnapshot,
    snapshot_auditoria: {
      modo: pers.modo,
      estampa_id: pers.estampa_id ?? null,
      processo_id: pers.processo_id ?? null,
      valores_campos: valoresSnapshot,
      grade_distribuicao: gradeSnapshot,
      modo_fulfillment: modoFulfillment,
      imutavel: true,
      origem: 'ORCAMENTO_PERSONALIZACAO_ORCAMENTO',
    },
  };
}

/**
 * Valida que produto finito pertence ao tenant (BOLA — OWASP A01).
 */
export function assertProdutoFinitoTenant(
  produtoFinito: ProdutoFinitoFulfillmentContext | null | undefined,
  lojaId: string,
): void {
  if (!produtoFinito) {
    return;
  }
  if (produtoFinito.loja_id !== lojaId) {
    throw new ForbiddenException(
      'Produto finito não pertence ao tenant do orçamento.',
    );
  }
}
