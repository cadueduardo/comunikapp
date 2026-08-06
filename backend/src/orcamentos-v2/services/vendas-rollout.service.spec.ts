import { Test, TestingModule } from '@nestjs/testing';
import { VendasRolloutService } from './vendas-rollout.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';

describe('VendasRolloutService (Fase 12)', () => {
  let service: VendasRolloutService;
  let prismaMock: {
    orcamento: {
      count: jest.Mock;
    };
    ordemServico: {
      count: jest.Mock;
    };
    cobranca: {
      count: jest.Mock;
    };
  };
  let permissionsMock: {
    assertPode: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      orcamento: {
        count: jest.fn(),
      },
      ordemServico: {
        count: jest.fn(),
      },
      cobranca: {
        count: jest.fn(),
      },
    };

    permissionsMock = {
      assertPode: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VendasRolloutService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: VendasPermissionsService, useValue: permissionsMock },
      ],
    }).compile();

    service = module.get<VendasRolloutService>(VendasRolloutService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. executa o preflight de prontidão para a loja com sucesso', async () => {
    prismaMock.orcamento.count.mockResolvedValue(10);
    prismaMock.ordemServico.count.mockResolvedValue(5);
    prismaMock.cobranca.count.mockResolvedValue(5);

    const res = await service.verificarProntidaoLoja('loja-A', 'vendedor-1');

    expect(res.prontoParaRollout).toBe(true);
    expect(res.statusProntidao).toBe('PRONTO');
    expect(permissionsMock.assertPode).toHaveBeenCalled();
  });

  it('2. retorna métricas e sinais de observabilidade para a loja', async () => {
    prismaMock.orcamento.count.mockResolvedValue(15);
    prismaMock.ordemServico.count.mockResolvedValue(2);

    const res = await service.obterSinaisObservabilidade('loja-A', 'gestor-1');

    expect(res.lojaId).toBe('loja-A');
    expect(res.taxaSucessoHandoffPct).toBe(100);
    expect(res.sinaisInconsistencia).toBe(0);
    expect(permissionsMock.assertPode).toHaveBeenCalled();
  });
});
