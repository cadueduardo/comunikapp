import { Injectable } from '@nestjs/common';
import {
  StatusContaPagar,
  StatusParcelaContaPagar,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

function roundMoney2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function inicioMesUtc(ref = new Date()): Date {
  return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
}

function fimMesUtc(ref = new Date()): Date {
  return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
}

export interface FinanceiroDashboardKpis {
  periodo: {
    inicio: string;
    fim: string;
    rotulo: string;
  };
  a_receber_saldo: number;
  a_pagar_saldo: number;
  vencido_receber: number;
  vencido_pagar: number;
  recebido_periodo: number;
  pago_periodo: number;
  saldo_liquido_periodo: number;
  pendencias_criticas: number;
  contagens: {
    cobrancas_abertas: number;
    cobrancas_vencidas: number;
    contas_abertas: number;
    contas_vencidas: number;
  };
}

/**
 * Panorama da home Financeiro — agregações leves por loja.
 */
@Injectable()
export class FinanceiroDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async obterKpis(lojaId: string): Promise<FinanceiroDashboardKpis> {
    const inicio = inicioMesUtc();
    const fim = fimMesUtc();
    const mesLabel = inicio.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    const statusCobrancaAberta = [
      'PREVISTA',
      'PARCIAL_PAGO',
      'VENCIDO',
    ];

    const [
      cobrancasAbertas,
      cobrancasVencidasAgg,
      contasAbertas,
      parcelasPagarVencidas,
      recebimentosPeriodo,
      pagamentosPeriodo,
    ] = await Promise.all([
      this.prisma.cobranca.aggregate({
        where: {
          loja_id: lojaId,
          status: { in: statusCobrancaAberta },
          cancelado_em: null,
        },
        _sum: { valor_saldo: true },
        _count: { _all: true },
      }),
      this.prisma.cobranca.aggregate({
        where: {
          loja_id: lojaId,
          status: 'VENCIDO',
          cancelado_em: null,
        },
        _sum: { valor_saldo: true },
        _count: { _all: true },
      }),
      this.prisma.contaPagar.aggregate({
        where: {
          loja_id: lojaId,
          status: {
            in: [
              StatusContaPagar.PREVISTA,
              StatusContaPagar.ABERTA,
              StatusContaPagar.PARCIAL_PAGO,
              StatusContaPagar.VENCIDA,
            ],
          },
        },
        _sum: { valor_total: true, valor_pago: true },
        _count: { _all: true },
      }),
      this.prisma.contaPagarParcela.findMany({
        where: {
          loja_id: lojaId,
          status: {
            in: [
              StatusParcelaContaPagar.VENCIDO,
              StatusParcelaContaPagar.PREVISTO,
              StatusParcelaContaPagar.PARCIAL_PAGO,
            ],
          },
          data_vencimento: { lt: new Date() },
          conta: {
            status: { not: StatusContaPagar.CANCELADA },
          },
        },
        select: {
          valor_previsto: true,
          valor_pago: true,
          status: true,
        },
      }),
      this.prisma.cobrancaRecebimento.aggregate({
        where: {
          data_recebimento: { gte: inicio, lt: fim },
          cobranca: {
            loja_id: lojaId,
            cancelado_em: null,
          },
        },
        _sum: { valor: true },
      }),
      this.prisma.pagamentoFornecedor.aggregate({
        where: {
          loja_id: lojaId,
          estornado: false,
          data_pagamento: { gte: inicio, lt: fim },
        },
        _sum: { valor: true },
      }),
    ]);

    const aReceber = roundMoney2(Number(cobrancasAbertas._sum.valor_saldo ?? 0));
    const vencidoReceber = roundMoney2(
      Number(cobrancasVencidasAgg._sum.valor_saldo ?? 0),
    );

    const totalContas = Number(contasAbertas._sum.valor_total ?? 0);
    const pagoContas = Number(contasAbertas._sum.valor_pago ?? 0);
    const aPagar = roundMoney2(Math.max(totalContas - pagoContas, 0));

    let vencidoPagar = 0;
    let contasVencidasCount = 0;
    for (const p of parcelasPagarVencidas) {
      if (p.status === StatusParcelaContaPagar.PAGO) continue;
      const saldo = Number(p.valor_previsto) - Number(p.valor_pago);
      if (saldo > 0) {
        vencidoPagar += saldo;
        contasVencidasCount += 1;
      }
    }
    vencidoPagar = roundMoney2(vencidoPagar);

    const recebidoPeriodo = roundMoney2(
      Number(recebimentosPeriodo._sum.valor ?? 0),
    );
    const pagoPeriodo = roundMoney2(Number(pagamentosPeriodo._sum.valor ?? 0));

    const cobrancasVencidasCount = cobrancasVencidasAgg._count._all;
    const pendencias =
      cobrancasVencidasCount +
      contasVencidasCount;

    return {
      periodo: {
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        rotulo: mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1),
      },
      a_receber_saldo: aReceber,
      a_pagar_saldo: aPagar,
      vencido_receber: vencidoReceber,
      vencido_pagar: vencidoPagar,
      recebido_periodo: recebidoPeriodo,
      pago_periodo: pagoPeriodo,
      saldo_liquido_periodo: roundMoney2(recebidoPeriodo - pagoPeriodo),
      pendencias_criticas: pendencias,
      contagens: {
        cobrancas_abertas: cobrancasAbertas._count._all,
        cobrancas_vencidas: cobrancasVencidasCount,
        contas_abertas: contasAbertas._count._all,
        contas_vencidas: contasVencidasCount,
      },
    };
  }
}
