import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusInstalacao } from '@prisma/client';
import {
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoPosCalculoService } from './instalacao-pos-calculo.service';
import { InstalacaoRelatorioPdfService } from './instalacao-relatorio-pdf.service';
import { InstalacaoSplitFiscalService } from './instalacao-split-fiscal.service';
import { InstalacaoFechamentoService } from './instalacao-fechamento.service';
import { ConfiguracaoInstalacaoService } from './configuracao-instalacao.service';

describe('InstalacaoPosCalculoService', () => {
  let service: InstalacaoPosCalculoService;

  const txMock = {
    cobrancaParcela: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    ordemServicoLog: { create: jest.fn() },
    cobrancaLog: { create: jest.fn() },
    relatorioTecnicoInstalacao: { create: jest.fn() },
  };

  const prismaMock = {
    produtoOrcamento: { findFirst: jest.fn() },
    cobrancaParcela: { updateMany: jest.fn() },
    ordemServico: { findFirst: jest.fn() },
    ocorrenciaInstalacao: { aggregate: jest.fn(), count: jest.fn() },
    itemOSInstalacao: { count: jest.fn() },
    cobranca: { findFirst: jest.fn() },
    relatorioTecnicoInstalacao: { findFirst: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof txMock) => Promise<void>) =>
      fn(txMock),
    ),
  };

  const pdfMock = {
    gerarRelatorioPdf: jest.fn(),
  };

  const splitMock = {
    calcularSplitFiscalOs: jest.fn(),
  };

  const fechamentoMock = {
    finalizarAposRelatorioTecnico: jest.fn(),
  };

  const configuracaoMock = {
    osAditivaHabilitada: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.ocorrenciaInstalacao.count.mockResolvedValue(0);
    service = new InstalacaoPosCalculoService(
      prismaMock as unknown as PrismaService,
      pdfMock as unknown as InstalacaoRelatorioPdfService,
      splitMock as unknown as InstalacaoSplitFiscalService,
      fechamentoMock as unknown as InstalacaoFechamentoService,
      configuracaoMock as unknown as ConfiguracaoInstalacaoService,
    );
  });

  it('retém parcela SALDO quando orçamento exige instalação', async () => {
    prismaMock.produtoOrcamento.findFirst.mockResolvedValue({ id: 'prod-1' });
    prismaMock.cobrancaParcela.updateMany.mockResolvedValue({ count: 1 });

    const retidas = await service.aplicarTravaSaldoAposAprovacao(
      'cob-1',
      'orc-1',
      'loja-1',
    );

    expect(retidas).toBe(1);
    expect(prismaMock.cobrancaParcela.updateMany).toHaveBeenCalledWith({
      where: {
        cobranca_id: 'cob-1',
        tipo: ParcelaTipo.SALDO,
        status: ParcelaStatus.PREVISTO,
      },
      data: { status: ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO },
    });
  });

  it('libera saldo como A_FATURAR e gera PDF no relatório técnico', async () => {
    prismaMock.relatorioTecnicoInstalacao.findFirst.mockResolvedValue(null);
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      orcamento_id: 'orc-1',
    });
    prismaMock.itemOSInstalacao.count.mockResolvedValue(0);
    prismaMock.cobranca.findFirst.mockResolvedValue({
      id: 'cob-1',
      parcelas: [
        { ordem: 1, tipo: ParcelaTipo.ENTRADA },
        { ordem: 2, tipo: ParcelaTipo.SALDO },
      ],
    });
    prismaMock.ocorrenciaInstalacao.aggregate.mockResolvedValue({
      _sum: { preco_cliente: 300 },
    });
    pdfMock.gerarRelatorioPdf.mockResolvedValue({
      pdf_token: 'tok-pdf',
      pdf_url: '/instalacao/relatorios/tok-pdf',
      buffer: new Uint8Array(),
      split: {
        total_nfe: 5000,
        total_nfs: 3000,
        total_geral: 8000,
        detalhes: [],
        instrucao_nfe: 'Emitir R$ 5.000,00 em NF-e',
        instrucao_nfs: 'Emitir R$ 3.000,00 em NFS-e',
      },
    });
    txMock.cobrancaParcela.updateMany.mockResolvedValue({ count: 1 });
    txMock.cobrancaParcela.create.mockResolvedValue({ id: 'parc-extra' });

    const resultado = await service.gerarRelatorioTecnicoFinal(
      'os-1',
      'loja-1',
      'user-1',
    );

    expect(pdfMock.gerarRelatorioPdf).toHaveBeenCalledWith('os-1', 'loja-1');
    expect(resultado.pdf_disponivel).toBe(true);
    expect(resultado.parcela_saldo_liberada).toBe(true);
    expect(txMock.cobrancaParcela.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ParcelaStatus.A_FATURAR,
        }),
      }),
    );
    expect(txMock.relatorioTecnicoInstalacao.create).toHaveBeenCalled();
    expect(fechamentoMock.finalizarAposRelatorioTecnico).toHaveBeenCalledWith(
      txMock,
      'loja-1',
      'os-1',
    );
  });

  it('impede relatório duplicado', async () => {
    prismaMock.relatorioTecnicoInstalacao.findFirst.mockResolvedValue({
      id: 'rel-1',
    });

    await expect(
      service.gerarRelatorioTecnicoFinal('os-1', 'loja-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bloqueia relatório técnico com lotes pendentes', async () => {
    prismaMock.relatorioTecnicoInstalacao.findFirst.mockResolvedValue(null);
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      orcamento_id: 'orc-1',
    });
    prismaMock.itemOSInstalacao.count.mockResolvedValue(2);

    await expect(
      service.gerarRelatorioTecnicoFinal('os-1', 'loja-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  describe('aprovarFinanceiroOs', () => {
    const pdfSplit = {
      total_nfe: 5000,
      total_nfs: 3000,
      total_geral: 8000,
      detalhes: [],
      instrucao_nfe: 'Emitir R$ 5.000,00 em NF-e',
      instrucao_nfs: 'Emitir R$ 3.000,00 em NFS-e',
    };

    function mockFluxoAprovacaoOk() {
      prismaMock.relatorioTecnicoInstalacao.findFirst.mockResolvedValue(null);
      prismaMock.ordemServico.findFirst.mockResolvedValue({
        id: 'os-1',
        orcamento_id: 'orc-1',
        status_instalacao_os: 'AGUARDANDO_RELATORIO_TECNICO',
      });
      prismaMock.itemOSInstalacao.count.mockResolvedValue(0);
      prismaMock.cobranca.findFirst.mockResolvedValue({
        id: 'cob-1',
        parcelas: [
          { ordem: 1, tipo: ParcelaTipo.ENTRADA },
          { ordem: 2, tipo: ParcelaTipo.SALDO },
        ],
      });
      prismaMock.ocorrenciaInstalacao.aggregate.mockResolvedValue({
        _sum: { preco_cliente: 150 },
      });
      pdfMock.gerarRelatorioPdf.mockResolvedValue({
        pdf_token: 'tok-fin',
        pdf_url: '/instalacao/relatorios/tok-fin',
        buffer: new Uint8Array(),
        split: pdfSplit,
      });
      txMock.cobrancaParcela.updateMany.mockResolvedValue({ count: 1 });
      txMock.cobrancaParcela.create.mockResolvedValue({ id: 'parc-extra-fin' });
    }

    it('libera saldo A_FATURAR e chama finalizarAposRelatorioTecnico na transação', async () => {
      mockFluxoAprovacaoOk();

      const resultado = await service.aprovarFinanceiroOs(
        'os-1',
        'loja-1',
        'user-fin',
      );

      expect(resultado.parcela_saldo_liberada).toBe(true);
      expect(resultado.aprovacao_financeira_em).toBeDefined();
      expect(txMock.cobrancaParcela.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            cobranca_id: 'cob-1',
            tipo: ParcelaTipo.SALDO,
            status: ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO,
          }),
          data: expect.objectContaining({
            status: ParcelaStatus.A_FATURAR,
          }),
        }),
      );
      expect(fechamentoMock.finalizarAposRelatorioTecnico).toHaveBeenCalledWith(
        txMock,
        'loja-1',
        'os-1',
      );
      expect(txMock.ordemServicoLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tipo_acao: 'APROVACAO_FINANCEIRA_INSTALACAO',
          }),
        }),
      );
    });

    it('rejeita aprovação duplicada', async () => {
      prismaMock.ordemServico.findFirst.mockResolvedValue({
        id: 'os-1',
        orcamento_id: 'orc-1',
        status_instalacao_os: 'AGUARDANDO_RELATORIO_TECNICO',
      });
      prismaMock.relatorioTecnicoInstalacao.findFirst.mockResolvedValue({
        id: 'rel-existente',
      });

      await expect(
        service.aprovarFinanceiroOs('os-1', 'loja-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('bloqueia IDOR — OS de outra loja retorna NotFound', async () => {
      prismaMock.ordemServico.findFirst.mockResolvedValue(null);

      await expect(
        service.aprovarFinanceiroOs('os-outra-loja', 'loja-1'),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prismaMock.ordemServico.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'os-outra-loja', loja_id: 'loja-1' },
        }),
      );
    });
  });
});
