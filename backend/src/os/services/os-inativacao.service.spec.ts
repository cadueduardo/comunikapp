import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CobrancasService } from '../../financeiro/services/cobrancas.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';
import { OSInativacaoService } from './os-inativacao.service';

describe('OSInativacaoService', () => {
  let service: OSInativacaoService;
  let prisma: {
    ordemServico: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
    ordemServicoLog: { create: jest.Mock };
    workflowInstancia: { update: jest.Mock };
    workflowInstanciaSetor: { updateMany: jest.Mock };
    expedicaoLogistica: { update: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      ordemServico: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: typeof prisma) => unknown) =>
        fn(prisma),
      ),
      ordemServicoLog: { create: jest.fn() },
      workflowInstancia: { update: jest.fn() },
      workflowInstanciaSetor: { updateMany: jest.fn() },
      expedicaoLogistica: { update: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OSInativacaoService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: CobrancasService,
          useValue: { cancelar: jest.fn() },
        },
        {
          provide: HomeCacheService,
          useValue: { invalidarPorPrefixo: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(OSInativacaoService);
  });

  it('rejeita inativar OS já inativa', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      numero: 'OS-1',
      ativo: false,
      status: 'CANCELADA',
      expedicoes_logistica: [],
      orcamento: null,
      workflow_instancia: null,
    });

    await expect(
      service.inativar('os-1', 'loja-1', 'user-1', 'teste'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejeita inativar OS com cobrança parcialmente paga', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      numero: 'OS-1',
      ativo: true,
      status: 'EM_WORKFLOW',
      expedicoes_logistica: [],
      workflow_instancia: null,
      orcamento: {
        cobranca: {
          id: 'cob-1',
          status: 'PARCIAL_PAGO',
          valor_recebido: 100,
        },
      },
    });

    await expect(
      service.inativar('os-1', 'loja-1', 'user-1', 'teste'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('inativa OS ativa sem cobrança paga', async () => {
    prisma.ordemServico.findFirst
      .mockResolvedValueOnce({
        id: 'os-1',
        numero: 'OS-1',
        ativo: true,
        status: 'EM_WORKFLOW',
        expedicoes_logistica: [],
        workflow_instancia: null,
        orcamento: null,
      })
      .mockResolvedValueOnce(null);

    prisma.ordemServico.update.mockResolvedValue({ id: 'os-1' });

    const resultado = await service.inativar(
      'os-1',
      'loja-1',
      'user-1',
      'OS de teste',
    );

    expect(resultado.ativo).toBe(false);
    expect(prisma.ordemServico.update).toHaveBeenCalled();
  });

  it('rejeita reativar OS já ativa', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      numero: 'OS-1',
      ativo: true,
    });

    await expect(
      service.reativar('os-1', 'loja-1', 'user-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reativa OS inativa', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      numero: 'OS-1',
      ativo: false,
      status_antes_inativacao: 'LIBERADA_PARA_PCP',
      snapshot_antes_inativacao: null,
    });
    prisma.ordemServico.update.mockResolvedValue({ id: 'os-1' });

    const resultado = await service.reativar('os-1', 'loja-1', 'user-1');

    expect(resultado.ativo).toBe(true);
    expect(resultado.status).toBe('LIBERADA_PARA_PCP');
  });

  it('falha ao reativar OS inexistente', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue(null);

    await expect(
      service.reativar('os-x', 'loja-1', 'user-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
