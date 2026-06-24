export const mapCamposPrateleiraFormulario = (produto: Record<string, unknown>) => {
  const produtoFinito = produto.produto_finito as
    | {
        sku?: string;
        estoque_atual?: number;
        imagens?: Array<{ url_imagem?: string }>;
      }
    | null
    | undefined;

  return {
    tipo_item: String(produto.tipo_item || 'SOB_DEMANDA'),
    produto_finito_id: String(produto.produto_finito_id || ''),
    sku_snapshot: String(produto.sku_snapshot || produtoFinito?.sku || ''),
    preco_unitario_snapshot: String(
      produto.preco_unitario_snapshot ?? produto.preco_unitario ?? '',
    ),
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
