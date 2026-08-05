import { VendasHomeService } from './vendas-home.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';

describe('VendasHomeService — KPIs e escopo', () => {
  it('KPI aprovadas usa aceito_em (não atualizado_em)', async () => {
    const counts: Array<{ where: Record<string, unknown> }> = [];
    const prisma = {
      atividade_comercial: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      orcamento: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockImplementation(async (args: { where: Record<string, unknown> }) => {
          counts.push(args);
          return 3;
        }),
      },
      mensagemChat: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const perms = {
      assertPode: jest.fn().mockResolvedValue(undefined),
      pode: jest.fn().mockImplementation(async (_u: string, _l: string, p: string) =>
        p === VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA ||
        p === VENDAS_PERMISSOES.PROPOSTA_VER,
      ),
    };
    const carteiraEscopo = {
      whereOrcamento: jest.fn().mockResolvedValue({ loja_id: 'l1' }),
    };
    const svc = new VendasHomeService(
      prisma as never,
      perms as never,
      carteiraEscopo as never,
    );
    const home = await svc.obter({ usuarioId: 'u1', lojaId: 'l1' } as never);
    expect(home.kpis.disponivel).toBe(true);
    expect(home.kpis.aprovadas_periodo).toBe(3);
    const aprovadasCall = counts.find((c) => c.where.aceito_em);
    expect(aprovadasCall).toBeTruthy();
    expect(aprovadasCall!.where.atualizado_em).toBeUndefined();
  });

  it('vendedor sem VER_EQUIPE filtra atividades pelo próprio responsável', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      atividade_comercial: { findMany },
      orcamento: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      mensagemChat: { count: jest.fn().mockResolvedValue(0) },
    };
    const perms = {
      assertPode: jest.fn().mockResolvedValue(undefined),
      pode: jest.fn().mockImplementation(async (_u: string, _l: string, p: string) =>
        p === VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA ||
        p === VENDAS_PERMISSOES.PROPOSTA_VER,
      ),
    };
    const carteiraEscopo = {
      whereOrcamento: jest.fn().mockResolvedValue({ loja_id: 'l1' }),
    };
    const svc = new VendasHomeService(
      prisma as never,
      perms as never,
      carteiraEscopo as never,
    );
    await svc.obter({ usuarioId: 'u-vend', lojaId: 'l1' } as never);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          responsavel_id: 'u-vend',
          loja_id: 'l1',
        }),
      }),
    );
  });
});
