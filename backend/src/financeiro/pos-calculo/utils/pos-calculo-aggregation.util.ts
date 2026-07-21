/** Categorias de agregação alinhadas a `TipoItemCompra` (Compras). */
export const TIPOS_CATEGORIA_POS_CALCULO = [
  'MATERIAL',
  'SERVICO',
  'DESPESA',
] as const;

export type TipoCategoriaPosCalculo =
  (typeof TIPOS_CATEGORIA_POS_CALCULO)[number];

export const LABEL_CATEGORIA_POS_CALCULO: Record<
  TipoCategoriaPosCalculo,
  string
> = {
  MATERIAL: 'Material',
  SERVICO: 'Serviço',
  DESPESA: 'Despesa',
};

export interface PosCalculoCategoriaBucket {
  previsto: number;
  comprometido: number;
  incorrido: number;
  faturado: number;
  pago: number;
}

export interface PosCalculoCategoriaLinha {
  categoria: TipoCategoriaPosCalculo;
  label: string;
  previsto: number;
  comprometido: number;
  incorrido: number;
  faturado: number;
  pago: number;
  desvio_pago: number;
  desvio_comprometido: number;
}

export interface OrcamentoPrevistoCategoriaEntrada {
  insumos: Array<{
    preco_total: number | string;
    material_do_cliente: boolean;
  }>;
  maquinas: Array<{ custo_total: number | string }>;
  funcoes: Array<{ custo_total: number | string }>;
  servicos_manuais: Array<{ custo_total: number | string }>;
  custos_indiretos: Array<{ custo_total: number | string }>;
  terceirizacao_custo_total: number | string | null;
}

export interface PosCalculoPendenciaEntrada {
  tipo: string;
  descricao: string;
  severidade?: 'info' | 'alerta' | 'critico';
}

const LIMIAR_DESVIO_ABSOLUTO = 50;
const LIMIAR_DESVIO_RELATIVO = 0.05;
const LIMIAR_DESVIO_CRITICO_ABSOLUTO = 500;
const LIMIAR_DESVIO_CRITICO_RELATIVO = 0.15;

/** Arredonda dinheiro em 2 casas (centavos). */
export function roundMoney2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export function criarBucketsCategoria(
  previstoPorTipo?: Partial<Record<TipoCategoriaPosCalculo, number>>,
): Record<TipoCategoriaPosCalculo, PosCalculoCategoriaBucket> {
  const buckets = {} as Record<
    TipoCategoriaPosCalculo,
    PosCalculoCategoriaBucket
  >;

  for (const tipo of TIPOS_CATEGORIA_POS_CALCULO) {
    buckets[tipo] = {
      previsto: roundMoney2(previstoPorTipo?.[tipo] ?? 0),
      comprometido: 0,
      incorrido: 0,
      faturado: 0,
      pago: 0,
    };
  }

  return buckets;
}

/** Estima previsto por tipo a partir do orçamento congelado (aproximação). */
export function calcularPrevistoPorTipoItem(
  produtos: OrcamentoPrevistoCategoriaEntrada[],
): Record<TipoCategoriaPosCalculo, number> {
  const previsto: Record<TipoCategoriaPosCalculo, number> = {
    MATERIAL: 0,
    SERVICO: 0,
    DESPESA: 0,
  };

  for (const produto of produtos) {
    for (const insumo of produto.insumos) {
      if (!insumo.material_do_cliente) {
        previsto.MATERIAL += Number(insumo.preco_total);
      }
    }
    for (const servico of produto.servicos_manuais) {
      previsto.SERVICO += Number(servico.custo_total);
    }
    if (produto.terceirizacao_custo_total) {
      previsto.SERVICO += Number(produto.terceirizacao_custo_total);
    }
    for (const maquina of produto.maquinas) {
      previsto.DESPESA += Number(maquina.custo_total);
    }
    for (const funcao of produto.funcoes) {
      previsto.DESPESA += Number(funcao.custo_total);
    }
    for (const indireto of produto.custos_indiretos) {
      previsto.DESPESA += Number(indireto.custo_total);
    }
  }

  return {
    MATERIAL: roundMoney2(previsto.MATERIAL),
    SERVICO: roundMoney2(previsto.SERVICO),
    DESPESA: roundMoney2(previsto.DESPESA),
  };
}

export function acumularBucketCategoria(
  buckets: Record<TipoCategoriaPosCalculo, PosCalculoCategoriaBucket>,
  categoria: TipoCategoriaPosCalculo,
  campo: keyof Omit<PosCalculoCategoriaBucket, 'previsto'>,
  valor: number,
): void {
  if (!Number.isFinite(valor) || valor === 0) {
    return;
  }
  buckets[categoria][campo] = roundMoney2(buckets[categoria][campo] + valor);
}

/** Monta linhas ordenadas omitindo categorias totalmente zeradas. */
export function montarLinhasCategorias(
  buckets: Record<TipoCategoriaPosCalculo, PosCalculoCategoriaBucket>,
): PosCalculoCategoriaLinha[] {
  const linhas: PosCalculoCategoriaLinha[] = [];

  for (const categoria of TIPOS_CATEGORIA_POS_CALCULO) {
    const bucket = buckets[categoria];
    const temDado =
      bucket.previsto !== 0 ||
      bucket.comprometido !== 0 ||
      bucket.incorrido !== 0 ||
      bucket.faturado !== 0 ||
      bucket.pago !== 0;

    if (!temDado) {
      continue;
    }

    linhas.push({
      categoria,
      label: LABEL_CATEGORIA_POS_CALCULO[categoria],
      previsto: roundMoney2(bucket.previsto),
      comprometido: roundMoney2(bucket.comprometido),
      incorrido: roundMoney2(bucket.incorrido),
      faturado: roundMoney2(bucket.faturado),
      pago: roundMoney2(bucket.pago),
      desvio_pago: roundMoney2(bucket.pago - bucket.previsto),
      desvio_comprometido: roundMoney2(
        bucket.comprometido - bucket.previsto,
      ),
    });
  }

  return linhas;
}

export function isDesvioRelevante(desvio: number, previsto: number): boolean {
  const abs = Math.abs(desvio);
  if (abs < 0.01) {
    return false;
  }
  if (abs >= LIMIAR_DESVIO_ABSOLUTO) {
    return true;
  }
  if (previsto > 0 && abs / previsto >= LIMIAR_DESVIO_RELATIVO) {
    return true;
  }
  return false;
}

export function severidadeDesvio(
  desvio: number,
  previsto: number,
): 'alerta' | 'critico' {
  if (previsto > 0 && desvio / previsto >= LIMIAR_DESVIO_CRITICO_RELATIVO) {
    return 'critico';
  }
  if (Math.abs(desvio) >= LIMIAR_DESVIO_CRITICO_ABSOLUTO) {
    return 'critico';
  }
  return 'alerta';
}

export function montarPendenciasPosCalculo(params: {
  totais: PosCalculoTotaisSaida;
  categorias: PosCalculoCategoriaLinha[];
  limitacoes: string[];
}): PosCalculoPendenciaEntrada[] {
  const pendencias: PosCalculoPendenciaEntrada[] = [];
  const { totais, categorias, limitacoes } = params;
  const previstoTotal = totais.custos.previsto;

  if (totais.custos.a_pagar > 0) {
    pendencias.push({
      tipo: 'CONTA_A_PAGAR',
      descricao: `Saldo a pagar apropriado à OS: R$ ${totais.custos.a_pagar.toFixed(2)}.`,
      severidade: 'alerta',
    });
  }

  if (
    totais.desvio_pago > 0 &&
    isDesvioRelevante(totais.desvio_pago, previstoTotal)
  ) {
    pendencias.push({
      tipo: 'DESVIO_CUSTO',
      descricao: `Custo pago acima do previsto em R$ ${totais.desvio_pago.toFixed(2)}.`,
      severidade: severidadeDesvio(totais.desvio_pago, previstoTotal),
    });
  }

  if (
    totais.desvio_comprometido > 0 &&
    isDesvioRelevante(totais.desvio_comprometido, previstoTotal)
  ) {
    pendencias.push({
      tipo: 'DESVIO_COMPROMETIDO',
      descricao: `Comprometido acima do previsto em R$ ${totais.desvio_comprometido.toFixed(2)}.`,
      severidade: severidadeDesvio(totais.desvio_comprometido, previstoTotal),
    });
  }

  for (const cat of categorias) {
    if (
      cat.desvio_pago > 0 &&
      isDesvioRelevante(cat.desvio_pago, cat.previsto)
    ) {
      pendencias.push({
        tipo: 'DESVIO_CUSTO_CATEGORIA',
        descricao: `${cat.label}: pago acima do previsto em R$ ${cat.desvio_pago.toFixed(2)}.`,
        severidade: severidadeDesvio(cat.desvio_pago, cat.previsto),
      });
    }

    if (
      cat.desvio_comprometido > 0 &&
      isDesvioRelevante(cat.desvio_comprometido, cat.previsto)
    ) {
      pendencias.push({
        tipo: 'DESVIO_COMPROMETIDO_CATEGORIA',
        descricao: `${cat.label}: comprometido acima do previsto em R$ ${cat.desvio_comprometido.toFixed(2)}.`,
        severidade: severidadeDesvio(cat.desvio_comprometido, cat.previsto),
      });
    }
  }

  if (limitacoes.some((l) => l.includes('baseline indisponível'))) {
    pendencias.push({
      tipo: 'BASELINE_AUSENTE',
      descricao: 'OS sem baseline de custo previsto confiável.',
      severidade: 'info',
    });
  }

  return pendencias;
}

export interface PosCalculoTotaisEntrada {
  receitaPrevista: number;
  receitaFaturada: number;
  receitaRecebida: number;
  custoPrevisto: number;
  custoComprometido: number;
  custoIncorrido: number;
  custoFaturado: number;
  custoPago: number;
}

export interface PosCalculoTotaisSaida {
  receita: {
    prevista: number;
    faturada: number;
    recebida: number;
  };
  custos: {
    previsto: number;
    comprometido: number;
    incorrido: number;
    faturado: number;
    pago: number;
    a_pagar: number;
  };
  desvio_pago: number;
  desvio_comprometido: number;
  margem_prevista: number;
  margem_caixa: number;
}

/** Monta resposta analítica a partir de totais brutos (valores em moeda). */
export function montarTotaisPosCalculo(
  entrada: PosCalculoTotaisEntrada,
): PosCalculoTotaisSaida {
  const receitaPrevista = roundMoney2(entrada.receitaPrevista);
  const receitaFaturada = roundMoney2(entrada.receitaFaturada);
  const receitaRecebida = roundMoney2(entrada.receitaRecebida);
  const previsto = roundMoney2(entrada.custoPrevisto);
  const comprometido = roundMoney2(entrada.custoComprometido);
  const incorrido = roundMoney2(entrada.custoIncorrido);
  const faturado = roundMoney2(entrada.custoFaturado);
  const pago = roundMoney2(entrada.custoPago);
  const aPagar = roundMoney2(Math.max(faturado - pago, 0));

  return {
    receita: {
      prevista: receitaPrevista,
      faturada: receitaFaturada,
      recebida: receitaRecebida,
    },
    custos: {
      previsto,
      comprometido,
      incorrido,
      faturado,
      pago,
      a_pagar: aPagar,
    },
    desvio_pago: roundMoney2(pago - previsto),
    desvio_comprometido: roundMoney2(comprometido - previsto),
    margem_prevista: roundMoney2(receitaPrevista - previsto),
    margem_caixa: roundMoney2(receitaRecebida - pago),
  };
}

/** Proporção do valor do item atribuída à OS (0–1). */
export function calcularProporcaoOs(
  valorOs: number,
  valorTotalApropriado: number,
): number {
  const os = Number(valorOs);
  const total = Number(valorTotalApropriado);
  if (!Number.isFinite(os) || os <= 0) {
    return 0;
  }
  if (!Number.isFinite(total) || total <= 0) {
    return 1;
  }
  return Math.min(os / total, 1);
}

/** Valor incorrido proporcional à OS a partir de quantidade aceita. */
export function calcularIncorridoProporcional(params: {
  quantidadePedido: number;
  quantidadeAceita: number;
  valorItem: number;
  valorOsApropriado: number;
  valorTotalApropriado: number;
}): number {
  const qtyPedido = Number(params.quantidadePedido);
  const qtyAceita = Number(params.quantidadeAceita);
  const valorItem = Number(params.valorItem);
  if (qtyPedido <= 0 || qtyAceita <= 0 || valorItem <= 0) {
    return 0;
  }
  const realizadoItem = (qtyAceita / qtyPedido) * valorItem;
  const proporcao = calcularProporcaoOs(
    params.valorOsApropriado,
    params.valorTotalApropriado,
  );
  return roundMoney2(realizadoItem * proporcao);
}
