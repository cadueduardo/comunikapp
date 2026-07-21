type InsumoCustoRef = {
  custo_unitario?: unknown;
  quantidade_compra?: unknown;
  fator_conversao?: unknown;
  unidade_uso?: string | null;
  logica_consumo?: string | null;
  altura?: unknown;
  largura?: unknown;
  unidade_dimensao?: string | null;
  tipo_calculo?: string | null;
};

function dimensaoParaMetros(valor: number, unidade?: string | null): number {
  switch ((unidade || '').toUpperCase()) {
    case 'CENTÍMETROS':
    case 'CENTIMETROS':
    case 'CM':
      return valor / 100;
    case 'MILÍMETROS':
    case 'MILIMETROS':
    case 'MM':
      return valor / 1000;
    default:
      return valor;
  }
}

export function calcularCustoUnitarioUso(
  insumo: InsumoCustoRef,
  custoCompraOverride?: unknown,
): number {
  const custo = Number(custoCompraOverride ?? insumo.custo_unitario ?? 0);
  const quantidade = Number(insumo.quantidade_compra ?? 0);
  const fator = Number(insumo.fator_conversao ?? 0);
  if (
    !Number.isFinite(custo) ||
    custo < 0 ||
    !Number.isFinite(quantidade) ||
    quantidade <= 0 ||
    !Number.isFinite(fator) ||
    fator <= 0
  ) {
    return 0;
  }

  const tipoCalculo = (insumo.tipo_calculo || '').toUpperCase();
  const unidadeUso = (insumo.unidade_uso || '').toUpperCase();
  const area =
    unidadeUso === 'M2' ||
    unidadeUso === 'METRO QUADRADO' ||
    insumo.logica_consumo === 'area';

  const altura = Number(insumo.altura ?? 0);
  if (
    Number.isFinite(altura) &&
    altura > 0 &&
    insumo.unidade_dimensao &&
    tipoCalculo
  ) {
    if (tipoCalculo === 'COMPRIMENTO LINEAR' || tipoCalculo === 'LINEAR') {
      const custoPorUnidade = custo / quantidade;
      return unidadeUso === 'CENTIMETRO' || unidadeUso === 'CM'
        ? custoPorUnidade / 100
        : custoPorUnidade;
    }

    if (tipoCalculo === 'AREA') {
      const largura = Number(insumo.largura ?? 0);
      if (Number.isFinite(largura) && largura > 0 && area) {
        const areaUnidade =
          dimensaoParaMetros(largura, insumo.unidade_dimensao) *
          dimensaoParaMetros(altura, insumo.unidade_dimensao);
        if (areaUnidade > 0) return custo / areaUnidade;
      }
      return custo / quantidade;
    }

    if (tipoCalculo === 'QUANTIDADE') return custo / quantidade;
  }

  return custo / (quantidade * fator);
}
