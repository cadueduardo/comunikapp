import { BadRequestException } from '@nestjs/common';
import { EstoqueApontamentoService } from '../estoque-apontamento.service';
import { TipoApontamento } from '../../interfaces/workflow-pcp.interfaces';

describe('EstoqueApontamentoService', () => {
  const prisma = {
    ordemServico: {
      findUnique: jest.fn(),
    },
    insumo: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    ordemServicoLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $queryRawUnsafe: jest.fn(),
    $executeRawUnsafe: jest.fn(),
  };

  const movimentacoesService = {
    criarMovimentacao: jest.fn(),
  };

  let service: EstoqueApontamentoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EstoqueApontamentoService(
      prisma as any,
      movimentacoesService as any,
    );
  });

  it('BAIXA decrementa Insumo.estoque_atual e registra SAIDA', async () => {
    prisma.ordemServico.findUnique.mockResolvedValue({
      id: 'os-1',
      loja_id: 'loja-1',
      itens: [
        {
          id: 'item-1',
          insumos_necessarios: JSON.stringify([
            {
              insumo_id: 'ins-1',
              quantidade_necessaria: 5,
              unidade: 'm',
            },
          ]),
        },
      ],
    });
    prisma.insumo.findUnique.mockResolvedValue({
      nome: 'Lona',
      controla_estoque: true,
    });
    prisma.insumo.findFirst
      .mockResolvedValueOnce({
        estoque_atual: 20,
        estoque_minimo: 1,
        controla_estoque: true,
        nome: 'Lona',
      })
      .mockResolvedValueOnce({
        estoque_atual: 20,
        controla_estoque: true,
      });
    prisma.ordemServicoLog.findMany.mockResolvedValue([]);
    prisma.insumo.update.mockResolvedValue({});
    prisma.$queryRawUnsafe.mockResolvedValue([
      { id: 'est-1', quantidadeAtual: 20, quantidadeReservada: 0 },
    ]);
    movimentacoesService.criarMovimentacao.mockResolvedValue({ id: 'mov-1' });

    const resultado = await service.processarOperacaoEstoque(
      'os-1',
      TipoApontamento.CONCLUSAO,
      undefined,
      undefined,
      undefined,
      'user-1',
    );

    expect(resultado.sucesso).toBe(true);
    expect(prisma.insumo.update).toHaveBeenCalledWith({
      where: { id: 'ins-1' },
      data: { estoque_atual: 15 },
    });
    expect(movimentacoesService.criarMovimentacao).toHaveBeenCalledWith(
      { lojaId: 'loja-1', usuarioId: 'user-1' },
      expect.objectContaining({
        estoqueId: 'est-1',
        tipo: 'SAIDA',
        quantidade: 5,
        documentoRef: 'os-1',
      }),
    );
  });

  it('BAIXA com estoque insuficiente retorna erro', async () => {
    prisma.ordemServico.findUnique.mockResolvedValue({
      id: 'os-1',
      loja_id: 'loja-1',
      itens: [
        {
          id: 'item-1',
          insumos_necessarios: JSON.stringify([
            { insumo_id: 'ins-1', quantidade_necessaria: 50, unidade: 'm' },
          ]),
        },
      ],
    });
    prisma.insumo.findUnique.mockResolvedValue({
      nome: 'Lona',
      controla_estoque: true,
    });
    prisma.insumo.findFirst.mockResolvedValue({
      estoque_atual: 10,
      estoque_minimo: 0,
      controla_estoque: true,
      nome: 'Lona',
    });

    const resultado = await service.processarOperacaoEstoque(
      'os-1',
      TipoApontamento.CONCLUSAO,
    );

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erros.length).toBeGreaterThan(0);
    expect(prisma.insumo.update).not.toHaveBeenCalled();
  });

  it('RESERVA grava log ESTOQUE_RESERVA', async () => {
    prisma.ordemServico.findUnique.mockResolvedValue({
      id: 'os-1',
      loja_id: 'loja-1',
      itens: [
        {
          id: 'item-1',
          insumos_necessarios: JSON.stringify([
            { insumo_id: 'ins-1', quantidade_necessaria: 3, unidade: 'un' },
          ]),
        },
      ],
    });
    prisma.insumo.findUnique.mockResolvedValue({
      nome: 'Parafuso',
      controla_estoque: true,
    });
    prisma.insumo.findFirst.mockResolvedValue({
      estoque_atual: 100,
      estoque_minimo: 0,
      controla_estoque: true,
      nome: 'Parafuso',
    });
    prisma.$queryRawUnsafe.mockResolvedValue([
      { id: 'est-2', quantidadeAtual: 100, quantidadeReservada: 0 },
    ]);
    prisma.$executeRawUnsafe.mockResolvedValue(1);
    prisma.ordemServicoLog.create.mockResolvedValue({ id: 'log-1' });

    const resultado = await service.processarOperacaoEstoque(
      'os-1',
      TipoApontamento.INICIO,
    );

    expect(resultado.sucesso).toBe(true);
    expect(prisma.ordemServicoLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo_acao: 'ESTOQUE_RESERVA',
          os_id: 'os-1',
        }),
      }),
    );
  });

  it('OS inexistente lança BadRequestException', async () => {
    prisma.ordemServico.findUnique.mockResolvedValue(null);
    await expect(
      service.processarOperacaoEstoque('os-x', TipoApontamento.CONCLUSAO),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
