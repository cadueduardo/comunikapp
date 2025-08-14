import { Test, TestingModule } from '@nestjs/testing';
import { DashboardEstoqueService } from './dashboard-estoque.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DashboardEstoqueService', () => {
  let service: DashboardEstoqueService;
  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ total: 1 }]),
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ total: 1 }]),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardEstoqueService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<DashboardEstoqueService>(DashboardEstoqueService);
  });

  it('deve retornar objeto de dashboard com chaves esperadas', async () => {
    const result = await service.obterDashboard({ lojaId: 'loja-123' } as any);
    expect(result).toHaveProperty('totalLocalizacoes');
    expect(result).toHaveProperty('totalItens');
    expect(result).toHaveProperty('totalMovimentacoes');
    expect(result).toHaveProperty('itensAbaixoMinimo');
    expect(result).toHaveProperty('valorTotalEstoque');
    expect(result).toHaveProperty('ultimasMovimentacoes');
    expect(result).toHaveProperty('estatisticas');
  });
});


