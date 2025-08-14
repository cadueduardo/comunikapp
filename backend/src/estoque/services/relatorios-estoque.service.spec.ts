import { Test, TestingModule } from '@nestjs/testing';
import { RelatoriosEstoqueService } from './relatorios-estoque.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RelatoriosEstoqueService', () => {
  let service: RelatoriosEstoqueService;
  const prismaMock = {
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),
  } as unknown as PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RelatoriosEstoqueService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<RelatoriosEstoqueService>(RelatoriosEstoqueService);
  });

  it('relatorioEstoqueBaixo deve retornar array', async () => {
    const result = await service.relatorioEstoqueBaixo({ lojaId: 'loja-123' } as any);
    expect(Array.isArray(result)).toBe(true);
  });

  it('relatorioVencimento deve retornar array', async () => {
    const result = await service.relatorioVencimento({ lojaId: 'loja-123' } as any);
    expect(Array.isArray(result)).toBe(true);
  });

  it('relatorioOcupacao deve retornar array', async () => {
    const result = await service.relatorioOcupacao({ lojaId: 'loja-123' } as any);
    expect(Array.isArray(result)).toBe(true);
  });
});


