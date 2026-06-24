import { Decimal } from '@prisma/client/runtime/library';

type PrecoCatalogo = {
  preco_venda: Decimal | number | string;
  preco_promocional?: Decimal | number | string | null;
};

export function resolverPrecoUnitarioProdutoFinito(
  produto: PrecoCatalogo,
): number {
  const precoVenda = Number(produto.preco_venda);
  if (!Number.isFinite(precoVenda) || precoVenda < 0) {
    return 0;
  }

  if (produto.preco_promocional == null || produto.preco_promocional === '') {
    return precoVenda;
  }

  const precoPromocional = Number(produto.preco_promocional);
  if (
    Number.isFinite(precoPromocional) &&
    precoPromocional > 0 &&
    precoPromocional < precoVenda
  ) {
    return precoPromocional;
  }

  return precoVenda;
}

export function calcularPrecoTotalProdutoFinito(
  produto: PrecoCatalogo,
  quantidade: number,
): number {
  const qtd = Math.max(1, Math.floor(Number(quantidade) || 1));
  const unitario = resolverPrecoUnitarioProdutoFinito(produto);
  return Number((unitario * qtd).toFixed(2));
}

export function isProdutoFinitoItem(produto: {
  tipo_item?: string | null;
}): boolean {
  return String(produto?.tipo_item || 'SOB_DEMANDA').toUpperCase() === 'PRODUTO_FINITO';
}
