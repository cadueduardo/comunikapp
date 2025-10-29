import { Test, TestingModule } from '@nestjs/testing';
import { PCPKanbanService } from './pcp-kanban.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SetoresProdutivosService } from '../../configuracoes/services/centros-de-trabalho/setores-produtivos.service';

jest.mock('../mappers/kanban.mapper', () => ({
  KanbanMapper: {
    mapearOSParaKanban: jest.fn(() => ({ id: 'card-1' })),
    calcularEstatisticas: jest.fn(() => ({ total: 1 })),
    mapearInstanciaParaKanban: jest.fn(() => ({ id: 'instancia-1' })),
  },
}));

const { KanbanMapper } = jest.requireMock('../mappers/kanban.mapper');

describe('PCPKanbanService', () => {
  let service: PCPKanbanService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = {
      ordemServico: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      workflowInstanciaSetor: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      workflowSetor: {
        count: jest.fn(),
      },
      itemOS: {
        findUnique: jest.fn(),
      },
      apontamento: {
        create: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCPKanbanService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: SetoresProdutivosService,
          useValue: { obterPorId: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PCPKanbanService>(PCPKanbanService);
    jest.clearAllMocks();
  });

  it('deve obter kanban geral mapeando os dados', async () => {
    prisma.ordemServico.findMany.mockResolvedValueOnce([{ id: 'os-1' } as any]);

    const resultado = await service.obterKanbanGeral('loja-1');

    expect(prisma.ordemServico.findMany).toHaveBeenCalled();
    expect(KanbanMapper.mapearOSParaKanban).toHaveBeenCalledWith({ id: 'os-1' });
    expect(KanbanMapper.calcularEstatisticas).toHaveBeenCalled();
    expect(resultado.cards).toEqual([{ id: 'card-1' }]);
    expect(resultado.stats).toEqual({ total: 1 });
  });

  it('deve obter fila do setor e mapear instâncias', async () => {
    prisma.workflowInstanciaSetor.findMany.mockResolvedValueOnce([
      { id: 'instancia', item_os: { ordemServico: {} } } as any,
    ]);

    const resultado = await service.obterFilaSetor('setor-1');

    expect(prisma.workflowInstanciaSetor.findMany).toHaveBeenCalledWith({
      where: {
        setor_id: 'setor-1',
        status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
      },
      include: {
        item_os: { include: { os: { include: { cliente: true } } } },
        setor: true,
        operador: true,
        workflow_instancia: {
          include: { os: { include: { cliente: true } } },
        },
      },
      orderBy: [{ criado_em: 'asc' }, { ordem: 'asc' }],
    });
    expect(KanbanMapper.mapearInstanciaParaKanban).toHaveBeenCalled();
    expect(resultado).toEqual([{ id: 'instancia-1' }]);
  });
});
