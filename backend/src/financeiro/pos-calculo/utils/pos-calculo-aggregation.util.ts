/** Arredonda dinheiro em 2 casas (centavos). */
export function roundMoney2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
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
