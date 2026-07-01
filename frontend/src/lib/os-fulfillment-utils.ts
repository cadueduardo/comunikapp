const RESPONSABILIDADES_COM_ARTE = new Set([
  'EMPRESA_CRIA',
  'EMPRESA_ADAPTA',
  'CLIENTE_FORNECE',
]);

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

export function resolverTipoItemOrcamento(item: {
  tipo_item?: string | null;
  parametros_tecnicos?: string | null;
  insumos_necessarios?: string | null;
}): string | null {
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

function itemRequerFabricaPcpPorModo(item: {
  modo_fulfillment?: string | null;
  personalizacao_modo?: string | null;
  responsabilidade_arte?: string | null;
}): boolean {
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
    if (arte && arte !== 'NAO_APLICAVEL' && arte !== 'NAO_APLICA') {
      return RESPONSABILIDADES_COM_ARTE.has(arte);
    }
    return false;
  }

  return false;
}

export function itemRequerFabricaPcp(item: {
  modo_fulfillment?: string | null;
  personalizacao_modo?: string | null;
  responsabilidade_arte?: string | null;
  tipo_item?: string | null;
  parametros_tecnicos?: string | null;
  insumos_necessarios?: string | null;
  requer_pcp_fabrica?: boolean | null;
}): boolean {
  if (typeof item.requer_pcp_fabrica === 'boolean') {
    return item.requer_pcp_fabrica;
  }

  const tipo = resolverTipoItemOrcamento(item);
  if (tipo === 'SOB_DEMANDA') {
    return true;
  }
  if (tipo === 'PRODUTO_FINITO') {
    return itemRequerFabricaPcpPorModo(item);
  }
  return itemRequerFabricaPcpPorModo(item);
}

export const MODO_FULFILLMENT_LABEL: Record<string, string> = {
  PICK: 'Expedição (estoque)',
  MAKE: 'Produção (PCP)',
  HIBRIDO: 'Híbrido (estoque + PCP)',
};

/** Rótulo exibido no modal — reflete destino operacional, não só modo_fulfillment gravado. */
export function labelModoFulfillmentItem(item: {
  modo_fulfillment?: string | null;
  personalizacao_modo?: string | null;
  responsabilidade_arte?: string | null;
  tipo_item?: string | null;
  requer_pcp_fabrica?: boolean | null;
}): string {
  if (!itemRequerFabricaPcp(item)) {
    return MODO_FULFILLMENT_LABEL.PICK;
  }

  const modo = (item.modo_fulfillment || 'MAKE').toUpperCase();
  if (modo === 'HIBRIDO') {
    return MODO_FULFILLMENT_LABEL.HIBRIDO;
  }
  return MODO_FULFILLMENT_LABEL.MAKE;
}
