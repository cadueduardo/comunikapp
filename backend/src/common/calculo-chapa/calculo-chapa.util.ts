import {
  MetodoCobrancaChapa,
  ResultadoCalculoChapa,
  SimularChapaInput,
  UnidadeDimensaoChapa,
} from './calculo-chapa.types';

const UNIDADES_VALIDAS: UnidadeDimensaoChapa[] = ['mm', 'cm', 'm'];

function arredondar(valor: number, casas = 4): number {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}

function normalizarUnidade(unidade?: string): UnidadeDimensaoChapa {
  const normalizada = (unidade || 'm').toLowerCase();
  return UNIDADES_VALIDAS.includes(normalizada as UnidadeDimensaoChapa)
    ? (normalizada as UnidadeDimensaoChapa)
    : 'm';
}

function resolverUnidadesDimensao(input: SimularChapaInput): {
  unidadePeca: UnidadeDimensaoChapa;
  unidadeChapa: UnidadeDimensaoChapa;
} {
  const temUnidadeExplicita =
    input.unidadeDimensaoPeca != null || input.unidadeDimensaoChapa != null;

  if (temUnidadeExplicita) {
    return {
      unidadePeca: normalizarUnidade(
        input.unidadeDimensaoPeca ?? input.unidadeDimensao,
      ),
      unidadeChapa: normalizarUnidade(input.unidadeDimensaoChapa ?? 'm'),
    };
  }

  const legado = normalizarUnidade(input.unidadeDimensao);
  return { unidadePeca: legado, unidadeChapa: legado };
}

function paraMetros(valor: number, unidade: UnidadeDimensaoChapa): number {
  if (unidade === 'mm') return valor / 1000;
  if (unidade === 'cm') return valor / 100;
  return valor;
}

function validarPositivo(nome: string, valor: number): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error(`${nome} deve ser maior que zero.`);
  }
}

function isFormatoLinear(formato?: string | null): boolean {
  return (
    formato === 'ROLO' || formato === 'METRO_LINEAR' || formato === 'BARRA'
  );
}

/** Medidas comerciais do insumo (rolo: comprimento em altura comercial). */
export function resolverMedidasComerciaisInsumo(insumo: {
  formato_material?: string | null;
  largura?: unknown;
  altura?: unknown;
  largura_comercial?: unknown;
  altura_comercial?: unknown;
  comprimento_comercial?: unknown;
}): { largura: number; alturaChapa: number } {
  const linear = isFormatoLinear(insumo.formato_material);
  const largura = Number(insumo.largura_comercial ?? insumo.largura ?? 0);
  const comprimento = Number(
    insumo.comprimento_comercial ?? (linear ? insumo.altura : 0) ?? 0,
  );
  const alturaChapa = linear
    ? comprimento
    : Number(insumo.altura_comercial ?? insumo.altura ?? 0);
  return { largura, alturaChapa };
}

function dimensaoParaMetros(valor: number, unidade?: string | null): number {
  const u = (unidade || 'm').toLowerCase();
  if (u === 'mm' || u === 'milímetros' || u === 'milimetros')
    return valor / 1000;
  if (u === 'cm' || u === 'centímetros' || u === 'centimetros')
    return valor / 100;
  return valor;
}

/** Custo por m² de uso, alinhado ao cadastro (preço da unidade de compra ÷ área comercial). */
export function inferirCustoM2Insumo(insumo: {
  custo_unitario?: unknown;
  largura?: unknown;
  altura?: unknown;
  largura_comercial?: unknown;
  altura_comercial?: unknown;
  comprimento_comercial?: unknown;
  formato_material?: string | null;
  unidade_dimensao?: string | null;
  unidade_uso?: string | null;
  tipo_calculo?: string | null;
  quantidade_compra?: unknown;
  fator_conversao?: unknown;
}): number {
  const custo = Number(insumo.custo_unitario ?? 0);
  if (!Number.isFinite(custo) || custo <= 0) return 0;

  const { largura, alturaChapa } = resolverMedidasComerciaisInsumo(insumo);
  const unidadeUso = (insumo.unidade_uso || '').toUpperCase();
  const unidadeEhM2 = unidadeUso === 'M2' || unidadeUso === 'METRO QUADRADO';

  if (
    unidadeEhM2 &&
    largura > 0 &&
    alturaChapa > 0 &&
    (insumo.tipo_calculo === 'AREA' || !insumo.tipo_calculo)
  ) {
    const larguraM = dimensaoParaMetros(largura, insumo.unidade_dimensao);
    const alturaM = dimensaoParaMetros(alturaChapa, insumo.unidade_dimensao);
    const area = larguraM * alturaM;
    if (area > 0) return custo / area;
  }

  const quantidade = Number(insumo.quantidade_compra ?? 1);
  const fator = Number(insumo.fator_conversao ?? 1);
  const divisor = quantidade > 0 && fator > 0 ? quantidade * fator : quantidade;
  return divisor > 0 ? custo / divisor : 0;
}

export function calcularChapa(input: SimularChapaInput): ResultadoCalculoChapa {
  validarPositivo('larguraPeca', input.larguraPeca);
  validarPositivo('alturaPeca', input.alturaPeca);
  validarPositivo('quantidade', input.quantidade);
  validarPositivo('larguraChapa', input.larguraChapa);
  validarPositivo('alturaChapa', input.alturaChapa);

  if (!Object.values(MetodoCobrancaChapa).includes(input.metodoCobranca)) {
    throw new Error('metodoCobranca inválido.');
  }

  const { unidadePeca, unidadeChapa } = resolverUnidadesDimensao(input);
  const larguraPecaM = paraMetros(input.larguraPeca, unidadePeca);
  const alturaPecaM = paraMetros(input.alturaPeca, unidadePeca);
  const larguraChapaM = paraMetros(input.larguraChapa, unidadeChapa);
  const alturaChapaM = paraMetros(input.alturaChapa, unidadeChapa);
  const perdaPercent = Math.max(0, Number(input.perdaPercent ?? 0));
  const custoM2 = Math.max(0, Number(input.custoM2 ?? 0));

  const areaChapa = larguraChapaM * alturaChapaM;
  const areaPecas = larguraPecaM * alturaPecaM * input.quantidade;
  const areaComPerda = areaPecas * (1 + perdaPercent / 100);
  const chapasNecessarias = Math.ceil(areaComPerda / areaChapa);
  const areaTotalComprada = chapasNecessarias * areaChapa;
  const sobraArea = Math.max(0, areaTotalComprada - areaPecas);
  const aproveitamento =
    areaTotalComprada > 0 ? (areaPecas / areaTotalComprada) * 100 : 0;
  const sobraPercent =
    areaTotalComprada > 0 ? (sobraArea / areaTotalComprada) * 100 : 0;

  const cabeSemRotacao =
    larguraPecaM <= larguraChapaM && alturaPecaM <= alturaChapaM;
  const cabeRotacionada =
    larguraPecaM <= alturaChapaM && alturaPecaM <= larguraChapaM;
  const pecaCabeNaChapa = cabeSemRotacao || cabeRotacionada;

  let areaConsiderada = areaPecas;
  if (input.metodoCobranca === MetodoCobrancaChapa.AREA_COM_PERDA) {
    areaConsiderada = areaComPerda;
  } else if (input.metodoCobranca === MetodoCobrancaChapa.CHAPA_INTEIRA) {
    areaConsiderada = areaTotalComprada;
  } else if (input.metodoCobranca === MetodoCobrancaChapa.MANUAL) {
    areaConsiderada = Math.max(0, Number(input.areaManual ?? areaPecas));
  }

  const custoMaterial =
    input.metodoCobranca === MetodoCobrancaChapa.MANUAL &&
    input.valorManual !== undefined
      ? Math.max(0, Number(input.valorManual))
      : areaConsiderada * custoM2;

  const mensagens: string[] = [];
  if (!pecaCabeNaChapa) {
    mensagens.push('A peça não cabe na chapa selecionada.');
  }
  if (sobraPercent >= 20) {
    mensagens.push('Existe sobra estimada relevante.');
  }
  if (pecaCabeNaChapa && aproveitamento < 80) {
    mensagens.push(
      `Este serviço usa ${arredondar(aproveitamento, 2)}% da chapa. Você pode cobrar a chapa inteira ou considerar a sobra para uso futuro.`,
    );
  }

  return {
    insumo_id: input.insumoId,
    unidade_dimensao: unidadePeca,
    metodo_cobranca: input.metodoCobranca,
    peca_cabe_na_chapa: pecaCabeNaChapa,
    area_chapa_m2: arredondar(areaChapa),
    area_pecas_m2: arredondar(areaPecas),
    area_com_perda_m2: arredondar(areaComPerda),
    chapas_necessarias: chapasNecessarias,
    area_considerada_custo_m2: arredondar(areaConsiderada),
    sobra_area_m2: arredondar(sobraArea),
    aproveitamento_percent: arredondar(aproveitamento, 2),
    sobra_percent: arredondar(sobraPercent, 2),
    custo_m2: arredondar(custoM2, 4),
    custo_material: arredondar(custoMaterial, 2),
    sugestao_cobranca: arredondar(custoMaterial, 2),
    mensagens,
    parametros: {
      largura_peca: input.larguraPeca,
      altura_peca: input.alturaPeca,
      quantidade: input.quantidade,
      largura_chapa: input.larguraChapa,
      altura_chapa: input.alturaChapa,
      perda_percent: perdaPercent,
    },
  };
}
