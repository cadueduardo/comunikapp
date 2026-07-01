import { BadRequestException } from '@nestjs/common';
import { StatusFinanceiroOcorrencia } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoSplitFinanceiroService } from './instalacao-split-financeiro.service';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';

describe('InstalacaoSplitFinanceiroService', () => {
  let service: InstalacaoSplitFinanceiroService;

  const configuracaoMock = {
    osAditivaHabilitada: jest.fn().mockResolvedValue(true),
  };

  const prismaMock = {
    ocorrenciaInstalacao: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    ordemServico: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstalacaoSplitFinanceiroService(
      prismaMock as unknown as PrismaService,
      configuracaoMock as unknown as ConfiguracaoInstalacaoService,
    );
  });

  it('rejeita precificação com repasse menor que custo', async () => {
    await expect(
      service.precificarOcorrencia('occ-1', 'loja-1', 'user-1', {
        custo_interno: 100,
        preco_cliente: 50,
        versao: 0,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('isola tenant ao precificar ocorrência', async () => {
    prismaMock.ocorrenciaInstalacao.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.ocorrenciaInstalacao.findFirst.mockResolvedValue({
      id: 'occ-1',
      os_id: 'os-1',
      tipo: 'VISITA_IMPRODUTIVA',
      descricao: 'Teste',
      quantidade: 1,
      status_financeiro: StatusFinanceiroOcorrencia.PRECIFICADO,
      custo_sugerido: 80,
      preco_sugerido: 120,
      custo_interno: 80,
      preco_cliente: 120,
      versao: 1,
      os_aditiva_id: null,
      criado_em: new Date(),
    });

    await service.precificarOcorrencia('occ-1', 'loja-segura', 'user-1', {
      custo_interno: 80,
      preco_cliente: 120,
      versao: 0,
    });

    expect(prismaMock.ocorrenciaInstalacao.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'occ-1',
          loja_id: 'loja-segura',
        }),
      }),
    );
  });

  it('contadores agrupam pendências por loja', async () => {
    prismaMock.ocorrenciaInstalacao.groupBy.mockResolvedValue([
      {
        status_financeiro: StatusFinanceiroOcorrencia.PENDENTE_PRECIFICACAO,
        _count: { _all: 4 },
      },
      {
        status_financeiro: StatusFinanceiroOcorrencia.PRECIFICADO,
        _count: { _all: 2 },
      },
    ]);

    const resultado = await service.contadoresPendencias('loja-1');

    expect(prismaMock.ocorrenciaInstalacao.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ loja_id: 'loja-1' }),
      }),
    );
    expect(resultado).toEqual({
      pendentes: 4,
      precificados: 2,
      os_aditiva_habilitada: true,
    });
  });
});
