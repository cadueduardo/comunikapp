import { BadRequestException } from '@nestjs/common';
import { StatusInstalacao } from '@prisma/client';
import {
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoPosCalculoService } from './instalacao-pos-calculo.service';

describe('InstalacaoPosCalculoService', () => {
  let service: InstalacaoPosCalculoService;

  const txMock = {
    cobrancaParcela: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    ordemServicoLog: { create: jest.fn() },
    cobrancaLog: { create: jest.fn() },
  };

  const prismaMock = {
    produtoOrcamento: { findFirst: jest.fn() },
    cobrancaParcela: { updateMany: jest.fn() },
    ordemServico: { findFirst: jest.fn() },
    ocorrenciaInstalacao: { aggregate: jest.fn() },
    itemOSInstalacao: { count: jest.fn() },
    cobranca: { findFirst: jest.fn() },
    $transaction: jest.fn(async (fn: (tx: typeof txMock) => Promise<void>) =>
      fn(txMock),
    ),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstalacaoPosCalculoService(
      prismaMock as unknown as PrismaService,
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

  it('calcula margem real subtraindo custos de campo', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      valor_orcado: 10000,
      orcamento: { custo_total: 6000, preco_final: 10000 },
    });
    prismaMock.ocorrenciaInstalacao.aggregate.mockResolvedValue({
      _sum: { custo_interno: 500 },
    });

    const margem = await service.calcularMargemRealOs('os-1', 'loja-1');

    expect(margem).toEqual({
      os_id: 'os-1',
      valor_orcado: 10000,
      custo_orcado: 6000,
      custos_extras_campo: 500,
      lucro_real: 3500,
      margem_percentual: 35,
    });
  });

  it('libera saldo e cria parcela extra no relatório técnico final', async () => {
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
    txMock.cobrancaParcela.updateMany.mockResolvedValue({ count: 1 });
    txMock.cobrancaParcela.create.mockResolvedValue({ id: 'parc-extra' });

    const resultado = await service.gerarRelatorioTecnicoFinal(
      'os-1',
      'loja-1',
      'user-1',
    );

    expect(resultado.parcela_saldo_liberada).toBe(true);
    expect(resultado.valor_cobranca_extra).toBe(300);
    expect(resultado.parcela_extra_id).toBe('parc-extra');
    expect(resultado.pdf_disponivel).toBe(false);
    expect(txMock.cobrancaParcela.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: ParcelaStatus.AGUARDANDO_RELATORIO_TECNICO,
        }),
        data: expect.objectContaining({
          status: ParcelaStatus.PREVISTO,
        }),
      }),
    );
  });

  it('bloqueia relatório técnico com lotes pendentes', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      orcamento_id: 'orc-1',
    });
    prismaMock.itemOSInstalacao.count.mockResolvedValue(2);

    await expect(
      service.gerarRelatorioTecnicoFinal('os-1', 'loja-1'),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.itemOSInstalacao.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          loja_id: 'loja-1',
          status_instalacao: {
            notIn: [
              StatusInstalacao.CONCLUIDO,
              StatusInstalacao.LOGISTICA_NEGATIVA,
            ],
          },
        }),
      }),
    );
  });
});
