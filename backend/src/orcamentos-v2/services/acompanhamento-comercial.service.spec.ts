import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AcompanhamentoComercialService } from './acompanhamento-comercial.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';

describe('AcompanhamentoComercialService (Fase 10)', () => {
  let service: AcompanhamentoComercialService;
  let prismaMock: {
    orcamento: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    ordemServico: {
      findMany: jest.Mock;
    };
  };
  let permissionsMock: {
    assertPode: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      orcamento: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      ordemServico: {
        findMany: jest.fn(),
      },
    };

    permissionsMock = {
      assertPode: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcompanhamentoComercialService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: VendasPermissionsService, useValue: permissionsMock },
      ],
    }).compile();

    service = module.get<AcompanhamentoComercialService>(AcompanhamentoComercialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. lista pedidos comerciais confirmados com projeção consolidada de status', async () => {
    prismaMock.orcamento.findMany.mockResolvedValue([
      {
        id: 'orc-ped-1',
        numero: 'ORC-1001',
        nome_servico: 'Fachada Iluminada ACM',
        preco_final: 2500,
        criado_em: new Date(),
        atualizado_em: new Date(),
        status_comercial: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
        cliente: { id: 'cli-1', nome: 'Loja Exemplo' },
        cobranca: { id: 'cob-1', status: 'LIQUIDADA', valor_total: 2500, valor_recebido: 2500 },
      },
    ]);

    prismaMock.ordemServico.findMany.mockResolvedValue([
      { id: 'os-1', numero: 'OS-1001', status: 'EM_PRODUCAO', tipo_vinculo_os: 'PRINCIPAL' },
    ]);

    const res = await service.listarPedidosComerciais('loja-A', 'vendedor-1');

    expect(res).toHaveLength(1);
    expect(res[0].numero).toBe('ORC-1001');
    expect(res[0].cliente_nome).toBe('Loja Exemplo');
    expect(res[0].status_financeiro).toBe('LIQUIDADO');
    expect(res[0].status_operacao).toBe('EM_PRODUCAO');
    expect(permissionsMock.assertPode).toHaveBeenCalled();
  });

  it('2. gera timeline comercial sequencial do pedido', async () => {
    const dataCriacao = new Date('2026-08-01T10:00:00Z');
    const dataAtualizacao = new Date('2026-08-02T14:00:00Z');

    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-ped-2',
      numero: 'ORC-1002',
      nome_servico: 'Letra Caixa',
      criado_em: dataCriacao,
      atualizado_em: dataAtualizacao,
      usuario_id: 'vendedor-1',
    });

    const timeline = await service.obterTimelinePedidoComercial('orc-ped-2', 'loja-A', 'vendedor-1');

    expect(timeline.length).toBeGreaterThanOrEqual(2);
    expect(timeline[0].titulo).toContain('Proposta Comercial Criada');
    expect(timeline[1].titulo).toContain('Pedido Confirmado');
  });

  it('3. nega acesso a timeline de pedido inexistente ou de outro tenant', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue(null);

    await expect(
      service.obterTimelinePedidoComercial('orc-invalido', 'loja-A', 'vendedor-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
