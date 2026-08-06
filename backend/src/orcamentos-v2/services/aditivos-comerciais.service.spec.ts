import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AditivosComerciaisService } from './aditivos-comerciais.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { InstalacaoSplitFinanceiroService } from '../../instalacao/services/instalacao-split-financeiro.service';

describe('AditivosComerciaisService (Fase 9)', () => {
  let service: AditivosComerciaisService;
  let prismaMock: {
    ocorrenciaInstalacao: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
  };
  let permissionsMock: {
    assertPode: jest.Mock;
  };
  let splitFinanceiroMock: {
    precificarOcorrencia: jest.Mock;
    abonarOcorrencia: jest.Mock;
    gerarOsAditiva: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      ocorrenciaInstalacao: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    permissionsMock = {
      assertPode: jest.fn().mockResolvedValue(true),
    };

    splitFinanceiroMock = {
      precificarOcorrencia: jest.fn().mockResolvedValue({ id: 'oc-1', status_financeiro: 'PRECIFICADO' }),
      abonarOcorrencia: jest.fn().mockResolvedValue({ id: 'oc-1', status_financeiro: 'ABONADO' }),
      gerarOsAditiva: jest.fn().mockResolvedValue({
        os_aditiva_id: 'os-ad-1',
        os_aditiva_numero: 'OS-100-A1',
        os_pai_id: 'os-100',
        valor_total: 250,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AditivosComerciaisService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: VendasPermissionsService, useValue: permissionsMock },
        { provide: InstalacaoSplitFinanceiroService, useValue: splitFinanceiroMock },
      ],
    }).compile();

    service = module.get<AditivosComerciaisService>(AditivosComerciaisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. lista ocorrências operacionais pendentes para aditivo', async () => {
    prismaMock.ocorrenciaInstalacao.findMany.mockResolvedValue([
      {
        id: 'oc-1',
        os_id: 'os-100',
        tipo: 'VISITA_IMPRODUTIVA',
        descricao: 'Cliente ausente na primeira tentativa',
        quantidade: 1,
        custo_sugerido: 50,
        preco_sugerido: 100,
        preco_cliente: null,
        status_financeiro: 'PENDENTE_PRECIFICACAO',
        criado_em: new Date(),
        ordem_servico: {
          numero: 'OS-100',
          cliente: { nome: 'Empresa Alfa' },
        },
      },
    ]);

    const res = await service.listarOcorrenciasPendentes('loja-A', 'vendedor-1');

    expect(res).toHaveLength(1);
    expect(res[0].os_numero).toBe('OS-100');
    expect(res[0].cliente_nome).toBe('Empresa Alfa');
    expect(permissionsMock.assertPode).toHaveBeenCalled();
  });

  it('2. precifica ocorrência operacional com valor comercial', async () => {
    prismaMock.ocorrenciaInstalacao.findFirst.mockResolvedValue({
      id: 'oc-1',
      loja_id: 'loja-A',
      versao: 1,
      custo_sugerido: 50,
      os_aditiva_id: null,
    });

    await service.precificarOcorrencia('loja-A', 'vendedor-1', {
      ocorrencia_id: 'oc-1',
      valor_cobrado: 150,
      justificativa: 'Taxa de deslocamento',
    });

    expect(splitFinanceiroMock.precificarOcorrencia).toHaveBeenCalledWith(
      'oc-1',
      'loja-A',
      'vendedor-1',
      {
        custo_interno: 50,
        preco_cliente: 150,
        versao: 1,
        observacao_gestor: 'Taxa de deslocamento',
      },
    );
  });

  it('3. impede reprecificação de ocorrência já vinculada a uma OS Aditiva', async () => {
    prismaMock.ocorrenciaInstalacao.findFirst.mockResolvedValue({
      id: 'oc-ja-faturada',
      loja_id: 'loja-A',
      versao: 1,
      os_aditiva_id: 'os-aditiva-existente',
    });

    await expect(
      service.precificarOcorrencia('loja-A', 'vendedor-1', {
        ocorrencia_id: 'oc-ja-faturada',
        valor_cobrado: 100,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('4. gera OS Aditiva e cobrança vinculadas sem alterar a OS pai', async () => {
    const res = await service.gerarOsAditiva('loja-A', 'gestor-1', {
      os_pai_id: 'os-100',
      ocorrencia_ids: ['oc-1'],
    });

    expect(res.os_aditiva_numero).toBe('OS-100-A1');
    expect(splitFinanceiroMock.gerarOsAditiva).toHaveBeenCalledWith(
      'os-100',
      'loja-A',
      'gestor-1',
      ['oc-1'],
    );
  });
});
