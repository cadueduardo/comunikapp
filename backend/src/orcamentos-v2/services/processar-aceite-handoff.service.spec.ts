import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProcessarAceiteHandoffService } from './processar-aceite-handoff.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransicaoComercialService } from './transicao-comercial.service';
import { CobrancasService } from '../../financeiro/services/cobrancas.service';
import { OSService } from '../../os/services/os.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';
import { EVENTOS_COMERCIAIS } from '../domain/eventos-comerciais';

describe('ProcessarAceiteHandoffService (Fase 8)', () => {
  let service: ProcessarAceiteHandoffService;
  let prismaMock: {
    orcamento: {
      findFirst: jest.Mock;
    };
  };
  let transicaoMock: {
    executar: jest.Mock;
  };
  let cobrancasMock: {
    criarCobrancaParaOrcamento: jest.Mock;
  };
  let osMock: {
    criarOSApartirOrcamento: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      orcamento: {
        findFirst: jest.fn(),
      },
    };

    transicaoMock = {
      executar: jest.fn().mockResolvedValue(true),
    };

    cobrancasMock = {
      criarCobrancaParaOrcamento: jest.fn().mockResolvedValue({ id: 'cob-100' }),
    };

    osMock = {
      criarOSApartirOrcamento: jest.fn().mockResolvedValue({ id: 'os-200' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessarAceiteHandoffService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TransicaoComercialService, useValue: transicaoMock },
        { provide: CobrancasService, useValue: cobrancasMock },
        { provide: OSService, useValue: osMock },
      ],
    }).compile();

    service = module.get<ProcessarAceiteHandoffService>(ProcessarAceiteHandoffService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. registra aceite com evidências auditáveis e aciona handoffs transacionais', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-10',
      loja_id: 'loja-A',
      ativo: true,
      status_comercial: OrcamentoStatusComercial.ENVIADA,
      expira_em: new Date(Date.now() + 86400000), // expira em 24h
    });

    const res = await service.processarAceiteComercial('orc-10', 'loja-A', {
      clienteNome: 'Carlos Eduardo',
      clienteEmail: 'carlos@empresa.com.br',
      cpfCnpj: '123.456.789-00',
      autorId: 'user-client-1',
      contexto: {
        ip: '200.150.10.5',
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      },
    });

    expect(res.success).toBe(true);
    expect(res.jaProcessado).toBe(false);
    expect(res.statusComercial).toBe(OrcamentoStatusComercial.PEDIDO_CONFIRMADO);
    expect(transicaoMock.executar).toHaveBeenCalledWith({
      orcamentoId: 'orc-10',
      lojaId: 'loja-A',
      origemStatus: OrcamentoStatusComercial.ENVIADA,
      destinoStatus: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
      origemAcao: 'INTERNO',
      autor: 'user-client-1',
      tipoAuditoria: 'aceite_e_pedido_confirmado',
      descricao: expect.stringContaining('Carlos Eduardo'),
      evento: EVENTOS_COMERCIAIS.PEDIDO_CONFIRMADO,
      contexto: {
        ip: '200.150.10.5',
        userAgent: 'Mozilla/5.0 Chrome/120.0',
      },
      payloadAdicional: expect.objectContaining({
        cliente_nome: 'Carlos Eduardo',
        cliente_email: 'carlos@empresa.com.br',
      }),
    });
  });

  it('2. nega aceite em proposta expirada com mensagem clara', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-expirado',
      loja_id: 'loja-A',
      ativo: true,
      status_comercial: OrcamentoStatusComercial.ENVIADA,
      expira_em: new Date(Date.now() - 3600000), // expirou há 1 hora
    });

    await expect(
      service.processarAceiteComercial('orc-expirado', 'loja-A', {
        clienteNome: 'Carlos',
        clienteEmail: 'carlos@empresa.com.br',
        autorId: 'user-1',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(transicaoMock.executar).not.toHaveBeenCalled();
  });

  it('3. requisições duplicadas retornam resultado idempotente sem duplicar efeitos', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-ja-aceito',
      loja_id: 'loja-A',
      ativo: true,
      status_comercial: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
    });

    const res = await service.processarAceiteComercial('orc-ja-aceito', 'loja-A', {
      clienteNome: 'Carlos',
      clienteEmail: 'carlos@empresa.com.br',
      autorId: 'user-1',
    });

    expect(res.success).toBe(true);
    expect(res.jaProcessado).toBe(true);
    expect(transicaoMock.executar).not.toHaveBeenCalled();
  });

  it('4. impede acesso ou aceite a orçamento pertencente a outro tenant (IDOR)', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue(null);

    await expect(
      service.processarAceiteComercial('orc-outro-tenant', 'loja-A', {
        clienteNome: 'Carlos',
        clienteEmail: 'carlos@empresa.com.br',
        autorId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
