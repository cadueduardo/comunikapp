import { Injectable } from '@nestjs/common';
import { loja_status } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const TIMEZONE = 'America/Sao_Paulo';

function startOfUtcDayFromSaoPaulo(daysAgo: number, now = new Date()): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);
  // Meia-noite aproximada em America/Sao_Paulo (UTC-3, sem DST desde 2019).
  const todayUtc = Date.UTC(year, month - 1, day, 3, 0, 0, 0);
  return new Date(todayUtc - daysAgo * 24 * 60 * 60 * 1000);
}

function dateKeySaoPaulo(value: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(value);
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(days = 30) {
    const now = new Date();
    const periodStart = startOfUtcDayFromSaoPaulo(days - 1, now);
    const last7Start = startOfUtcDayFromSaoPaulo(6, now);
    const last14Start = startOfUtcDayFromSaoPaulo(13, now);
    const last30Start = startOfUtcDayFromSaoPaulo(29, now);

    const [
      totalStores,
      statusGroups,
      newInPeriod,
      withSubscription,
      trialsInProgress,
      trialsExpiringIn7Days,
      activeUsers,
      orcamentosInPeriod,
      ordensServicoInPeriod,
      newStoreRows,
      activeStoreIds7,
      activeStoreIds14,
      activeStoreIds30,
      activeStoreIdsPeriod,
      ativoStoreIds,
    ] = await Promise.all([
      this.prisma.loja.count(),
      this.prisma.loja.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.loja.count({
        where: { criado_em: { gte: periodStart } },
      }),
      this.prisma.loja.count({
        where: { assinatura_ativa: true },
      }),
      this.prisma.loja.count({
        where: {
          status: 'ATIVO',
          assinatura_ativa: false,
          data_inicio_trial: { not: null },
        },
      }),
      this.prisma.loja.count({
        where: {
          status: 'ATIVO',
          assinatura_ativa: false,
          data_inicio_trial: { not: null },
          trial_restante_dias: { gte: 0, lte: 7 },
        },
      }),
      this.prisma.usuario.count({
        where: { status: 'ATIVO', ativo: true },
      }),
      this.prisma.orcamento.count({
        where: { criado_em: { gte: periodStart } },
      }),
      this.prisma.ordemServico.count({
        where: { criado_em: { gte: periodStart } },
      }),
      this.prisma.loja.findMany({
        where: { criado_em: { gte: periodStart } },
        select: { id: true, criado_em: true },
        orderBy: { criado_em: 'asc' },
      }),
      this.listActiveStoreIds(last7Start),
      this.listActiveStoreIds(last14Start),
      this.listActiveStoreIds(last30Start),
      this.listActiveStoreIds(periodStart),
      this.prisma.loja.findMany({
        where: { status: 'ATIVO' },
        select: { id: true },
      }),
    ]);

    const byStatus: Record<loja_status, number> = {
      PENDENTE_VERIFICACAO: 0,
      ATIVO: 0,
      INATIVO: 0,
      BLOQUEADO: 0,
    };
    for (const row of statusGroups) {
      byStatus[row.status] = row._count._all;
    }

    const ativoIds = new Set(ativoStoreIds.map((row) => row.id));
    const inactiveWithoutActivity = (activeIds: Set<string>) =>
      [...ativoIds].filter((id) => !activeIds.has(id)).length;

    const newStoreIds = newStoreRows.map((row) => row.id);
    const activatedInPeriod =
      newStoreIds.length === 0
        ? 0
        : (
            await this.prisma.loja.count({
              where: {
                id: { in: newStoreIds },
                OR: [
                  { orcamento: { some: {} } },
                  { ordens_servico: { some: {} } },
                  { status: 'ATIVO' },
                ],
              },
            })
          );

    const activationRate =
      newInPeriod === 0
        ? 0
        : Number(((activatedInPeriod / newInPeriod) * 100).toFixed(1));

    const newStoresByDay = this.buildDailySeries(
      periodStart,
      now,
      newStoreRows.map((row) => row.criado_em),
    );

    return {
      timezone: TIMEZONE,
      generatedAt: now.toISOString(),
      period: {
        days,
        from: periodStart.toISOString(),
        to: now.toISOString(),
      },
      stores: {
        total: totalStores,
        byStatus,
        newInPeriod,
        withSubscription,
        trialsInProgress,
        trialsExpiringIn7Days,
        activeInLast7Days: activeStoreIds7.size,
        activeInLast30Days: activeStoreIds30.size,
        withoutActivity7Days: inactiveWithoutActivity(activeStoreIds7),
        withoutActivity14Days: inactiveWithoutActivity(activeStoreIds14),
        withoutActivity30Days: inactiveWithoutActivity(activeStoreIds30),
      },
      users: {
        activeTotal: activeUsers,
      },
      volume: {
        orcamentosInPeriod,
        ordensServicoInPeriod,
        storesWithActivityInPeriod: activeStoreIdsPeriod.size,
      },
      activation: {
        newStoresInPeriod: newInPeriod,
        activatedInPeriod,
        ratePercent: activationRate,
      },
      series: {
        newStoresByDay,
      },
      definitions: {
        activeStoreWindow:
          'Loja com ao menos um orçamento ou OS criado na janela.',
        activeUser: 'Usuário com status ATIVO e flag ativo=true.',
        trialInProgress:
          'Loja ATIVA sem assinatura e com data_inicio_trial preenchida.',
        trialExpiring:
          'Trial com trial_restante_dias entre 0 e 7 (campo legado de leitura).',
        activation:
          'Lojas novas no período que já estão ATIVAS ou criaram orçamento/OS.',
      },
    };
  }

  private async listActiveStoreIds(since: Date): Promise<Set<string>> {
    const [fromOrcamentos, fromOs] = await Promise.all([
      this.prisma.orcamento.findMany({
        where: { criado_em: { gte: since } },
        select: { loja_id: true },
        distinct: ['loja_id'],
      }),
      this.prisma.ordemServico.findMany({
        where: { criado_em: { gte: since } },
        select: { loja_id: true },
        distinct: ['loja_id'],
      }),
    ]);
    return new Set([
      ...fromOrcamentos.map((row) => row.loja_id),
      ...fromOs.map((row) => row.loja_id),
    ]);
  }

  private buildDailySeries(
    from: Date,
    to: Date,
    dates: Date[],
  ): Array<{ date: string; count: number }> {
    const counts = new Map<string, number>();
    for (const date of dates) {
      const key = dateKeySaoPaulo(date);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const series: Array<{ date: string; count: number }> = [];
    const dayMs = 24 * 60 * 60 * 1000;
    const fromMs = from.getTime();
    const toMs = to.getTime();
    const maxPoints = 400;
    let index = 0;
    for (
      let cursorMs = fromMs;
      cursorMs <= toMs && index < maxPoints;
      cursorMs += dayMs, index += 1
    ) {
      const key = dateKeySaoPaulo(new Date(cursorMs));
      series.push({ date: key, count: counts.get(key) || 0 });
    }
    return series;
  }
}
