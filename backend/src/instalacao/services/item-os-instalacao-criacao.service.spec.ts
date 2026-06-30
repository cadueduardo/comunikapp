import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ItemOSInstalacaoCriacaoService } from './item-os-instalacao-criacao.service';

describe('ItemOSInstalacaoCriacaoService', () => {
  let service: ItemOSInstalacaoCriacaoService;

  const prismaMock = {
    itemOS: { findFirst: jest.fn() },
    produtoOrcamento: { findFirst: jest.fn() },
    itemOSInstalacao: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    workflowInstanciaSetor: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemOSInstalacaoCriacaoService,
        { provide: PrismaService, useValue: prismaMock },
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
});
