import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ApontamentoService } from './apontamento.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OSPCPIntegrationService } from './os-pcp-integration.service';
import { ValidacaoEstoqueService } from '../../orcamentos-v2/services/validacao-estoque.service';
import { EstoqueApontamentoService } from '../../os/services/estoque-apontamento.service';

describe('ApontamentoService', () => {
  let service: ApontamentoService;
  let prisma: {
    ordemServico: { findFirst: jest.Mock };
    etapaInstancia: { findFirst: jest.Mock };
    apontamento: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      ordemServico: { findFirst: jest.fn() },
      etapaInstancia: { findFirst: jest.fn() },
      apontamento: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApontamentoService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: OSPCPIntegrationService,
          useValue: { notificarApontamento: jest.fn() },
        },
        { provide: ValidacaoEstoqueService, useValue: {} },
        {
          provide: EstoqueApontamentoService,
          useValue: { processarOperacaoEstoque: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ApontamentoService);
    jest.clearAllMocks();
  });

  it('deve rejeitar criacao quando OS nao pertence a loja', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.criarApontamento('loja-1', {
        os_id: 'os-outra-loja',
        tipo: 'PAUSA',
      } as any),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('deve listar apontamentos sempre filtrando por loja', async () => {
    prisma.apontamento.findMany.mockResolvedValueOnce([]);

    await service.listarApontamentos('loja-1');

    expect(prisma.apontamento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          os: { loja_id: 'loja-1' },
        }),
      }),
    );
  });
});
