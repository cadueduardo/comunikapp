import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ModalidadeExpedicao } from '../enums/modalidade-expedicao.enum';
import { ExpedicaoKanbanService } from './expedicao-kanban.service';
import { ExpedicaoFinanceiroService } from './expedicao-financeiro.service';

describe('ExpedicaoKanbanService', () => {
  let service: ExpedicaoKanbanService;
  let prisma: { expedicaoLogistica: { findMany: jest.Mock } };

  const expedicaoMock = {
    id: 'exp-1',
    os_id: 'os-1',
    status: StatusExpedicao.AGUARDANDO_SEPARACAO,
    modalidade: ModalidadeExpedicao.RETIRADA_CLIENTE,
    codigo_rastreio: 'BR123',
    data_expedida: null,
    criado_em: new Date('2026-06-25T10:00:00.000Z'),
    atualizado_em: new Date('2026-06-25T12:00:00.000Z'),
    ordem_servico: {
      id: 'os-1',
      numero: 'OS-100',
      nome_servico: 'Banner 3x1',
      data_prazo: new Date('2026-06-30T00:00:00.000Z'),
      orcamento_id: 'orc-1',
      retrabalho: false,
      cliente: {
        nome: 'Cliente Teste',
        telefone: '11999999999',
        whatsapp: null,
        endereco: 'Rua A',
        numero: '10',
        complemento: null,
        bairro: 'Centro',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01000-000',
      },
      orcamento: {
        entrega_usar_endereco_cliente: true,
        entrega_logradouro: null,
        entrega_numero: null,
        entrega_complemento: null,
        entrega_bairro: null,
        entrega_cidade: null,
        entrega_estado: null,
        entrega_cep: null,
      },
    },
  };

  beforeEach(async () => {
    prisma = {
      expedicaoLogistica: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpedicaoKanbanService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ExpedicaoFinanceiroService,
          useValue: {
            verificarBloqueioEntrega: jest
              .fn()
              .mockResolvedValue({ bloqueado: false }),
          },
        },
      ],
    }).compile();

    service = module.get(ExpedicaoKanbanService);
  });

  it('lista kanban ativo excluindo DEVOLVIDA e agrupa por coluna', async () => {
    prisma.expedicaoLogistica.findMany.mockResolvedValue([expedicaoMock]);

    const resultado = await service.listarKanbanAtivo('loja-1');

    expect(prisma.expedicaoLogistica.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          loja_id: 'loja-1',
          status: {
            in: expect.arrayContaining([
              StatusExpedicao.AGUARDANDO_SEPARACAO,
              StatusExpedicao.ENTREGUE_FINALIZADO,
            ]),
          },
        }),
      }),
    );
    expect(resultado.cards).toHaveLength(1);
    expect(resultado.cards[0].cliente).toBe('Cliente Teste');
    expect(
      resultado.colunas[StatusExpedicao.AGUARDANDO_SEPARACAO],
    ).toHaveLength(1);
    expect(resultado.stats.total).toBe(1);
  });

  it('lista arquivo com ARQUIVADO e DEVOLVIDA', async () => {
    prisma.expedicaoLogistica.findMany.mockResolvedValue([]);

    await service.listarArquivo('loja-1');

    expect(prisma.expedicaoLogistica.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: {
            in: [StatusExpedicao.ARQUIVADO, StatusExpedicao.DEVOLVIDA],
          },
        }),
      }),
    );
  });

  it('aplica filtro de busca por número da OS', async () => {
    prisma.expedicaoLogistica.findMany.mockResolvedValue([]);

    await service.listarKanbanAtivo('loja-1', { busca: 'OS-100' });

    expect(prisma.expedicaoLogistica.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              ordem_servico: { numero: { contains: 'OS-100' } },
            }),
          ]),
        }),
      }),
    );
  });
});
