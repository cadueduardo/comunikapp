export interface ItemPrecoDistribuicao {
  quantidade?: unknown;
  preco_total?: unknown;
}

export interface PrecoDistribuido {
  preco_unitario: number;
  preco_total: number;
}

const numeroSeguro = (valor: unknown): number => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

const paraCentavos = (valor: number): number =>
  Math.max(0, Math.round(valor * 100));

export function distribuirPrecoFinal(
  itens: ItemPrecoDistribuicao[],
  precoFinal: unknown,
): PrecoDistribuido[] {
  if (itens.length === 0) return [];

  const totalCentavos = paraCentavos(numeroSeguro(precoFinal));
  const pesosOriginais = itens.map((item) =>
    Math.max(0, numeroSeguro(item.preco_total)),
  );
  const somaPesos = pesosOriginais.reduce((soma, peso) => soma + peso, 0);
  const pesos =
    somaPesos > 0 ? pesosOriginais : itens.map(() => 1);
  const divisor = pesos.reduce((soma, peso) => soma + peso, 0);

  const parcelas = pesos.map((peso, indice) => {
    const valorExato = (totalCentavos * peso) / divisor;
    const centavos = Math.floor(valorExato);
    return {
      indice,
      centavos,
      fracao: valorExato - centavos,
    };
  });

  let centavosRestantes =
    totalCentavos -
    parcelas.reduce((soma, parcela) => soma + parcela.centavos, 0);

  [...parcelas]
    .sort((a, b) => b.fracao - a.fracao || a.indice - b.indice)
    .forEach((parcela) => {
      if (centavosRestantes <= 0) return;
      parcelas[parcela.indice].centavos += 1;
      centavosRestantes -= 1;
    });

  return parcelas.map((parcela, indice) => {
    const quantidade = Math.max(0, numeroSeguro(itens[indice].quantidade)) || 1;
    const precoTotal = parcela.centavos / 100;

    return {
      preco_unitario: precoTotal / quantidade,
      preco_total: precoTotal,
    };
  });
}
