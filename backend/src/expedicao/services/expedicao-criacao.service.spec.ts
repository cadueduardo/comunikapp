import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ModalidadeExpedicao } from '../enums/modalidade-expedicao.enum';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ExpedicaoModalidadeMapper } from './expedicao-modalidade.mapper';
import { ExpedicaoCriacaoService } from './expedicao-criacao.service';
import { HomeCacheService } from '../../home-operacional/services/home-cache.service';

describe('ExpedicaoCriacaoService', () => {
  let service: ExpedicaoCriacaoService;
  let prisma: {
    ordemServico: { findFirst: jest.Mock };
    orcamento: { findFirst: jest.Mock };
    expedicaoLogistica: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let tx: {
    expedicaoLogistica: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    tx = {
      expedicaoLogistica: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    prisma = {
      ordemServico: { findFirst: jest.fn() },
      orcamento: { findFirst: jest.fn() },
      expedicaoLogistica: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) =>
        fn(tx),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpedicaoCriacaoService,
        ExpedicaoModalidadeMapper,
        { provide: PrismaService, useValue: prisma },
        {
          provide: HomeCacheService,
          useValue: { invalidarPorPrefixo: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ExpedicaoCriacaoService);
  });

  it('não cria expedição para OS interna', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      loja_id: 'loja-1',
      tipo_os: 'INTERNA',
      orcamento_id: null,
    });

    const resultado = await service.criarSeElegivel('os-1', 'loja-1');

    expect(resultado).toEqual({ criado: false, motivo_skip: 'OS_INTERNA' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('retorna idempotente quando já existe expedição ativa não devolvida', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      loja_id: 'loja-1',
      tipo_os: 'COMERCIAL',
      orcamento_id: null,
    });
    tx.expedicaoLogistica.findFirst.mockResolvedValueOnce({
      id: 'exp-existente',
    });

    const resultado = await service.criarSeElegivel('os-1', 'loja-1');

    expect(resultado).toEqual({
      criado: false,
      expedicao_id: 'exp-existente',
      motivo_skip: 'JA_EXISTE',
    });
    expect(tx.expedicaoLogistica.create).not.toHaveBeenCalled();
    expect(tx.expedicaoLogistica.update).not.toHaveBeenCalled();
  });

  it('reativa expedição ARQUIVADA ao reconcluir OS no PCP', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      loja_id: 'loja-1',
      tipo_os: 'COMERCIAL',
      orcamento_id: null,
    });
    tx.expedicaoLogistica.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'exp-arquivada' });
    tx.expedicaoLogistica.update.mockResolvedValue({ id: 'exp-arquivada' });

    const resultado = await service.criarSeElegivel('os-1', 'loja-1');

    expect(resultado).toEqual({
      criado: true,
      reativado: true,
      expedicao_id: 'exp-arquivada',
    });
    expect(tx.expedicaoLogistica.update).toHaveBeenCalledWith({
      where: { id: 'exp-arquivada' },
      data: {
        status: StatusExpedicao.AGUARDANDO_SEPARACAO,
        atualizado_em: expect.any(Date),
      },
    });
    expect(tx.expedicaoLogistica.create).not.toHaveBeenCalled();
  });

  it('cria nova expedição após registro DEVOLVIDA (retrabalho)', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      loja_id: 'loja-1',
      tipo_os: 'COMERCIAL',
      orcamento_id: 'orc-1',
    });
    prisma.orcamento.findFirst.mockResolvedValue({
      entrega_modalidade: { nome: 'Transportadora' },
      produtos: [{ instalacao_necessaria: false }],
    });
    tx.expedicaoLogistica.findFirst.mockResolvedValue(null);
    tx.expedicaoLogistica.create.mockResolvedValue({ id: 'exp-nova' });

    const resultado = await service.criarSeElegivel('os-1', 'loja-1');

    expect(resultado).toEqual({ criado: true, expedicao_id: 'exp-nova' });
    expect(tx.expedicaoLogistica.create).toHaveBeenCalledWith({
      data: {
        loja_id: 'loja-1',
        os_id: 'os-1',
        modalidade: ModalidadeExpedicao.ENTREGA_TRANSPORTADORA,
        status: StatusExpedicao.AGUARDANDO_SEPARACAO,
      },
      select: { id: true },
    });
  });

  it('aplica override INSTALACAO_NO_LOCAL quando produto exige instalação', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-2',
      loja_id: 'loja-1',
      tipo_os: 'COMERCIAL',
      orcamento_id: 'orc-2',
    });
    prisma.orcamento.findFirst.mockResolvedValue({
      entrega_modalidade: { nome: 'Retirada no balcão' },
      produtos: [{ instalacao_necessaria: true }],
    });
    tx.expedicaoLogistica.findFirst.mockResolvedValue(null);
    tx.expedicaoLogistica.create.mockResolvedValue({ id: 'exp-inst' });

    await service.criarSeElegivel('os-2', 'loja-1');

    expect(tx.expedicaoLogistica.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modalidade: ModalidadeExpedicao.INSTALACAO_NO_LOCAL,
        }),
      }),
    );
  });

  it('arquiva expedição em AGUARDANDO_SEPARACAO ao reverter conclusão no PCP', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({ id: 'exp-1' });
    prisma.expedicaoLogistica.update.mockResolvedValue({ id: 'exp-1' });

    const resultado = await service.cancelarPorReversaoConclusaoPcp(
      'os-1',
      'loja-1',
    );

    expect(resultado).toEqual({ cancelada: true, expedicao_id: 'exp-1' });
    expect(prisma.expedicaoLogistica.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: {
        status: StatusExpedicao.ARQUIVADO,
        atualizado_em: expect.any(Date),
      },
    });
  });
});
