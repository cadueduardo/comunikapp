import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  function setup() {
    const prisma = {
      loja: {
        count: jest.fn(),
        groupBy: jest.fn(),
        findMany: jest.fn(),
      },
      usuario: {
        count: jest.fn(),
      },
      orcamento: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      ordemServico: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const service = new AdminDashboardService(prisma as any);
    return { service, prisma };
  }

  it('agrega contagens e taxa de ativação do período', async () => {
    const { service, prisma } = setup();

    prisma.loja.count.mockImplementation((args?: { where?: Record<string, unknown> }) => {
      if (!args?.where) return Promise.resolve(10);
      if (args.where.criado_em) return Promise.resolve(3);
      if (args.where.assinatura_ativa === true) return Promise.resolve(4);
      if (args.where.trial_restante_dias) return Promise.resolve(1);
      if (args.where.data_inicio_trial) return Promise.resolve(2);
      if (args.where.id) return Promise.resolve(2);
      return Promise.resolve(0);
    });
    prisma.loja.groupBy.mockResolvedValue([
      { status: 'ATIVO', _count: { _all: 6 } },
      { status: 'INATIVO', _count: { _all: 2 } },
      { status: 'PENDENTE_VERIFICACAO', _count: { _all: 1 } },
      { status: 'BLOQUEADO', _count: { _all: 1 } },
    ]);
    prisma.usuario.count.mockResolvedValue(25);
    prisma.orcamento.count.mockResolvedValue(40);
    prisma.ordemServico.count.mockResolvedValue(12);
    prisma.loja.findMany.mockImplementation(
      (args?: { select?: Record<string, unknown> }) => {
        if (args?.select && 'criado_em' in args.select) {
          return Promise.resolve([
            { id: 'l1', criado_em: new Date() },
            { id: 'l2', criado_em: new Date() },
            { id: 'l3', criado_em: new Date() },
          ]);
        }
        return Promise.resolve([
          { id: 'l1' },
          { id: 'l2' },
          { id: 'l4' },
          { id: 'l5' },
          { id: 'l6' },
          { id: 'l7' },
        ]);
      },
    );
    prisma.orcamento.findMany.mockResolvedValue([{ loja_id: 'l1' }]);
    prisma.ordemServico.findMany.mockResolvedValue([{ loja_id: 'l2' }]);

    const summary = await service.getSummary(7);

    expect(summary.timezone).toBe('America/Sao_Paulo');
    expect(summary.period.days).toBe(7);
    expect(summary.stores.total).toBe(10);
    expect(summary.stores.byStatus.ATIVO).toBe(6);
    expect(summary.stores.newInPeriod).toBe(3);
    expect(summary.stores.activeInLast7Days).toBe(2);
    expect(summary.users.activeTotal).toBe(25);
    expect(summary.volume.orcamentosInPeriod).toBe(40);
    expect(summary.activation.activatedInPeriod).toBe(2);
    expect(summary.activation.ratePercent).toBe(66.7);
    expect(summary.series.newStoresByDay.length).toBeGreaterThan(0);
    expect(summary.series.newStoresByDay.length).toBeLessThanOrEqual(8);
  });
});
