export const mapCamposPrateleiraFormulario = (produto: Record<string, unknown>) => {
  const produtoFinito = produto.produto_finito as
    | {
        sku?: string;
        estoque_atual?: number;
        preco_custo?: number | string | null;
        imagens?: Array<{ url_imagem?: string }>;
      }
    | null
    | undefined;

  const precoCustoCatalogo = produtoFinito?.preco_custo;
  const quantidade = Number(produto.quantidade) || 1;
  const custoTotalSalvo = Number(produto.custo_total_producao) || 0;
  const precoCustoUnitario =
    produto.preco_custo_snapshot ??
    precoCustoCatalogo ??
    (custoTotalSalvo > 0 && quantidade > 0 ? custoTotalSalvo / quantidade : '');

  return {
    tipo_item: String(produto.tipo_item || 'SOB_DEMANDA'),
    produto_finito_id: String(produto.produto_finito_id || ''),
    sku_snapshot: String(produto.sku_snapshot || produtoFinito?.sku || ''),
    preco_unitario_snapshot: String(
      produto.preco_unitario_snapshot ?? produto.preco_unitario ?? '',
    ),
    preco_custo_snapshot: String(precoCustoUnitario ?? ''),
    estoque_catalogo: Number(
      produto.estoque_catalogo ?? produtoFinito?.estoque_atual ?? 0,
    ),
    imagem_snapshot_url: String(
      produto.imagem_snapshot_url ||
        produtoFinito?.imagens?.[0]?.url_imagem ||
        '',
    ),
    ...mapPersonalizacaoBackendParaFormulario(produto),
  };
};

type PersonalizacaoPersistida = {
  modo?: string;
  estampa_id?: string | null;
  processo_id?: string | null;
  valores_campos?: Record<string, string> | Array<Record<string, string>> | null;
  grade_distribuicao?: Array<Record<string, unknown>> | null;
};

export const mapPersonalizacaoBackendParaFormulario = (
  produto: Record<string, unknown>,
) => {
  const pers = produto.personalizacao as PersonalizacaoPersistida | null | undefined;
  const modo = String(pers?.modo || '').toUpperCase();
  const ativa = modo === 'ESTAMPA' || modo === 'IMPRINT_LIVRE';
  const valores = pers?.valores_campos;
  const valoresEmLista = Array.isArray(valores);

  if (!ativa) {
    return {
      personalizacao_ativa: false,
      personalizacao_modo: '' as const,
      personalizacao_estampa_id: '',
      personalizacao_processo_id: '',
      personalizacao_valores_campos: {},
      personalizacao_valores_campos_vdp: [] as Array<Record<string, string>>,
      personalizacao_vdp_modo: 'INLINE' as const,
      personalizacao_grade_distribuicao: [] as Array<Record<string, unknown>>,
    };
  }

  return {
    personalizacao_ativa: true,
    personalizacao_modo: modo as 'ESTAMPA' | 'IMPRINT_LIVRE',
    personalizacao_estampa_id: String(pers?.estampa_id || ''),
    personalizacao_processo_id: String(pers?.processo_id || ''),
    personalizacao_valores_campos: valoresEmLista
      ? {}
      : ((valores as Record<string, string>) ?? {}),
    personalizacao_valores_campos_vdp: valoresEmLista
      ? (valores as Array<Record<string, string>>)
      : [],
    personalizacao_vdp_modo: valoresEmLista ? ('PLANILHA' as const) : ('INLINE' as const),
    personalizacao_grade_distribuicao: Array.isArray(pers?.grade_distribuicao)
      ? pers.grade_distribuicao
      : [],
  };
};

export const isProdutoPrateleira = (produto: Record<string, unknown>): boolean =>
  String(produto.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO';
