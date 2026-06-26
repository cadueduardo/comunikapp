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
  };
};

export const isProdutoPrateleira = (produto: Record<string, unknown>): boolean =>
  String(produto.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO';
