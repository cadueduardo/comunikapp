import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ItemOSInstalacaoCriacaoService } from './item-os-instalacao-criacao.service';
import { InstalacaoAgendaSyncService } from './instalacao-agenda-sync.service';

describe('ItemOSInstalacaoCriacaoService', () => {
  let service: ItemOSInstalacaoCriacaoService;

  const agendaSyncMock = {
    sincronizarDataOs: jest.fn(),
  };

  const txMock = {
    itemOSInstalacao: { create: jest.fn() },
  };

  const prismaMock = {
    itemOS: { findFirst: jest.fn(), findMany: jest.fn() },
    produtoOrcamento: { findFirst: jest.fn() },
    itemOSInstalacao: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    workflowInstanciaSetor: { findMany: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof txMock) => Promise<unknown>) =>
      fn(txMock),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemOSInstalacaoCriacaoService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: InstalacaoAgendaSyncService,
          useValue: agendaSyncMock,
        },
      ],
    }).compile();

    service = module.get(ItemOSInstalacaoCriacaoService);
  });

  it('ignora item sem instalação necessária', async () => {
    prismaMock.itemOS.findFirst.mockResolvedValue({
      id: 'item-1',
      quantidade: 10,
      os: { orcamento_id: 'orc-1' },
    });
    prismaMock.produtoOrcamento.findFirst.mockResolvedValue({
      instalacao_necessaria: false,
    });

    const resultado = await service.processarBaixaProducao({
      lojaId: 'loja-1',
      itemOsId: 'item-1',
      quantidadeProduzida: 5,
    });

    expect(resultado.criado).toBe(false);
    expect(resultado.motivo_skip).toBe('SEM_INSTALACAO');
  });

  it('cria lote com baixa parcial informada', async () => {
    prismaMock.itemOS.findFirst.mockResolvedValue({
      id: 'item-1',
      quantidade: 10,
      os: { orcamento_id: 'orc-1' },
    });
    prismaMock.produtoOrcamento.findFirst.mockResolvedValue({
      instalacao_necessaria: true,
      instalacao_logradouro: 'Rua A',
      instalacao_numero: '100',
      instalacao_bairro: 'Centro',
      instalacao_cidade: 'São Paulo',
      instalacao_estado: 'SP',
    });
    prismaMock.itemOSInstalacao.aggregate.mockResolvedValue({
      _sum: { quantidade_alocada: 0 },
    });
    prismaMock.itemOSInstalacao.create.mockResolvedValue({ id: 'lote-1' });

    const resultado = await service.processarBaixaProducao({
      lojaId: 'loja-1',
      itemOsId: 'item-1',
      quantidadeProduzida: 3,
    });

    expect(resultado.criado).toBe(true);
    expect(resultado.quantidade_alocada).toBe(3);
    expect(prismaMock.itemOSInstalacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quantidade_alocada: 3,
          loja_id: 'loja-1',
        }),
      }),
    );
  });

  it('processa todos os itens da OS após conclusão de produção', async () => {
    prismaMock.itemOS.findMany.mockResolvedValue([
      { id: 'item-1' },
      { id: 'item-2' },
    ]);
    prismaMock.itemOS.findFirst
      .mockResolvedValueOnce({
        id: 'item-1',
        quantidade: 10,
        os: { orcamento_id: 'orc-1' },
      })
      .mockResolvedValueOnce({
        id: 'item-2',
        quantidade: 5,
        os: { orcamento_id: 'orc-1' },
      });
    prismaMock.produtoOrcamento.findFirst
      .mockResolvedValueOnce({ instalacao_necessaria: false })
      .mockResolvedValueOnce({
        instalacao_necessaria: true,
        instalacao_logradouro: 'Rua A',
        instalacao_numero: '1',
        instalacao_bairro: 'Centro',
        instalacao_cidade: 'SP',
        instalacao_estado: 'SP',
      });
    prismaMock.itemOSInstalacao.aggregate.mockResolvedValue({
      _sum: { quantidade_alocada: 0 },
    });
    prismaMock.workflowInstanciaSetor.findMany.mockResolvedValue([
      { status: 'CONCLUIDA' },
    ]);
    prismaMock.itemOSInstalacao.create.mockResolvedValue({ id: 'lote-2' });

    const resultado = await service.processarBaixaProducaoOs('loja-1', 'os-1');

    expect(resultado.lotes_criados).toBe(1);
    expect(resultado.resultados).toHaveLength(2);
    expect(resultado.resultados[0].motivo_skip).toBe('SEM_INSTALACAO');
    expect(resultado.resultados[1].criado).toBe(true);
  });

  it('criarLoteManual sincroniza agenda na mesma transação', async () => {
    prismaMock.itemOS.findFirst.mockResolvedValue({
      id: 'item-1',
      quantidade: 10,
      os: { id: 'os-1', orcamento_id: 'orc-1' },
    });
    prismaMock.produtoOrcamento.findFirst.mockResolvedValue({
      instalacao_necessaria: true,
    });
    prismaMock.itemOSInstalacao.aggregate.mockResolvedValue({
      _sum: { quantidade_alocada: 0 },
    });
    txMock.itemOSInstalacao.create.mockResolvedValue({ id: 'lote-novo' });

    const dataPrevisao = new Date('2026-09-01T10:00:00.000Z');

    const resultado = await service.criarLoteManual({
      lojaId: 'loja-1',
      itemOsId: 'item-1',
      quantidadeAlocada: 2,
      endereco: {
        logradouro: 'Rua B',
        numero: '200',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
      },
      dataPrevisao,
      turnoPrevisao: 'MANHA',
      equipeInstalacao: 'Equipe Alpha',
    });

    expect(resultado.criado).toBe(true);
    expect(txMock.itemOSInstalacao.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          data_previsao: dataPrevisao,
          turno_previsao: 'MANHA',
          equipe_instalacao: 'Equipe Alpha',
        }),
      }),
    );
    expect(agendaSyncMock.sincronizarDataOs).toHaveBeenCalledWith(
      txMock,
      'loja-1',
      'os-1',
    );
  });
});
