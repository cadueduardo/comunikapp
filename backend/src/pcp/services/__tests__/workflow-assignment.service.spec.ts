import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowAssignmentService } from '../workflow-assignment.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('WorkflowAssignmentService', () => {
  let service: WorkflowAssignmentService;
  let prisma: any;

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
        update: jest.fn(),
      },
      workflowInstanciaSetor: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation((fn: any) => {
        return Promise.resolve(fn(prisma));
      }),
    };

    service = new WorkflowAssignmentService(prisma as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve lançar erro quando OS não for encontrada', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce(null as any);

    await expect(service.sugerirWorkflow('os-1', 'loja-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve retornar null quando não há categorias cadastradas', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);

    const resultado = await service.sugerirWorkflow('os-1', 'loja-1');
    expect(resultado).toBeNull();
  });

  it('deve atribuir workflow manualmente quando informado', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);

    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-1',
      workflow_setores: [
        { setor_id: 'setor-1', ordem: 0 },
        { setor_id: 'setor-2', ordem: 1 },
      ],
    } as any);

    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
    (prisma.workflowInstancia.create as jest.Mock).mockResolvedValueOnce({
      id: 'instancia-1',
      os_id: 'os-1',
      workflow_id: 'workflow-1',
    } as any);
    (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 2 } as any);

    const resultado = await service.atribuirWorkflow('loja-1', {
      osId: 'os-1',
      workflowId: 'workflow-1',
    });

    expect(prisma.workflowInstancia.create).toHaveBeenCalled();
    expect(prisma.workflowInstanciaSetor.createMany).toHaveBeenCalled();
    expect((prisma.ordemServico.update as jest.Mock)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'os-1' },
      }),
    );
    expect(resultado.workflowId).toBe('workflow-1');
    expect(resultado.mensagem).toContain('manual');
  });

  it('deve anexar itens liberados a uma instância existente quando não forçar', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'EM_WORKFLOW',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [
        { id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' },
        { id: 'item-2', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 2' },
      ],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);

    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-1',
      workflow_setores: [
        { setor_id: 'setor-1', ordem: 0, tempo_estimado: null },
        { setor_id: 'setor-2', ordem: 1, tempo_estimado: null },
      ],
    } as any);

    (prisma.workflowInstancia.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'instancia-1', workflow_id: 'workflow-1' } as any) // verificação inicial
      .mockResolvedValueOnce({
        id: 'instancia-1',
        status: 'ATIVO',
        etapa_atual: 'setor-1',
        data_inicio: new Date(),
      } as any);

    (prisma.workflowInstanciaSetor.findFirst as jest.Mock).mockResolvedValueOnce(null as any);
    (prisma.workflowInstanciaSetor.findMany as jest.Mock).mockResolvedValueOnce([
      { item_os_id: 'item-1' },
    ] as any);

    (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 2 } as any);
    (prisma.workflowInstancia.update as jest.Mock).mockResolvedValueOnce({ id: 'instancia-1' } as any);

    const resultado = await service.atribuirWorkflow('loja-1', {
      osId: 'os-1',
      workflowId: 'workflow-1',
      itemOsIds: ['item-2'],
    });

    expect(prisma.workflowInstanciaSetor.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ item_os_id: 'item-2', setor_id: 'setor-1' }),
        expect.objectContaining({ item_os_id: 'item-2', setor_id: 'setor-2' }),
      ]),
    });
    expect(resultado.mensagem).toContain('Workflow vinculado a 1 novo produto.');
    expect(prisma.workflowInstancia.update).toHaveBeenCalled();
  });

  it('deve retornar mensagem informativa quando itens já possuírem workflow', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'EM_WORKFLOW',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [
        { id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' },
      ],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-1',
      workflow_setores: [{ setor_id: 'setor-1', ordem: 0 }],
    } as any);

      (prisma.workflowInstancia.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: 'instancia-1', workflow_id: 'workflow-1' } as any)
      .mockResolvedValueOnce({
        id: 'instancia-1',
        status: 'ATIVO',
        etapa_atual: 'setor-1',
        data_inicio: new Date(),
      } as any);

    (prisma.workflowInstanciaSetor.findFirst as jest.Mock).mockResolvedValueOnce(null as any);
    (prisma.workflowInstanciaSetor.findMany as jest.Mock).mockResolvedValueOnce([
      { item_os_id: 'item-1' },
    ] as any);

    const resultado = await service.atribuirWorkflow('loja-1', {
      osId: 'os-1',
      workflowId: 'workflow-1',
      itemOsIds: ['item-1'],
    });

    expect(prisma.workflowInstanciaSetor.createMany).not.toHaveBeenCalled();
    expect(resultado.mensagem).toContain('Os produtos selecionados ja possuem workflow ativo.');
  });

  it('deve lançar erro quando não encontra workflow e nenhuma categoria casar', async () => {
    const osCompleta = {
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [], // OS sem itens - mas precisa existir para não lançar NotFoundException
    };

    // carregarContextoOS é chamado primeiro em atribuirWorkflow, depois em sugerirWorkflow
    (prisma.ordemServico.findFirst as jest.Mock)
      .mockResolvedValueOnce(osCompleta as any) // primeira chamada em atribuirWorkflow
      .mockResolvedValueOnce(osCompleta as any); // segunda chamada em sugerirWorkflow

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);

    await expect(
      service.atribuirWorkflow('loja-1', { osId: 'os-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve sugerir workflow baseado em categoria inteligente', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      nome_servico: 'Cartão de visita',
      descricao: 'Impressão digital',
      orcamento: {
        tags: JSON.stringify(['urgente', 'digital']),
        produtos: [],
      },
      itens: [],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'cat-1',
        workflow_id: 'workflow-sugerido',
        prioridade: 10,
        regras: [
          {
            tipo: 'PALAVRA_CHAVE',
            valor: 'impressão',
            obrigatoria: false,
            prioridade: 5,
          },
        ],
      },
    ] as any);

    const resultado = await service.sugerirWorkflow('os-1', 'loja-1');

    expect(resultado).not.toBeNull();
    expect(resultado?.workflowId).toBe('workflow-sugerido');
    expect(resultado?.categoriaId).toBe('cat-1');
    expect(resultado?.score).toBeGreaterThan(0);
    expect(resultado?.motivos.length).toBeGreaterThan(0);
  });

  it('deve atribuir workflow automaticamente usando sugestão quando workflowId não informado', async () => {
    const osCompleta = {
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      nome_servico: 'Cartão',
      orcamento: null,
      itens: [{ id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto' }],
    };

    // carregarContextoOS é chamado primeiro em atribuirWorkflow, depois em sugerirWorkflow
    (prisma.ordemServico.findFirst as jest.Mock)
      .mockResolvedValueOnce(osCompleta as any) // primeira chamada em atribuirWorkflow
      .mockResolvedValueOnce(osCompleta as any); // segunda chamada em sugerirWorkflow

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([
      {
        id: 'cat-1',
        workflow_id: 'workflow-auto',
        prioridade: 10,
        regras: [],
      },
    ] as any);

    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-auto',
      workflow_setores: [{ setor_id: 'setor-1', ordem: 0 }],
    } as any);

    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
    (prisma.workflowInstancia.create as jest.Mock).mockResolvedValueOnce({
      id: 'instancia-auto',
      os_id: 'os-1',
      workflow_id: 'workflow-auto',
    } as any);
    (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 1 } as any);

    const resultado = await service.atribuirWorkflow('loja-1', { osId: 'os-1' });

    expect(resultado.workflowId).toBe('workflow-auto');
    expect(resultado.categoriaId).toBe('cat-1');
    expect(resultado.mensagem).toContain('categoria inteligente');
  });

  it('deve lançar erro quando itemOsIds contém produtos não liberados', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [
        { id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' },
        { id: 'item-2', status_liberacao_pcp: 'PENDENTE', produto_servico: 'Produto 2' },
      ],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-1',
      workflow_setores: [{ setor_id: 'setor-1', ordem: 0 }],
    } as any);
    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);

    await expect(
      service.atribuirWorkflow('loja-1', {
        osId: 'os-1',
        workflowId: 'workflow-1',
        itemOsIds: ['item-1', 'item-2'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve lançar erro quando itemOsIds contém produtos inexistentes', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [{ id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' }],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);
    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-1',
      workflow_setores: [{ setor_id: 'setor-1', ordem: 0 }],
    } as any);
    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);

    await expect(
      service.atribuirWorkflow('loja-1', {
        osId: 'os-1',
        workflowId: 'workflow-1',
        itemOsIds: ['item-inexistente'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve reatribuir workflow quando forcar=true mesmo existindo instância', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'EM_WORKFLOW',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [{ id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' }],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);

    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-novo',
      workflow_setores: [{ setor_id: 'setor-1', ordem: 0 }],
    } as any);

    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'instancia-antiga',
      workflow_id: 'workflow-antigo',
    } as any);

    (prisma.workflowInstanciaSetor.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 2 } as any);
    (prisma.workflowInstancia.deleteMany as jest.Mock).mockResolvedValueOnce({ count: 1 } as any);
    (prisma.workflowInstancia.create as jest.Mock).mockResolvedValueOnce({
      id: 'instancia-nova',
      os_id: 'os-1',
      workflow_id: 'workflow-novo',
    } as any);
    (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 1 } as any);

    const resultado = await service.atribuirWorkflow('loja-1', {
      osId: 'os-1',
      workflowId: 'workflow-novo',
      forcar: true,
    });

    expect(prisma.workflowInstanciaSetor.deleteMany).toHaveBeenCalled();
    expect(prisma.workflowInstancia.deleteMany).toHaveBeenCalled();
    expect(prisma.workflowInstancia.create).toHaveBeenCalled();
    expect(resultado.workflowId).toBe('workflow-novo');
    expect(resultado.instanciaId).toBe('instancia-nova');
  });

  it('deve lançar erro ao tentar reatribuir workflow diferente sem forcar', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'EM_WORKFLOW',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);

    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'instancia-1',
      workflow_id: 'workflow-antigo',
    } as any);

    await expect(
      service.atribuirWorkflow('loja-1', {
        osId: 'os-1',
        workflowId: 'workflow-novo', // diferente do existente
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve validar que produtos liberados são selecionados automaticamente quando itemOsIds não informado', async () => {
    (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
      id: 'os-1',
      loja_id: 'loja-1',
      status: 'LIBERADA_PARA_PCP',
      prioridade: 'ALTA',
      insumos_calculados: '[]',
      orcamento: null,
      itens: [
        { id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' },
        { id: 'item-2', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 2' },
        { id: 'item-3', status_liberacao_pcp: 'PENDENTE', produto_servico: 'Produto 3' },
      ],
    } as any);

    (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);

    (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
      id: 'workflow-1',
      workflow_setores: [{ setor_id: 'setor-1', ordem: 0 }],
    } as any);

    (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
    (prisma.workflowInstancia.create as jest.Mock).mockResolvedValueOnce({
      id: 'instancia-1',
      os_id: 'os-1',
      workflow_id: 'workflow-1',
    } as any);
    (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 2 } as any);

    await service.atribuirWorkflow('loja-1', {
      osId: 'os-1',
      workflowId: 'workflow-1',
      // itemOsIds não informado - deve selecionar todos os liberados
    });

    expect(prisma.workflowInstanciaSetor.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ item_os_id: 'item-1' }),
        expect.objectContaining({ item_os_id: 'item-2' }),
      ]),
    });
  });

  describe('Cenários complexos de múltiplos produtos', () => {
    it('deve criar etapas para múltiplos produtos do mesmo workflow quando todos liberados simultaneamente', async () => {
      (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'os-1',
        loja_id: 'loja-1',
        status: 'LIBERADA_PARA_PCP',
        prioridade: 'ALTA',
        insumos_calculados: '[]',
        orcamento: null,
        itens: [
          { id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1', quantidade: 10 },
          { id: 'item-2', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 2', quantidade: 20 },
          { id: 'item-3', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 3', quantidade: 15 },
        ],
      } as any);

      (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);

      (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'workflow-1',
        workflow_setores: [
          { setor_id: 'setor-1', ordem: 0, tempo_estimado: 60, obrigatorio: true },
          { setor_id: 'setor-2', ordem: 1, tempo_estimado: 120, obrigatorio: true },
          { setor_id: 'setor-3', ordem: 2, tempo_estimado: 30, obrigatorio: false },
        ],
      } as any);

      (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
      (prisma.workflowInstancia.create as jest.Mock).mockResolvedValueOnce({
        id: 'instancia-1',
        os_id: 'os-1',
        workflow_id: 'workflow-1',
      } as any);
      (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 9 } as any); // 3 itens x 3 setores

      const resultado = await service.atribuirWorkflow('loja-1', {
        osId: 'os-1',
        workflowId: 'workflow-1',
      });

      expect(prisma.workflowInstancia.create).toHaveBeenCalled();
      expect(prisma.workflowInstanciaSetor.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ item_os_id: 'item-1', setor_id: 'setor-1', ordem: 0, status: 'PENDENTE' }),
          expect.objectContaining({ item_os_id: 'item-1', setor_id: 'setor-2', ordem: 1, status: 'AGUARDANDO' }),
          expect.objectContaining({ item_os_id: 'item-2', setor_id: 'setor-1', ordem: 0, status: 'PENDENTE' }),
          expect.objectContaining({ item_os_id: 'item-3', setor_id: 'setor-1', ordem: 0, status: 'PENDENTE' }),
        ]),
      });
      expect(resultado.mensagem).toContain('manual');
    });

    it('deve adicionar novos produtos a workflow existente quando liberados posteriormente', async () => {
      // Setup inicial: workflow já existe com item-1
      (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'os-1',
        loja_id: 'loja-1',
        status: 'EM_WORKFLOW',
        prioridade: 'ALTA',
        insumos_calculados: '[]',
        orcamento: null,
        itens: [
          { id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' },
          { id: 'item-2', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 2' },
        ],
      } as any);

      (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'workflow-1',
        workflow_setores: [
          { setor_id: 'setor-1', ordem: 0, tempo_estimado: 60 },
          { setor_id: 'setor-2', ordem: 1, tempo_estimado: 120 },
        ],
      } as any);

      // Instância já existe com item-1
      (prisma.workflowInstancia.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'instancia-1', workflow_id: 'workflow-1' } as any) // verificação inicial
        .mockResolvedValueOnce({
          id: 'instancia-1',
          status: 'ATIVO',
          etapa_atual: 'setor-1',
          data_inicio: new Date(),
        } as any); // busca completa para adicionarItensNaInstancia

      // Verificações para adicionarItensNaInstancia
      (prisma.workflowInstanciaSetor.findFirst as jest.Mock).mockResolvedValueOnce(null as any); // não possui escopo geral
      (prisma.workflowInstanciaSetor.findMany as jest.Mock).mockResolvedValueOnce([
        { item_os_id: 'item-1' }, // item-1 já tem workflow
      ] as any);
      
      (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 2 } as any);
      (prisma.workflowInstancia.update as jest.Mock).mockResolvedValueOnce({ id: 'instancia-1' } as any);

      const resultado = await service.atribuirWorkflow('loja-1', {
        osId: 'os-1',
        workflowId: 'workflow-1',
        itemOsIds: ['item-2'],
      });

      expect(resultado.mensagem).toContain('Workflow vinculado a 1 novo produto.');
      expect(prisma.workflowInstanciaSetor.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ 
            item_os_id: 'item-2', 
            setor_id: 'setor-1', 
            ordem: 0, 
            status: 'PENDENTE' 
          }),
          expect.objectContaining({ 
            item_os_id: 'item-2', 
            setor_id: 'setor-2', 
            ordem: 1, 
            status: 'AGUARDANDO' 
          }),
        ]),
      });
    });

    it('deve criar etapas com status AGUARDANDO para ordens superiores quando workflow é criado', async () => {
      (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'os-1',
        loja_id: 'loja-1',
        status: 'LIBERADA_PARA_PCP',
        prioridade: 'ALTA',
        insumos_calculados: '[]',
        orcamento: null,
        itens: [
          { id: 'item-1', status_liberacao_pcp: 'LIBERADO', produto_servico: 'Produto 1' },
        ],
      } as any);

      (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'workflow-1',
        workflow_setores: [
          { setor_id: 'setor-1', ordem: 0, tempo_estimado: 60 },
          { setor_id: 'setor-2', ordem: 1, tempo_estimado: 120 },
          { setor_id: 'setor-3', ordem: 2, tempo_estimado: 30 },
        ],
      } as any);

      (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);
      (prisma.workflowInstancia.create as jest.Mock).mockResolvedValueOnce({
        id: 'instancia-1',
        os_id: 'os-1',
        workflow_id: 'workflow-1',
      } as any);
      (prisma.workflowInstanciaSetor.createMany as jest.Mock).mockResolvedValueOnce({ count: 3 } as any);

      await service.atribuirWorkflow('loja-1', {
        osId: 'os-1',
        workflowId: 'workflow-1',
        itemOsIds: ['item-1'],
      });

      expect(prisma.workflowInstanciaSetor.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ item_os_id: 'item-1', ordem: 0, status: 'PENDENTE' }),
          expect.objectContaining({ item_os_id: 'item-1', ordem: 1, status: 'AGUARDANDO' }),
          expect.objectContaining({ item_os_id: 'item-1', ordem: 2, status: 'AGUARDANDO' }),
        ]),
      });
    });

    it('deve lançar erro quando OS não tem produtos liberados e itemOsIds não informado', async () => {
      (prisma.ordemServico.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 'os-1',
        loja_id: 'loja-1',
        status: 'LIBERADA_PARA_PCP',
        prioridade: 'ALTA',
        insumos_calculados: '[]',
        orcamento: null,
        itens: [
          { id: 'item-1', status_liberacao_pcp: 'PENDENTE', produto_servico: 'Produto 1' },
          { id: 'item-2', status_liberacao_pcp: 'PENDENTE', produto_servico: 'Produto 2' },
        ],
      } as any);

      (prisma.workflowCategoria.findMany as jest.Mock).mockResolvedValueOnce([]);
      (prisma.workflowOS.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'workflow-1',
        workflow_setores: [{ setor_id: 'setor-1', ordem: 0 }],
      } as any);
      (prisma.workflowInstancia.findUnique as jest.Mock).mockResolvedValueOnce(null as any);

      await expect(
        service.atribuirWorkflow('loja-1', {
          osId: 'os-1',
          workflowId: 'workflow-1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
