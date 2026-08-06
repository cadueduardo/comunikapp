import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChatV2Service } from './chat-v2.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { TransicaoComercialService } from './transicao-comercial.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';
import { TipoMensagem } from '../interfaces/orcamento.interface';

describe('ChatV2Service (Incremento 6.5)', () => {
  let service: ChatV2Service;
  let prismaMock: {
    orcamento: { findFirst: jest.Mock };
    mensagemChat: {
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let permissionsMock: { assertPode: jest.Mock };
  let transicaoMock: { executar: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      orcamento: {
        findFirst: jest.fn(),
      },
      mensagemChat: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    permissionsMock = {
      assertPode: jest.fn().mockResolvedValue(true),
    };

    transicaoMock = {
      executar: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatV2Service,
        { provide: PrismaService, useValue: prismaMock },
        { provide: VendasPermissionsService, useValue: permissionsMock },
        { provide: TransicaoComercialService, useValue: transicaoMock },
      ],
    }).compile();

    service = module.get<ChatV2Service>(ChatV2Service);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. nega acesso a mensagem de orçamento pertencente a outro tenant (IDOR)', async () => {
    // Tenta acessar orcamento de outra loja (retorna null no findFirst)
    prismaMock.orcamento.findFirst.mockResolvedValue(null);

    await expect(
      service.enviarMensagem('orc-outra-loja', 'user-1', 'loja-A', 'Olá'),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.orcamento.findFirst).toHaveBeenCalledWith({
      where: { id: 'orc-outra-loja', loja_id: 'loja-A' },
    });
  });

  it('2. primeira mensagem promove proposta enviada -> em_negociacao via writer único', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      loja_id: 'loja-A',
      ativo: true,
      status_comercial: OrcamentoStatusComercial.ENVIADA,
    });

    prismaMock.mensagemChat.create.mockResolvedValue({
      id: 'msg-1',
      orcamento_id: 'orc-1',
      usuario_id: 'user-1',
      tipo: TipoMensagem.TEXTO,
      conteudo: 'Desejo negociar um desconto',
      data_envio: new Date(),
      lida: false,
    });

    await service.enviarMensagem('orc-1', 'user-1', 'loja-A', 'Desejo negociar um desconto');

    expect(transicaoMock.executar).toHaveBeenCalledWith({
      orcamentoId: 'orc-1',
      lojaId: 'loja-A',
      origemStatus: OrcamentoStatusComercial.ENVIADA,
      destinoStatus: OrcamentoStatusComercial.EM_NEGOCIACAO,
      origemAcao: 'PUBLICO',
      autor: 'user-1',
      tipoAuditoria: 'entrada_em_negociacao',
      descricao: expect.any(String),
      evento: 'vendas.proposta.negociacao',
    });
  });

  it('3. mensagens subsequentes em propostas já em_negociacao não re-executam promoção', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      loja_id: 'loja-A',
      ativo: true,
      status_comercial: OrcamentoStatusComercial.EM_NEGOCIACAO,
    });

    prismaMock.mensagemChat.create.mockResolvedValue({
      id: 'msg-2',
      orcamento_id: 'orc-1',
      usuario_id: 'user-1',
      tipo: TipoMensagem.TEXTO,
      conteudo: 'Segunda mensagem',
      data_envio: new Date(),
      lida: false,
    });

    await service.enviarMensagem('orc-1', 'user-1', 'loja-A', 'Segunda mensagem');

    expect(transicaoMock.executar).not.toHaveBeenCalled();
  });

  it('4. leitura e marcação de não lidas filtram estritamente por loja_id', async () => {
    await service.marcarMensagensComoLidas('orc-1', 'user-1', 'loja-A');

    expect(prismaMock.mensagemChat.updateMany).toHaveBeenCalledWith({
      where: {
        orcamento_id: 'orc-1',
        orcamento: { loja_id: 'loja-A' },
        usuario_id: { not: 'user-1' },
        lida: false,
      },
      data: { lida: true },
    });
  });

  it('5. rejeita envio de arquivo se exceder 10MB ou se tiver tipo/extensão não permitida', async () => {
    // Arquivo maior que 10MB
    await expect(
      service.enviarArquivo(
        'orc-1',
        'user-1',
        'loja-A',
        'gigante.pdf',
        'https://storage/gigante.pdf',
        11 * 1024 * 1024,
        'application/pdf',
      ),
    ).rejects.toThrow(BadRequestException);

    // Tipo proibido (ex: .exe / application/x-msdownload)
    await expect(
      service.enviarArquivo(
        'orc-1',
        'user-1',
        'loja-A',
        'script.exe',
        'https://storage/script.exe',
        1024,
        'application/x-msdownload',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('6. aceita upload de anexo válido dentro do limite de 10MB e mime allowlist', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      loja_id: 'loja-A',
      ativo: true,
    });

    prismaMock.mensagemChat.create.mockResolvedValue({
      id: 'msg-anexo-1',
      orcamento_id: 'orc-1',
      usuario_id: 'user-1',
      tipo: TipoMensagem.ARQUIVO,
      conteudo: 'Arquivo enviado: desenho_planta.pdf',
      data_envio: new Date(),
      lida: false,
    });

    const res = await service.enviarArquivo(
      'orc-1',
      'user-1',
      'loja-A',
      'desenho_planta.pdf',
      'https://storage/desenho_planta.pdf',
      2 * 1024 * 1024, // 2MB
      'application/pdf',
    );

    expect(res).toBeDefined();
    expect(prismaMock.mensagemChat.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: TipoMensagem.ARQUIVO,
          orcamento_id: 'orc-1',
        }),
      }),
    );
  });
});
