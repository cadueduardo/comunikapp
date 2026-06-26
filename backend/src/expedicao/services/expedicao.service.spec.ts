import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { BLOQUEIO_FINANCEIRO_CODE } from '../constants/bloqueio-financeiro.code';
import { StatusExpedicao } from '../enums/status-expedicao.enum';
import { ModalidadeExpedicao } from '../enums/modalidade-expedicao.enum';
import { ExpedicaoFinanceiroService } from './expedicao-financeiro.service';
import { ExpedicaoNotificacaoService } from './expedicao-notificacao.service';
import { ExpedicaoService } from './expedicao.service';

describe('ExpedicaoService', () => {
  let service: ExpedicaoService;
  let prisma: {
    expedicaoLogistica: {
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    ordemServico: { update: jest.Mock };
    $transaction: jest.Mock;
  };
  let financeiro: {
    verificarBloqueioEntrega: jest.Mock;
    assertEntregaLiberada: jest.Mock;
    assertMovimentoKanbanLiberado: jest.Mock;
  };
  let notificacao: { emitirAtualizada: jest.Mock };
  let tx: Record<string, any>;

  const expedicaoDetalheMock = {
    id: 'exp-1',
    loja_id: 'loja-1',
    os_id: 'os-1',
    status: StatusExpedicao.AGUARDANDO_SEPARACAO,
    modalidade: ModalidadeExpedicao.RETIRADA_CLIENTE,
    codigo_rastreio: null,
    data_expedida: null,
    data_conclusao: null,
    recebedor_nome: null,
    recebedor_doc: null,
    url_assinatura: null,
    observacoes: null,
    criado_em: new Date('2026-06-25T10:00:00.000Z'),
    atualizado_em: new Date('2026-06-25T12:00:00.000Z'),
    ordem_servico: {
      id: 'os-1',
      numero: 'OS-100',
      nome_servico: 'Banner',
      status: 'FINALIZADA',
      data_prazo: null,
      data_entrega_cliente: null,
      orcamento_id: 'orc-1',
      retrabalho: false,
      cliente: {
        id: 'cli-1',
        nome: 'Cliente',
        telefone: null,
        whatsapp: null,
        email: null,
        endereco: 'Rua A',
        numero: '1',
        complemento: null,
        bairro: null,
        cidade: 'SP',
        estado: 'SP',
        cep: null,
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
    tx = {
      expedicaoLogistica: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      ordemServico: { update: jest.fn() },
      ordemServicoLog: { create: jest.fn() },
    };

    prisma = {
      expedicaoLogistica: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      ordemServico: { update: jest.fn() },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };

    financeiro = {
      verificarBloqueioEntrega: jest.fn().mockResolvedValue({ bloqueado: false }),
      assertEntregaLiberada: jest.fn().mockResolvedValue(undefined),
      assertMovimentoKanbanLiberado: jest.fn().mockResolvedValue(undefined),
    };

    notificacao = { emitirAtualizada: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpedicaoService,
        { provide: PrismaService, useValue: prisma },
        { provide: ExpedicaoFinanceiroService, useValue: financeiro },
        { provide: ExpedicaoNotificacaoService, useValue: notificacao },
      ],
    }).compile();

    service = module.get(ExpedicaoService);
  });

  it('obtém detalhe com bloqueio financeiro', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue(expedicaoDetalheMock);

    const detalhe = await service.obterDetalhe('exp-1', 'loja-1');

    expect(detalhe.id).toBe('exp-1');
    expect(detalhe.ordem_servico.cliente.nome).toBe('Cliente');
    expect(financeiro.verificarBloqueioEntrega).toHaveBeenCalledWith(
      'os-1',
      'loja-1',
    );
  });

  it('bloqueia atualização de expedição entregue', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      ...expedicaoDetalheMock,
      status: StatusExpedicao.ENTREGUE_FINALIZADO,
    });

    await expect(
      service.atualizarExpedicao('exp-1', 'loja-1', {
        codigo_rastreio: 'BR999',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('atualiza apenas campos preenchidos do DTO', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue(expedicaoDetalheMock);
    prisma.expedicaoLogistica.update.mockResolvedValue({
      ...expedicaoDetalheMock,
      codigo_rastreio: 'BR123',
    });

    await service.atualizarExpedicao('exp-1', 'loja-1', {
      codigo_rastreio: 'BR123',
      observacoes: '   ',
    });

    expect(prisma.expedicaoLogistica.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: expect.objectContaining({
        codigo_rastreio: 'BR123',
      }),
      include: expect.any(Object),
    });
    expect(prisma.expedicaoLogistica.update.mock.calls[0][0].data).not.toHaveProperty(
      'observacoes',
    );
  });

  it('atualiza status no kanban e define data_expedida na primeira saída', async () => {
    tx.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.AGUARDANDO_SEPARACAO,
      data_expedida: null,
    });

    const resultado = await service.atualizarStatus(
      'exp-1',
      'loja-1',
      StatusExpedicao.PRONTO_PARA_RETIRADA,
    );

    expect(tx.expedicaoLogistica.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: expect.objectContaining({
        status: StatusExpedicao.PRONTO_PARA_RETIRADA,
        data_expedida: expect.any(Date),
      }),
    });
    expect(notificacao.emitirAtualizada).toHaveBeenCalledWith('loja-1', {
      expedicao_id: 'exp-1',
      os_id: 'os-1',
      status_anterior: StatusExpedicao.AGUARDANDO_SEPARACAO,
      status_novo: StatusExpedicao.PRONTO_PARA_RETIRADA,
    });
    expect(resultado.status_novo).toBe(StatusExpedicao.PRONTO_PARA_RETIRADA);
    expect(financeiro.assertMovimentoKanbanLiberado).toHaveBeenCalledWith(
      'os-1',
      'loja-1',
    );
  });

  it('bloqueia mudança de status no kanban com pendência financeira', async () => {
    tx.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.AGUARDANDO_SEPARACAO,
      data_expedida: null,
    });
    financeiro.assertMovimentoKanbanLiberado.mockRejectedValueOnce(
      new ConflictException({
        code: BLOQUEIO_FINANCEIRO_CODE,
        message: 'Parcelas em aberto',
      }),
    );

    await expect(
      service.atualizarStatus(
        'exp-1',
        'loja-1',
        StatusExpedicao.PRONTO_PARA_RETIRADA,
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.expedicaoLogistica.update).not.toHaveBeenCalled();
  });

  it('rejeita patch de status para ENTREGUE_FINALIZADO', async () => {
    await expect(
      service.atualizarStatus(
        'exp-1',
        'loja-1',
        StatusExpedicao.ENTREGUE_FINALIZADO,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('conclui entrega em transação quando financeiro libera', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
    });
    tx.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
      data_expedida: new Date(),
    });

    const resultado = await service.concluirEntrega('exp-1', 'loja-1', {
      recebedor_nome: 'João',
      url_assinatura: 'https://cdn/assinatura.png',
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(tx.expedicaoLogistica.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: expect.objectContaining({
        status: StatusExpedicao.ENTREGUE_FINALIZADO,
        recebedor_nome: 'João',
      }),
    });
    expect(tx.ordemServico.update).toHaveBeenCalled();
    expect(notificacao.emitirAtualizada).toHaveBeenCalled();
    expect(resultado.status).toBe(StatusExpedicao.ENTREGUE_FINALIZADO);
  });

  it('permite admin concluir sem assinatura e registra log', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
    });
    tx.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
      data_expedida: new Date(),
    });

    await service.concluirEntrega(
      'exp-1',
      'loja-1',
      { recebedor_nome: 'João' },
      {
        id: 'user-admin',
        funcao: 'ADMINISTRADOR',
        email: 'admin@test.com',
      } as any,
    );

    expect(tx.expedicaoLogistica.update).toHaveBeenCalledWith({
      where: { id: 'exp-1' },
      data: expect.objectContaining({
        url_assinatura: null,
      }),
    });
    expect(tx.ordemServicoLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        os_id: 'os-1',
        tipo_acao: 'EXPEDICAO_CONCLUSAO_SEM_ASSINATURA',
      }),
    });
  });

  it('exige assinatura para perfil não administrador', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
    });

    await expect(
      service.concluirEntrega(
        'exp-1',
        'loja-1',
        { recebedor_nome: 'João' },
        {
          id: 'user-prod',
          funcao: 'PRODUCAO',
          email: 'prod@test.com',
        } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('bloqueia conclusão com trava financeira', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.PRONTO_PARA_RETIRADA,
    });
    financeiro.assertEntregaLiberada.mockRejectedValue(
      new ConflictException({
        code: BLOQUEIO_FINANCEIRO_CODE,
        message: 'Bloqueado',
        parcelas: [],
        link_financeiro:
          '/financeiro/recebimentos?cobranca=cob-1&os=os-1&ref=OS-2026-012',
      }),
    );

    await expect(
      service.concluirEntrega('exp-1', 'loja-1', {
        recebedor_nome: 'João',
        url_assinatura: 'https://cdn/assinatura.png',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('arquiva somente expedição entregue', async () => {
    tx.expedicaoLogistica.findFirst.mockResolvedValue({
      id: 'exp-1',
      os_id: 'os-1',
      status: StatusExpedicao.ENTREGUE_FINALIZADO,
    });

    const resultado = await service.arquivar('exp-1', 'loja-1', {});

    expect(resultado.status_novo).toBe(StatusExpedicao.ARQUIVADO);
    expect(notificacao.emitirAtualizada).toHaveBeenCalled();
  });

  it('lança NotFound ao buscar detalhe inexistente', async () => {
    prisma.expedicaoLogistica.findFirst.mockResolvedValue(null);

    await expect(service.obterDetalhe('exp-x', 'loja-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
