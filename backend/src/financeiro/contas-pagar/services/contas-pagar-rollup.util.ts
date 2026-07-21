import { NotFoundException } from '@nestjs/common';
import {
  Prisma,
  StatusContaPagar,
  StatusParcelaContaPagar,
} from '@prisma/client';
import {
  statusContaRollup,
  statusParcelaRollup,
} from './contas-pagar-saldo.util';

export const CONTA_PAGAR_INCLUDE = {
  parcelas: { orderBy: { numero_parcela: 'asc' as const } },
  fornecedor: {
    select: { id: true, nome: true, razao_social: true, cnpj_cpf: true },
  },
  pedido: { select: { id: true, numero: true, total: true, status: true } },
  pagamentos: {
    where: { estornado: false },
    orderBy: { criado_em: 'desc' as const },
    include: { apropriacoes: true },
  },
} satisfies Prisma.ContaPagarInclude;

/**
 * Atualiza status da conta e parcelas após mudança de valor_pago.
 */
export async function aplicarRollupContaPagarNoTx(
  tx: Prisma.TransactionClient,
  contaId: string,
  lojaId: string,
  agora: Date = new Date(),
) {
  const conta = await tx.contaPagar.findFirst({
    where: { id: contaId, loja_id: lojaId },
    include: { parcelas: true },
  });
  if (!conta) {
    throw new NotFoundException('Conta a pagar não encontrada.');
  }

  if (conta.status === StatusContaPagar.CANCELADA) {
    return conta;
  }

  let temParcelaVencidaNaoPaga = false;

  for (const parcela of conta.parcelas) {
    if (parcela.status === StatusParcelaContaPagar.CANCELADA) {
      continue;
    }
    const vencida =
      parcela.data_vencimento.getTime() < agora.getTime() &&
      Number(parcela.valor_pago) < Number(parcela.valor_previsto);
    if (vencida) {
      temParcelaVencidaNaoPaga = true;
    }
    const novoStatus = statusParcelaRollup({
      valorPrevisto: Number(parcela.valor_previsto),
      valorPago: Number(parcela.valor_pago),
      statusAtual: parcela.status as never,
      vencida,
    });
    if (novoStatus !== parcela.status) {
      await tx.contaPagarParcela.update({
        where: { id: parcela.id },
        data: { status: novoStatus as StatusParcelaContaPagar },
      });
    }
  }

  const novoStatusConta = statusContaRollup({
    valorTotal: Number(conta.valor_total),
    valorPago: Number(conta.valor_pago),
    statusAtual: conta.status as never,
    temParcelaVencidaNaoPaga,
  });

  return tx.contaPagar.update({
    where: { id: conta.id },
    data: { status: novoStatusConta as StatusContaPagar },
    include: CONTA_PAGAR_INCLUDE,
  });
}
