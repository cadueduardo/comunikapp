export type MetodoCobrancaChapa =
  | "AREA_LIQUIDA"
  | "AREA_COM_PERDA"
  | "CHAPA_INTEIRA"
  | "MANUAL";

export type UnidadeDimensaoChapa = "mm" | "cm" | "m";

export interface SimularChapaInput {
  larguraPeca: number;
  alturaPeca: number;
  quantidade: number;
  larguraChapa: number;
  alturaChapa: number;
  perdaPercent?: number;
  metodoCobranca: MetodoCobrancaChapa;
  unidadeDimensao?: UnidadeDimensaoChapa;
  unidadeDimensaoPeca?: UnidadeDimensaoChapa;
  unidadeDimensaoChapa?: UnidadeDimensaoChapa;
  custoM2?: number;
  areaManual?: number;
  valorManual?: number;
}

export interface ResultadoCalculoChapa {
  pecaCabeNaChapa: boolean;
  areaChapaM2: number;
  areaPecasM2: number;
  areaComPerdaM2: number;
  chapasNecessarias: number;
  areaConsideradaCustoM2: number;
  sobraAreaM2: number;
  aproveitamentoPercent: number;
  sobraPercent: number;
  custoMaterial: number;
}

function arredondar(valor: number, casas = 4): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

function paraMetros(valor: number, unidade: UnidadeDimensaoChapa): number {
  if (unidade === "mm") return valor / 1000;
  if (unidade === "cm") return valor / 100;
  return valor;
}

function positivo(valor: number): boolean {
  return Number.isFinite(valor) && valor > 0;
}

function resolverUnidades(input: SimularChapaInput) {
  const temUnidadeExplicita =
    input.unidadeDimensaoPeca != null || input.unidadeDimensaoChapa != null;

  if (temUnidadeExplicita) {
    return {
      unidadePeca: input.unidadeDimensaoPeca ?? input.unidadeDimensao ?? "m",
      unidadeChapa: input.unidadeDimensaoChapa ?? "m",
    };
  }

  const legado = input.unidadeDimensao ?? "m";
  return { unidadePeca: legado, unidadeChapa: legado };
}

export function calcularChapa(input: SimularChapaInput): ResultadoCalculoChapa {
  const { unidadePeca, unidadeChapa } = resolverUnidades(input);
  const larguraPeca = paraMetros(input.larguraPeca, unidadePeca);
  const alturaPeca = paraMetros(input.alturaPeca, unidadePeca);
  const larguraChapa = paraMetros(input.larguraChapa, unidadeChapa);
  const alturaChapa = paraMetros(input.alturaChapa, unidadeChapa);

  if (
    !positivo(larguraPeca) ||
    !positivo(alturaPeca) ||
    !positivo(input.quantidade) ||
    !positivo(larguraChapa) ||
    !positivo(alturaChapa)
  ) {
    throw new Error("Medidas e quantidade devem ser maiores que zero.");
  }

  const perdaPercent = Math.max(0, input.perdaPercent ?? 0);
  const custoM2 = Math.max(0, input.custoM2 ?? 0);
  const areaChapa = larguraChapa * alturaChapa;
  const areaPecas = larguraPeca * alturaPeca * input.quantidade;
  const areaComPerda = areaPecas * (1 + perdaPercent / 100);
  const chapasNecessarias = Math.ceil(areaComPerda / areaChapa);
  const areaTotalComprada = chapasNecessarias * areaChapa;
  const sobraArea = Math.max(0, areaTotalComprada - areaPecas);

  let areaConsiderada = areaPecas;
  if (input.metodoCobranca === "AREA_COM_PERDA") areaConsiderada = areaComPerda;
  if (input.metodoCobranca === "CHAPA_INTEIRA") {
    areaConsiderada = areaTotalComprada;
  }
  if (input.metodoCobranca === "MANUAL") {
    areaConsiderada = Math.max(0, input.areaManual ?? areaPecas);
  }

  const pecaCabeNaChapa =
    (larguraPeca <= larguraChapa && alturaPeca <= alturaChapa) ||
    (larguraPeca <= alturaChapa && alturaPeca <= larguraChapa);

  const custoMaterial =
    input.metodoCobranca === "MANUAL" && input.valorManual !== undefined
      ? Math.max(0, input.valorManual)
      : areaConsiderada * custoM2;

  return {
    pecaCabeNaChapa,
    areaChapaM2: arredondar(areaChapa),
    areaPecasM2: arredondar(areaPecas),
    areaComPerdaM2: arredondar(areaComPerda),
    chapasNecessarias,
    areaConsideradaCustoM2: arredondar(areaConsiderada),
    sobraAreaM2: arredondar(sobraArea),
    aproveitamentoPercent: arredondar((areaPecas / areaTotalComprada) * 100, 2),
    sobraPercent: arredondar((sobraArea / areaTotalComprada) * 100, 2),
    custoMaterial: arredondar(custoMaterial, 2),
  };
}

export function classificarOcupacao(percentual: number) {
  if (percentual > 100) return "sobrecarregada";
  if (percentual >= 90) return "cheia";
  if (percentual >= 70) return "atencao";
  return "normal";
}
