import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { roundMoney2 } from './contas-pagar-saldo.util';
import { ContaPagarParcelaDto } from '../dto/create-conta-pagar.dto';

export function assertParcelasSomamTotal(
  valorTotal: number,
  parcelas: ContaPagarParcelaDto[],
): void {
  const soma = roundMoney2(
    parcelas.reduce((acc, p) => acc + Number(p.valor_previsto), 0),
  );
  const total = roundMoney2(valorTotal);
  if (soma !== total) {
    throw new BadRequestException(
      `Soma das parcelas (${soma.toFixed(2)}) deve ser igual ao valor_total (${total.toFixed(2)}).`,
    );
  }

  const numeros = new Set(parcelas.map((p) => p.numero_parcela));
  if (numeros.size !== parcelas.length) {
    throw new BadRequestException(
      'Números de parcela devem ser únicos na conta.',
    );
  }
}

export function calcularValorFromPedido(pedido: {
  total: Prisma.Decimal;
  itens: Array<{
    tipo: string;
    total: Prisma.Decimal;
    quantidade: Prisma.Decimal;
    quantidade_recebida: Prisma.Decimal;
    quantidade_aceita: Prisma.Decimal;
  }>;
  aceites: Array<{
    itens: Array<{ valor_aceito: Prisma.Decimal | null }>;
  }>;
}): number {
  let somaAceiteValor = 0;
  for (const aceite of pedido.aceites) {
    for (const item of aceite.itens) {
      if (item.valor_aceito != null) {
        somaAceiteValor += Number(item.valor_aceito);
      }
    }
  }

  let somaProporcional = 0;
  let usouProporcao = false;
  for (const item of pedido.itens) {
    const qtd = Number(item.quantidade);
    if (qtd <= 0) {
      continue;
    }
    const confirmada =
      item.tipo === 'SERVICO'
        ? Number(item.quantidade_aceita)
        : Number(item.quantidade_recebida);
    if (confirmada > 0) {
      usouProporcao = true;
      const fator = Math.min(confirmada / qtd, 1);
      somaProporcional += Number(item.total) * fator;
    }
  }

  if (somaAceiteValor > 0) {
    return roundMoney2(somaAceiteValor);
  }
  if (usouProporcao && somaProporcional > 0) {
    return roundMoney2(somaProporcional);
  }
  return roundMoney2(Number(pedido.total));
}
