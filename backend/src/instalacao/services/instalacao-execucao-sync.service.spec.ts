import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoExecucaoSyncService } from './instalacao-execucao-sync.service';

describe('InstalacaoExecucaoSyncService', () => {
  let service: InstalacaoExecucaoSyncService;

  const prismaMock = {
    ordemServico: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    itemOS: { findMany: jest.fn() },
    produtoOrcamento: { findFirst: jest.fn() },
    itemOSInstalacao: {
      aggregate: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstalacaoExecucaoSyncService(
      prismaMock as unknown as PrismaService,
    );
  });

  it('promove todos os lotes AGUARDANDO quando a alocação está completa', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      orcamento_id: 'orc-1',
    });
    prismaMock.itemOS.findMany.mockResolvedValue([
      { id: 'item-1', quantidade: 20 },
    ]);
    prismaMock.produtoOrcamento.findFirst.mockResolvedValue({ id: 'item-1' });
    prismaMock.itemOSInstalacao.aggregate.mockResolvedValue({
      _sum: { quantidade_alocada: 20 },
    });
    prismaMock.itemOSInstalacao.updateMany.mockResolvedValue({ count: 3 });
    prismaMock.ordemServico.findFirst
      .mockResolvedValueOnce({ orcamento_id: 'orc-1' })
      .mockResolvedValueOnce({ status_instalacao_os: null });
    prismaMock.itemOSInstalacao.count.mockResolvedValue(3);

    const promovidos = await service.sincronizarAposMudancaLotes(
      'loja-1',
      'os-1',
    );

    expect(promovidos).toBe(3);
    expect(prismaMock.itemOSInstalacao.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status_instalacao: 'AGUARDANDO',
        }),
        data: expect.objectContaining({
          status_instalacao: 'EM_ANDAMENTO',
        }),
      }),
    );
    expect(prismaMock.ordemServico.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status_instalacao_os: 'EM_ANDAMENTO' },
      }),
    );
  });

  it('não promove lotes quando ainda há saldo pendente de alocação', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      orcamento_id: 'orc-1',
    });
    prismaMock.itemOS.findMany.mockResolvedValue([
      { id: 'item-1', quantidade: 20 },
    ]);
    prismaMock.produtoOrcamento.findFirst.mockResolvedValue({ id: 'item-1' });
    prismaMock.itemOSInstalacao.aggregate.mockResolvedValue({
      _sum: { quantidade_alocada: 6 },
    });

    const promovidos = await service.sincronizarAposMudancaLotes(
      'loja-1',
      'os-1',
    );

    expect(promovidos).toBe(0);
    expect(prismaMock.itemOSInstalacao.updateMany).not.toHaveBeenCalled();
  });

  it('promove lote individual após atividade de campo', async () => {
    prismaMock.itemOSInstalacao.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      status_instalacao_os: null,
    });
    prismaMock.itemOSInstalacao.count.mockResolvedValue(1);

    const promovido = await service.promoverLoteComAtividadeCampo(
      'loja-1',
      'lote-1',
      'os-1',
    );

    expect(promovido).toBe(true);
    expect(prismaMock.itemOSInstalacao.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'lote-1' }),
      }),
    );
  });
});
