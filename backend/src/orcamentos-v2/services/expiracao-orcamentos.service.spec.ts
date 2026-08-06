import { Test, TestingModule } from '@nestjs/testing';
import { ExpiracaoOrcamentosService } from './expiracao-orcamentos.service';
import { TransicaoComercialService } from './transicao-comercial.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';

describe('ExpiracaoOrcamentosService (Incremento 6.3)', () => {
  let service: ExpiracaoOrcamentosService;
  let prismaMock: { orcamento: { findMany: jest.Mock } };
  let transicaoMock: { executar: jest.Mock };

  beforeEach(async () => {
    prismaMock = {
      orcamento: {
        findMany: jest.fn(),
      },
    };

    transicaoMock = {
      executar: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpiracaoOrcamentosService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: TransicaoComercialService, useValue: transicaoMock },
      ],
    }).compile();

    service = module.get<ExpiracaoOrcamentosService>(ExpiracaoOrcamentosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. ignora propostas sem expira_em ou ativas não vencidas', async () => {
    // Como a query prisma já filtra `expira_em: { lte: agoraUtc }`,
    // o banco retorna array vazio quando só existem propostas sem expira_em ou futuras.
    prismaMock.orcamento.findMany.mockResolvedValue([]);

    const res = await service.processarPropostasExpiradas();

    expect(res.processados).toBe(0);
    expect(res.expirados).toBe(0);
    expect(transicaoMock.executar).not.toHaveBeenCalled();
  });

  it('2. ignora proposta futura (não incluída na busca por lte)', async () => {
    prismaMock.orcamento.findMany.mockResolvedValue([]);

    const res = await service.processarPropostasExpiradas();

    expect(res.processados).toBe(0);
    expect(transicaoMock.executar).not.toHaveBeenCalled();
  });

  it('3. expira propostas enviada e em_negociacao vencidas', async () => {
    const agora = new Date();
    const dataPassada = new Date(agora.getTime() - 86400000); // 1 dia atras

    prismaMock.orcamento.findMany.mockResolvedValue([
      {
        id: 'orc-1',
        loja_id: 'loja-A',
        numero: 'ORC-001',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        responsavel_id: 'user-1',
        expira_em: dataPassada,
      },
      {
        id: 'orc-2',
        loja_id: 'loja-A',
        numero: 'ORC-002',
        status_comercial: OrcamentoStatusComercial.EM_NEGOCIACAO,
        responsavel_id: 'user-2',
        expira_em: dataPassada,
      },
    ]);

    transicaoMock.executar.mockResolvedValue(true);

    const res = await service.processarPropostasExpiradas();

    expect(res.processados).toBe(2);
    expect(res.expirados).toBe(2);
    expect(res.orcamentoIdsExpirados).toEqual(['orc-1', 'orc-2']);

    expect(transicaoMock.executar).toHaveBeenCalledTimes(2);
    expect(transicaoMock.executar).toHaveBeenNthCalledWith(1, {
      orcamentoId: 'orc-1',
      lojaId: 'loja-A',
      origemStatus: OrcamentoStatusComercial.ENVIADA,
      destinoStatus: OrcamentoStatusComercial.EXPIRADA,
      origemAcao: 'SISTEMA',
      autor: 'SISTEMA',
      tipoAuditoria: 'expiracao_automatica',
      descricao: expect.stringContaining('ORC-001'),
      evento: 'vendas.proposta.expirada',
    });
    expect(transicaoMock.executar).toHaveBeenNthCalledWith(2, {
      orcamentoId: 'orc-2',
      lojaId: 'loja-A',
      origemStatus: OrcamentoStatusComercial.EM_NEGOCIACAO,
      destinoStatus: OrcamentoStatusComercial.EXPIRADA,
      origemAcao: 'SISTEMA',
      autor: 'SISTEMA',
      tipoAuditoria: 'expiracao_automatica',
      descricao: expect.stringContaining('ORC-002'),
      evento: 'vendas.proposta.expirada',
    });
  });

  it('4. duas execuções concorrentes geram uma única transição (CAS falha na 2a execução)', async () => {
    const dataPassada = new Date(Date.now() - 3600000);

    prismaMock.orcamento.findMany.mockResolvedValue([
      {
        id: 'orc-concorrente',
        loja_id: 'loja-A',
        numero: 'ORC-CONC',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        responsavel_id: 'user-1',
        expira_em: dataPassada,
      },
    ]);

    // Primeira execução ganha o CAS
    transicaoMock.executar.mockResolvedValueOnce(true);
    const res1 = await service.processarPropostasExpiradas();
    expect(res1.expirados).toBe(1);
    expect(res1.ignoradosConcorrencia).toBe(0);

    // Segunda execução perde o CAS (outro worker já mudou para expirada)
    transicaoMock.executar.mockResolvedValueOnce(false);
    const res2 = await service.processarPropostasExpiradas();
    expect(res2.expirados).toBe(0);
    expect(res2.ignoradosConcorrencia).toBe(1);
  });

  it('5. garante isolamento entre lojas distintas (multi-tenancy)', async () => {
    const dataPassada = new Date(Date.now() - 3600000);

    prismaMock.orcamento.findMany.mockResolvedValue([
      {
        id: 'orc-loja-1',
        loja_id: 'loja-1',
        numero: 'ORC-100',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        responsavel_id: 'user-1',
        expira_em: dataPassada,
      },
      {
        id: 'orc-loja-2',
        loja_id: 'loja-2',
        numero: 'ORC-200',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        responsavel_id: 'user-2',
        expira_em: dataPassada,
      },
    ]);

    transicaoMock.executar.mockResolvedValue(true);

    const res = await service.processarPropostasExpiradas();

    expect(res.expirados).toBe(2);
    expect(transicaoMock.executar).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ lojaId: 'loja-1' }),
    );
    expect(transicaoMock.executar).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ lojaId: 'loja-2' }),
    );
  });

  it('6. lote limitado e paginação sem loop infinito', async () => {
    const dataPassada = new Date(Date.now() - 3600000);

    // Simula lote de 2 itens na 1a chamada e lote vazio na 2a chamada
    prismaMock.orcamento.findMany
      .mockResolvedValueOnce([
        {
          id: 'orc-p1',
          loja_id: 'loja-A',
          numero: 'ORC-P1',
          status_comercial: OrcamentoStatusComercial.ENVIADA,
          responsavel_id: null,
          expira_em: dataPassada,
        },
        {
          id: 'orc-p2',
          loja_id: 'loja-A',
          numero: 'ORC-P2',
          status_comercial: OrcamentoStatusComercial.ENVIADA,
          responsavel_id: null,
          expira_em: dataPassada,
        },
      ])
      .mockResolvedValueOnce([]);

    transicaoMock.executar.mockResolvedValue(true);

    const res = await service.processarPropostasExpiradas(2, 5);

    expect(res.processados).toBe(2);
    expect(res.expirados).toBe(2);
    expect(prismaMock.orcamento.findMany).toHaveBeenCalledTimes(2);
  });

  it('7. falha em uma proposta não duplica nem corrompe as demais', async () => {
    const dataPassada = new Date(Date.now() - 3600000);

    prismaMock.orcamento.findMany.mockResolvedValue([
      {
        id: 'orc-erro',
        loja_id: 'loja-A',
        numero: 'ORC-ERR',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        responsavel_id: null,
        expira_em: dataPassada,
      },
      {
        id: 'orc-ok',
        loja_id: 'loja-A',
        numero: 'ORC-OK',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        responsavel_id: null,
        expira_em: dataPassada,
      },
    ]);

    transicaoMock.executar
      .mockRejectedValueOnce(new Error('Erro de banco inesperado'))
      .mockResolvedValueOnce(true);

    const res = await service.processarPropostasExpiradas();

    expect(res.processados).toBe(2);
    expect(res.erros).toBe(1);
    expect(res.expirados).toBe(1);
    expect(res.orcamentoIdsExpirados).toEqual(['orc-ok']);
  });

  it('8. aceite simultâneo versus expiração possui um único vencedor', async () => {
    const dataPassada = new Date(Date.now() - 3600000);

    prismaMock.orcamento.findMany.mockResolvedValue([
      {
        id: 'orc-aceite-simultaneo',
        loja_id: 'loja-A',
        numero: 'ORC-ACEITE',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        responsavel_id: null,
        expira_em: dataPassada,
      },
    ]);

    // O aceite público alterou o status para ACEITA em outra transação
    // O CAS de transicaoComercialService.executar devolve false porque origemStatus != ENVIADA
    transicaoMock.executar.mockResolvedValue(false);

    const res = await service.processarPropostasExpiradas();

    expect(res.expirados).toBe(0);
    expect(res.ignoradosConcorrencia).toBe(1);
  });
});
