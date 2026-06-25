import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { LOG_TIPO_EXPEDICAO_DEVOLUCAO } from '../constants/expedicao-log.constants';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ExpedicaoDevolucaoService } from './expedicao-devolucao.service';

describe('ExpedicaoDevolucaoService', () => {
  let service: ExpedicaoDevolucaoService;
  let prisma: {
    expedicaoLogistica: { findFirst: jest.Mock };
    usuario: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: Record<string, any>;

  beforeEach(() => {
    tx = {
      expedicaoLogistica: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      ordemServico: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workflowInstancia: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workflowInstanciaSetor: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      ordemServicoLog: {
        create: jest.fn(),
      },
    };

    prisma = {
      expedicaoLogistica: { findFirst: jest.fn() },
      usuario: { findFirst: jest.fn() },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExpedicaoDevolucaoService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(ExpedicaoDevolucaoService);
  });

  it('executa devolução em transação única com log de auditoria', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.AGUARDANDO_SEPARACAO,
      loja_id: 'loja-1',
    });
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'user-1',
      nome_completo: 'Operador Teste',
      email: 'op@teste.com',
    });

    tx.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.AGUARDANDO_SEPARACAO,
    });
    tx.ordemServico.findFirst.mockResolvedValue({ id: 'os-1', numero: 'OS-100' });
    tx.workflowInstancia.findFirst.mockResolvedValue({ id: 'wf-1' });
    tx.workflowInstanciaSetor.findMany.mockResolvedValue([
      { id: 'sis-2', ordem: 2, setor_id: 'setor-2', status: 'CONCLUIDA' },
      { id: 'sis-1', ordem: 1, setor_id: 'setor-1', status: 'CONCLUIDA' },
    ]);

    const resultado = await service.devolverParaProducao({
      expedicaoId: 'exp-1',
      lojaId: 'loja-1',
      usuarioId: 'user-1',
      motivo: 'Defeito identificado na expedição',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.expedicaoLogistica.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: {
        status: StatusExpedicao.DEVOLVIDA,
        atualizado_em: expect.any(Date),
      },
    });
    expect(tx.ordemServico.update).toHaveBeenCalledWith({
      where: { id: 'os-1' },
      data: expect.objectContaining({
        status: 'EM_WORKFLOW',
        retrabalho: true,
        modificado_por: 'user-1',
      }),
    });
    expect(tx.workflowInstanciaSetor.updateMany).toHaveBeenCalledWith({
      where: {
        workflow_instancia_id: 'wf-1',
        ordem: 2,
        status: { not: 'CANCELADA' },
      },
      data: expect.objectContaining({ status: 'PENDENTE' }),
    });
    expect(tx.workflowInstancia.update).toHaveBeenCalledWith({
      where: { id: 'wf-1' },
      data: expect.objectContaining({
        status: 'ATIVO',
        data_fim: null,
        etapa_atual: 'setor-2',
      }),
    });
    expect(tx.ordemServicoLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        os_id: 'os-1',
        tipo_acao: LOG_TIPO_EXPEDICAO_DEVOLUCAO,
        usuario_id: 'user-1',
        descricao: expect.stringContaining('Operador Teste'),
      }),
    });
    expect(resultado.workflow_reativado).toBe(true);
  });

  it('rejeita devolução de expedição já entregue', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.ENTREGUE_FINALIZADO,
      loja_id: 'loja-1',
    });
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'user-1',
      nome_completo: 'Operador',
      email: 'op@teste.com',
    });

    await expect(
      service.devolverParaProducao({
        expedicaoId: 'exp-1',
        lojaId: 'loja-1',
        usuarioId: 'user-1',
        motivo: 'Tentativa inválida',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('permite devolução sem workflow (OS finalizada manualmente)', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-2',
      os_id: 'os-2',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
      loja_id: 'loja-1',
    });
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'user-1',
      nome_completo: 'Operador',
      email: 'op@teste.com',
    });

    tx.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-2',
      os_id: 'os-2',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
    });
    tx.ordemServico.findFirst.mockResolvedValue({ id: 'os-2', numero: 'OS-200' });
    tx.workflowInstancia.findFirst.mockResolvedValue(null);

    const resultado = await service.devolverParaProducao({
      expedicaoId: 'exp-2',
      lojaId: 'loja-1',
      usuarioId: 'user-1',
      motivo: 'Revisão necessária sem PCP',
    });

    expect(resultado.workflow_reativado).toBe(false);
    expect(tx.workflowInstancia.update).not.toHaveBeenCalled();
    expect(tx.ordemServicoLog.create).toHaveBeenCalled();
  });

  it('lança NotFoundException quando expedição não pertence à loja', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue(null);

    await expect(
      service.devolverParaProducao({
        expedicaoId: 'exp-x',
        lojaId: 'loja-1',
        usuarioId: 'user-1',
        motivo: 'Motivo qualquer',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
