import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowAssignmentService } from '../workflow-assignment.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('WorkflowAssignmentService', () => {
  let service: WorkflowAssignmentService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      ordemServico: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      workflowCategoria: {
        findMany: jest.fn(),
      },
      workflowOS: {
        findUnique: jest.fn(),
      },
      workflowInstancia: {
        findUnique: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      workflowInstanciaSetor: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest
        .fn()
        .mockImplementation((fn: any) => fn(prisma)),
    } as unknown as jest.Mocked<PrismaService>;

    service = new WorkflowAssignmentService(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar erro quando OS não for encontrada', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce(null as any);

    await expect(service.sugerirWorkflow('os-1', 'loja-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve retornar null quando não há categorias cadastradas', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce({
      id: 'os-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
    } as any);

    prisma.workflowCategoria.findMany.mockResolvedValueOnce([]);

    const resultado = await service.sugerirWorkflow('os-1', 'loja-1');
    expect(resultado).toBeNull();
  });

  it('deve atribuir workflow manualmente quando informado', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
    } as any);

    prisma.workflowCategoria.findMany.mockResolvedValueOnce([]);

    prisma.workflowOS.findUnique.mockResolvedValueOnce({
      id: 'workflow-1',
      workflow_setores: [
        { setor_id: 'setor-1', ordem: 0 },
        { setor_id: 'setor-2', ordem: 1 },
      ],
    } as any);

    prisma.workflowInstancia.findUnique.mockResolvedValueOnce(null as any);
    prisma.workflowInstancia.create.mockResolvedValueOnce({
      id: 'instancia-1',
      os_id: 'os-1',
      workflow_id: 'workflow-1',
    } as any);
    prisma.workflowInstanciaSetor.createMany.mockResolvedValueOnce({ count: 2 } as any);

    const resultado = await service.atribuirWorkflow('loja-1', {
      osId: 'os-1',
      workflowId: 'workflow-1',
    });

    expect(prisma.workflowInstancia.create).toHaveBeenCalled();
    expect(prisma.workflowInstanciaSetor.createMany).toHaveBeenCalled();
    expect(prisma.ordemServico.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'os-1' },
      }),
    );
    expect(resultado.workflowId).toBe('workflow-1');
    expect(resultado.mensagem).toContain('manual');
  });

  it('deve lançar erro quando não encontra workflow e nenhuma categoria casar', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
    } as any);

    prisma.workflowCategoria.findMany.mockResolvedValueOnce([]);

    await expect(
      service.atribuirWorkflow('loja-1', { osId: 'os-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
