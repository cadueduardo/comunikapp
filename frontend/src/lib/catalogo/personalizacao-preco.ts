import type { FaixaPreco, ProcessoDecoracaoOrcamento } from './personalizacao-orcamento.types';

export function resolverPrecoUnitarioFaixa(
  faixas: FaixaPreco[] | null | undefined,
  precoBase: number,
  quantidade: number,
): number {
  if (!faixas?.length) {
    return precoBase;
  }

  const faixa = faixas.find((f) => {
    const max = f.max == null ? Number.POSITIVE_INFINITY : Number(f.max);
    return quantidade >= Number(f.min) && quantidade <= max;
  });

  return faixa ? Number(faixa.preco) : precoBase;
}

export function calcularCustoDecoracao(
  processo: ProcessoDecoracaoOrcamento | null | undefined,
  quantidade: number,
): { setup: number; unitarioFaixa: number; total: number } {
  const setup = Number(processo?.custo_setup || 0);
  const precoBase = Number(processo?.preco_base || 0);
  const faixas = Array.isArray(processo?.faixas_preco)
    ? processo.faixas_preco
    : [];
  const unitarioFaixa = resolverPrecoUnitarioFaixa(faixas, precoBase, quantidade);
  const total = setup + unitarioFaixa * quantidade;

  return { setup, unitarioFaixa, total };
}

export function calcularPrecoLinhaPersonalizada(params: {
  precoBaseProduto: number;
  precoAdicionalEstampa: number;
  quantidade: number;
  processo: ProcessoDecoracaoOrcamento | null | undefined;
}): {
  precoUnitarioProduto: number;
  custoDecoracao: { setup: number; unitarioFaixa: number; total: number };
  precoTotalLinha: number;
} {
  const precoUnitarioProduto =
    params.precoBaseProduto + params.precoAdicionalEstampa;
  const custoDecoracao = calcularCustoDecoracao(params.processo, params.quantidade);
  const precoTotalLinha =
    precoUnitarioProduto * params.quantidade + custoDecoracao.total;

  return { precoUnitarioProduto, custoDecoracao, precoTotalLinha };
}
