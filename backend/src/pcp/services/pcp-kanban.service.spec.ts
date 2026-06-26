import { Test, TestingModule } from '@nestjs/testing';
import { PCPKanbanService } from './pcp-kanban.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SetoresProdutivosService } from '../../configuracoes/services/centros-de-trabalho/setores-produtivos.service';
import { OSPCPIntegrationService } from './os-pcp-integration.service';
import { ExpedicaoCriacaoService } from '../../expedicao/services/expedicao-criacao.service';

jest.mock('../mappers/kanban.mapper', () => ({
  KanbanMapper: {
    mapearOSParaKanban: jest.fn(() => ({ id: 'card-1' })),
    calcularEstatisticas: jest.fn(() => ({ total: 1 })),
    mapearInstanciaParaKanban: jest.fn(() => ({ id: 'instancia-1' })),
  },
}));

const { KanbanMapper } = jest.requireMock('../mappers/kanban.mapper');

describe('PCPKanbanService', () => {
  let service: PCPKanbanService;
  let prisma: any;
  let expedicaoCriacaoService: {
    criarSeElegivel: jest.Mock;
    cancelarPorReversaoConclusaoPcp: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      ordemServico: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      workflowInstanciaSetor: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      workflowInstancia: {
        update: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
      workflowSetor: {
        count: jest.fn(),
      },
      itemOS: {
        findUnique: jest.fn(),
      },
      apontamento: {
        create: jest.fn(),
      },
      usuario: {
        findFirst: jest.fn().mockResolvedValue({ id: 'operador-1' }),
      },
      $transaction: jest.fn(async (ops: unknown[]) => {
        for (const op of ops) {
          await op;
        }
      }),
    } as unknown as jest.Mocked<PrismaService>;

    expedicaoCriacaoService = {
      criarSeElegivel: jest.fn().mockResolvedValue({ criado: true }),
      cancelarPorReversaoConclusaoPcp: jest
        .fn()
        .mockResolvedValue({ cancelada: false }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PCPKanbanService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: SetoresProdutivosService,
          useValue: { obterPorId: jest.fn().mockResolvedValue({ id: 'setor-1' }) },
        },
        {
          provide: OSPCPIntegrationService,
          useValue: {
            notificarStatusAlterado: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: ExpedicaoCriacaoService,
          useValue: expedicaoCriacaoService,
        },
      ],
    }).compile();

    service = module.get<PCPKanbanService>(PCPKanbanService);
    jest.clearAllMocks();
    prisma.workflowInstanciaSetor.findUnique.mockResolvedValue({
      item_os: { os_id: 'os-1' },
      workflow_instancia: { os_id: 'os-1' },
    } as any);
  });

  it('deve obter kanban geral mapeando os dados', async () => {
    prisma.ordemServico.findMany.mockResolvedValueOnce([{ id: 'os-1' } as any]);

    const resultado = await service.obterKanbanGeral('loja-1');

    expect(prisma.ordemServico.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { aprovacao_tecnica_em: 'desc' },
          { criado_em: 'desc' },
        ],
      }),
    );
    expect(KanbanMapper.mapearOSParaKanban).toHaveBeenCalledWith({
      id: 'os-1',
    });
    expect(KanbanMapper.calcularEstatisticas).toHaveBeenCalled();
    expect(resultado.cards).toEqual([{ id: 'card-1' }]);
    expect(resultado.stats).toEqual({ total: 1 });
  });

  it('deve criar expedição ao mover OS para CONCLUIDA no kanban geral', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce({ status: 'PRODUCAO' });
    prisma.ordemServico.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.workflowInstancia.findFirst.mockResolvedValueOnce({
      id: 'wf-1',
      status: 'ATIVO',
    });
    prisma.workflowInstanciaSetor.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.workflowInstancia.update.mockResolvedValueOnce({ id: 'wf-1' });

    const resultado = await service.atualizarStatusOS('loja-1', 'os-1', 'CONCLUIDA');

    expect(prisma.ordemServico.updateMany).toHaveBeenCalledWith({
      where: { id: 'os-1', loja_id: 'loja-1' },
      data: expect.objectContaining({ status: 'FINALIZADA' }),
    });
    expect(prisma.workflowInstancia.findFirst).toHaveBeenCalled();
    expect(expedicaoCriacaoService.criarSeElegivel).toHaveBeenCalledWith(
      'os-1',
      'loja-1',
    );
    expect(resultado).toEqual({
      expedicao_criada: true,
      expedicao_cancelada: false,
    });
  });

  it('não deve criar expedição ao mover OS para PRODUCAO no kanban geral', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce({ status: 'PRODUCAO' });
    prisma.ordemServico.updateMany.mockResolvedValueOnce({ count: 1 });

    const resultado = await service.atualizarStatusOS('loja-1', 'os-1', 'PRODUCAO');

    expect(expedicaoCriacaoService.criarSeElegivel).not.toHaveBeenCalled();
    expect(
      expedicaoCriacaoService.cancelarPorReversaoConclusaoPcp,
    ).not.toHaveBeenCalled();
    expect(resultado).toEqual({
      expedicao_criada: false,
      expedicao_cancelada: false,
    });
  });

  it('deve reativar expedição arquivada ao mover OS de PRODUCAO para CONCLUIDA novamente', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce({ status: 'PRODUCAO' });
    prisma.ordemServico.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.workflowInstancia.findFirst.mockResolvedValueOnce({
      id: 'wf-1',
      status: 'ATIVO',
    });
    prisma.workflowInstanciaSetor.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.workflowInstancia.update.mockResolvedValueOnce({ id: 'wf-1' });
    expedicaoCriacaoService.criarSeElegivel.mockResolvedValueOnce({
      criado: true,
      reativado: true,
      expedicao_id: 'exp-1',
    });

    const resultado = await service.atualizarStatusOS('loja-1', 'os-1', 'CONCLUIDA');

    expect(expedicaoCriacaoService.criarSeElegivel).toHaveBeenCalledWith(
      'os-1',
      'loja-1',
    );
    expect(resultado).toEqual({
      expedicao_criada: true,
      expedicao_cancelada: false,
    });
  });

  it('deve arquivar expedição inicial ao reverter OS de CONCLUIDA para PRODUCAO', async () => {
    prisma.ordemServico.findFirst.mockResolvedValueOnce({ status: 'FINALIZADA' });
    prisma.ordemServico.updateMany.mockResolvedValueOnce({ count: 1 });
    expedicaoCriacaoService.cancelarPorReversaoConclusaoPcp.mockResolvedValueOnce({
      cancelada: true,
      expedicao_id: 'exp-1',
    });

    const resultado = await service.atualizarStatusOS('loja-1', 'os-1', 'PRODUCAO');

    expect(
      expedicaoCriacaoService.cancelarPorReversaoConclusaoPcp,
    ).toHaveBeenCalledWith('os-1', 'loja-1');
    expect(expedicaoCriacaoService.criarSeElegivel).not.toHaveBeenCalled();
    expect(resultado).toEqual({
      expedicao_criada: false,
      expedicao_cancelada: true,
    });
  });

  it('remove cards CONCLUIDA fora da janela de 24h UTC', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-25T15:00:00.000Z'));

    KanbanMapper.mapearOSParaKanban
      .mockReturnValueOnce({ id: 'os-recente', status: 'CONCLUIDA' } as any)
      .mockReturnValueOnce({ id: 'os-antiga', status: 'CONCLUIDA' } as any);
    KanbanMapper.calcularEstatisticas.mockImplementation((cards: any[]) => ({
      total: cards.length,
    }));

    prisma.ordemServico.findMany.mockResolvedValueOnce([
      {
        id: 'os-recente',
        status: 'FINALIZADA',
        atualizado_em: new Date('2026-06-25T14:00:00.000Z'),
        workflow_instancia: {
          data_fim: new Date('2026-06-25T14:00:00.000Z'),
          instancias_setor: [],
        },
      },
      {
        id: 'os-antiga',
        status: 'FINALIZADA',
        atualizado_em: new Date('2026-06-20T10:00:00.000Z'),
        workflow_instancia: {
          data_fim: new Date('2026-06-20T10:00:00.000Z'),
          instancias_setor: [],
        },
      },
    ]);

    const resultado = await service.obterKanbanGeral('loja-1');

    expect(resultado.cards).toHaveLength(1);
    expect(resultado.cards[0].id).toBe('os-recente');

    jest.useRealTimers();
  });

  it('deve obter fila do setor e mapear instâncias', async () => {
    prisma.workflowInstanciaSetor.findMany.mockResolvedValueOnce([
      { id: 'instancia', item_os: { ordemServico: {} } } as any,
    ]);

    const resultado = await service.obterFilaSetor('loja-1', 'setor-1');

    expect(prisma.workflowInstanciaSetor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          setor_id: 'setor-1',
          workflow_instancia: {
            os: {
              loja_id: 'loja-1',
            },
          },
          status: { in: ['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA'] },
        },
        orderBy: [{ criado_em: 'asc' }, { ordem: 'asc' }],
      }),
    );
    expect(KanbanMapper.mapearInstanciaParaKanban).toHaveBeenCalled();
    expect(resultado).toEqual([{ id: 'instancia-1' }]);
  });

  describe('iniciarProducao', () => {
    it('deve iniciar produção de um item e atualizar etapa', async () => {
      const etapa = {
        id: 'etapa-1',
        item_os_id: 'item-1',
        setor_id: 'setor-1',
        workflow_instancia_id: 'instancia-1',
        status: 'PENDENTE',
        ordem: 0,
      };

      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        etapa as any,
      );
      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapa,
        status: 'EM_ANDAMENTO',
      } as any);
      prisma.workflowInstancia.update.mockResolvedValueOnce({
        id: 'instancia-1',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);

      await service.iniciarProducao('loja-1', 'item-1', 'operador-1', 'Observações');

      expect(prisma.workflowInstanciaSetor.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [{ id: 'item-1' }, { item_os_id: 'item-1' }],
            status: { in: ['PENDENTE', 'PAUSADA'] },
            workflow_instancia: {
              os: {
                loja_id: 'loja-1',
              },
            },
          },
          orderBy: [{ ordem: 'asc' }, { criado_em: 'asc' }],
        }),
      );

      expect(prisma.workflowInstanciaSetor.update).toHaveBeenCalledWith({
        where: { id: 'etapa-1' },
        data: expect.objectContaining({
          status: 'EM_ANDAMENTO',
          operador_id: 'operador-1',
          data_inicio: expect.any(Date),
          observacoes: 'Observações',
        }),
      });

      expect(prisma.workflowInstancia.update).toHaveBeenCalledWith({
        where: { id: 'instancia-1' },
        data: {
          etapa_atual: 'setor-1',
          atualizado_em: expect.any(Date),
        },
      });

      expect(prisma.apontamento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          os_id: 'os-1',
          tipo: 'INICIO',
          usuario_id: 'operador-1',
          observacoes: 'Observações',
        }),
      });
    });

    it('deve lançar erro quando não há etapa pendente', async () => {
      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        null as any,
      );

      await expect(
        service.iniciarProducao('loja-1', 'item-1', 'operador-1'),
      ).rejects.toThrow('Etapa nao disponivel para inicio');
    });
  });

  describe('concluirEtapa', () => {
    it('deve concluir etapa e liberar próximo grupo quando todos concluem', async () => {
      const etapaAtual = {
        id: 'etapa-1',
        item_os_id: 'item-1',
        setor_id: 'setor-1',
        workflow_instancia_id: 'instancia-1',
        ordem: 0,
        status: 'EM_ANDAMENTO',
      };

      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        etapaAtual as any,
      );
      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapaAtual,
        status: 'CONCLUIDA',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);

      // Simular que não há mais pendentes no grupo atual
      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        null as any,
      );

      // Simular que existe próximo grupo
      const proximoGrupo = {
        id: 'etapa-2',
        workflow_instancia_id: 'instancia-1',
        ordem: 1,
        status: 'AGUARDANDO',
        setor_id: 'setor-2',
      };
      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        proximoGrupo as any,
      );
      prisma.workflowInstanciaSetor.updateMany.mockResolvedValueOnce({
        count: 2,
      } as any);
      prisma.workflowInstancia.update.mockResolvedValueOnce({
        id: 'instancia-1',
      } as any);

      await service.concluirEtapa('loja-1', 'item-1', 'operador-1', 'Concluído', 100);

      expect(prisma.workflowInstanciaSetor.update).toHaveBeenCalledWith({
        where: { id: 'etapa-1' },
        data: expect.objectContaining({
          status: 'CONCLUIDA',
          data_conclusao: expect.any(Date),
          observacoes: 'Concluído',
        }),
      });

      expect(prisma.apontamento.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          os_id: 'os-1',
          tipo: 'CONCLUSAO',
          usuario_id: 'operador-1',
          quantidade_produzida: 100,
        }),
      });

      // Deve liberar próximo grupo
      expect(prisma.workflowInstanciaSetor.updateMany).toHaveBeenCalledWith({
        where: {
          workflow_instancia_id: 'instancia-1',
          ordem: 1,
          status: 'AGUARDANDO',
        },
        data: {
          status: 'PENDENTE',
          atualizado_em: expect.any(Date),
        },
      });
    });

    it('deve concluir workflow quando não há próximo grupo', async () => {
      const etapaAtual = {
        id: 'etapa-1',
        item_os_id: 'item-1',
        setor_id: 'setor-1',
        workflow_instancia_id: 'instancia-1',
        ordem: 1,
        status: 'EM_ANDAMENTO',
      };

      prisma.workflowInstanciaSetor.findFirst
        .mockResolvedValueOnce(etapaAtual as any) // etapa atual em andamento
        .mockResolvedValueOnce(null as any) // não há pendentes no grupo atual
        .mockResolvedValueOnce(null as any); // não há próximo grupo

      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapaAtual,
        status: 'CONCLUIDA',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);
      prisma.workflowInstancia.findUnique.mockResolvedValueOnce({
        os_id: 'os-1',
        os: { loja_id: 'loja-1' },
      } as any);
      prisma.workflowInstancia.update.mockResolvedValueOnce({
        id: 'instancia-1',
      } as any);

      await service.concluirEtapa('loja-1', 'item-1', 'operador-1');

      // Deve marcar workflow como concluído
      expect(prisma.workflowInstancia.update).toHaveBeenCalledWith({
        where: { id: 'instancia-1' },
        data: {
          status: 'CONCLUIDO',
          data_fim: expect.any(Date),
          etapa_atual: null,
          atualizado_em: expect.any(Date),
        },
      });
    });

    it('deve manter próximo grupo como AGUARDANDO se ainda há pendentes no grupo atual', async () => {
      const etapaAtual = {
        id: 'etapa-1',
        item_os_id: 'item-1',
        setor_id: 'setor-1',
        workflow_instancia_id: 'instancia-1',
        ordem: 0,
        status: 'EM_ANDAMENTO',
      };

      prisma.workflowInstanciaSetor.findFirst
        .mockResolvedValueOnce(etapaAtual as any) // etapa atual em andamento - primeira busca
        .mockResolvedValueOnce({
          id: 'etapa-outro-item',
          ordem: 0,
          status: 'PENDENTE',
        } as any); // ainda há pendentes - dentro de liberarProximoGrupo

      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapaAtual,
        status: 'CONCLUIDA',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);

      await service.concluirEtapa('loja-1', 'item-1', 'operador-1');

      // Não deve liberar próximo grupo (updateMany não chamado) nem concluir workflow
      expect(prisma.workflowInstanciaSetor.updateMany).not.toHaveBeenCalled();
      expect(prisma.workflowInstancia.update).not.toHaveBeenCalled();
    });

    it('deve lançar erro quando não há etapa em andamento', async () => {
      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        null as any,
      );

      await expect(
        service.concluirEtapa('loja-1', 'item-1', 'operador-1'),
      ).rejects.toThrow('Nenhuma etapa em andamento encontrada');
    });

    it('deve liberar próximo grupo apenas quando todos os itens do grupo atual concluem', async () => {
      // Cenário: workflow com 3 produtos, todos na mesma ordem 0
      const etapaItem1 = {
        id: 'etapa-item1',
        item_os_id: 'item-1',
        workflow_instancia_id: 'instancia-1',
        ordem: 0,
        status: 'EM_ANDAMENTO',
      };

      prisma.workflowInstanciaSetor.findFirst
        .mockResolvedValueOnce(etapaItem1 as any) // etapa atual item-1
        .mockResolvedValueOnce({
          id: 'etapa-item2',
          ordem: 0,
          status: 'EM_ANDAMENTO',
        } as any); // ainda há outro item em andamento no grupo 0

      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapaItem1,
        status: 'CONCLUIDA',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);

      await service.concluirEtapa('loja-1', 'item-1', 'operador-1');

      // Não deve liberar próximo grupo ainda (item-2 ainda em andamento)
      expect(prisma.workflowInstanciaSetor.updateMany).not.toHaveBeenCalled();
      expect(prisma.workflowInstancia.update).not.toHaveBeenCalled();
    });

    it('deve liberar próximo grupo quando o último item do grupo conclui', async () => {
      const etapaItem3 = {
        id: 'etapa-item3',
        item_os_id: 'item-3',
        workflow_instancia_id: 'instancia-1',
        ordem: 0,
        status: 'EM_ANDAMENTO',
      };

      prisma.workflowInstanciaSetor.findFirst
        .mockResolvedValueOnce(etapaItem3 as any) // etapa atual item-3
        .mockResolvedValueOnce(null as any); // não há mais pendentes no grupo 0

      const proximoGrupo = {
        id: 'etapa-proximo',
        workflow_instancia_id: 'instancia-1',
        ordem: 1,
        status: 'AGUARDANDO',
        setor_id: 'setor-2',
      };
      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        proximoGrupo as any,
      );

      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapaItem3,
        status: 'CONCLUIDA',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-3',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);
      prisma.workflowInstanciaSetor.updateMany.mockResolvedValueOnce({
        count: 3,
      } as any); // 3 itens liberados para ordem 1
      prisma.workflowInstancia.update.mockResolvedValueOnce({
        id: 'instancia-1',
      } as any);

      await service.concluirEtapa('loja-1', 'item-3', 'operador-1');

      // Deve liberar próximo grupo (ordem 1) porque todos da ordem 0 concluíram
      expect(prisma.workflowInstanciaSetor.updateMany).toHaveBeenCalledWith({
        where: {
          workflow_instancia_id: 'instancia-1',
          ordem: 1,
          status: 'AGUARDANDO',
        },
        data: {
          status: 'PENDENTE',
          atualizado_em: expect.any(Date),
        },
      });

      expect(prisma.workflowInstancia.update).toHaveBeenCalledWith({
        where: { id: 'instancia-1' },
        data: {
          etapa_atual: 'setor-2',
          atualizado_em: expect.any(Date),
        },
      });
    });

    it('deve concluir workflow quando não há próximo grupo e todos os últimos itens concluem', async () => {
      const etapaFinal = {
        id: 'etapa-final',
        item_os_id: 'item-1',
        workflow_instancia_id: 'instancia-1',
        ordem: 2, // última ordem
        status: 'EM_ANDAMENTO',
        setor_id: 'setor-final',
      };

      prisma.workflowInstanciaSetor.findFirst
        .mockResolvedValueOnce(etapaFinal as any) // etapa atual
        .mockResolvedValueOnce(null as any) // não há mais pendentes no grupo 2
        .mockResolvedValueOnce(null as any); // não há próximo grupo

      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapaFinal,
        status: 'CONCLUIDA',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-1',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);
      prisma.workflowInstancia.findUnique.mockResolvedValueOnce({
        os_id: 'os-1',
        os: { loja_id: 'loja-1' },
      } as any);
      prisma.workflowInstancia.update.mockResolvedValueOnce({
        id: 'instancia-1',
      } as any);

      await service.concluirEtapa('loja-1', 'item-1', 'operador-1');

      // Deve marcar workflow como concluído
      expect(prisma.workflowInstancia.update).toHaveBeenCalledWith({
        where: { id: 'instancia-1' },
        data: {
          status: 'CONCLUIDO',
          data_fim: expect.any(Date),
          etapa_atual: null,
          atualizado_em: expect.any(Date),
        },
      });
    });

    it('deve manter status de itens em ordens diferentes quando apenas um grupo conclui', async () => {
      // Cenário: ordem 0 tem 2 itens, ordem 1 tem 2 itens
      // Quando ordem 0 conclui, ordem 1 deve ser liberada
      // Mas ordem 1 não deve mudar status de itens se algum já estava em outro status
      const etapaOrdem0Item = {
        id: 'etapa-ordem0',
        item_os_id: 'item-ordem0',
        workflow_instancia_id: 'instancia-1',
        ordem: 0,
        status: 'EM_ANDAMENTO',
      };

      prisma.workflowInstanciaSetor.findFirst
        .mockResolvedValueOnce(etapaOrdem0Item as any)
        .mockResolvedValueOnce(null as any); // não há mais pendentes na ordem 0

      const proximoGrupo = {
        id: 'etapa-ordem1',
        workflow_instancia_id: 'instancia-1',
        ordem: 1,
        status: 'AGUARDANDO',
        setor_id: 'setor-ordem1',
      };
      prisma.workflowInstanciaSetor.findFirst.mockResolvedValueOnce(
        proximoGrupo as any,
      );

      prisma.workflowInstanciaSetor.update.mockResolvedValueOnce({
        ...etapaOrdem0Item,
        status: 'CONCLUIDA',
      } as any);
      prisma.itemOS.findUnique.mockResolvedValueOnce({
        id: 'item-ordem0',
        os_id: 'os-1',
        os: { id: 'os-1' },
      } as any);
      prisma.apontamento.create.mockResolvedValueOnce({
        id: 'apontamento-1',
      } as any);
      prisma.workflowInstanciaSetor.updateMany.mockResolvedValueOnce({
        count: 2,
      } as any);
      prisma.workflowInstancia.update.mockResolvedValueOnce({
        id: 'instancia-1',
      } as any);

      await service.concluirEtapa('loja-1', 'item-ordem0', 'operador-1');

      // Deve atualizar apenas itens AGUARDANDO na ordem 1 para PENDENTE
      expect(prisma.workflowInstanciaSetor.updateMany).toHaveBeenCalledWith({
        where: {
          workflow_instancia_id: 'instancia-1',
          ordem: 1,
          status: 'AGUARDANDO',
        },
        data: {
          status: 'PENDENTE',
          atualizado_em: expect.any(Date),
        },
      });
    });
  });
});
