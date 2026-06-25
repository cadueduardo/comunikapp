import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusRollupService } from '../../financeiro/services/status-rollup.service';
import {
  ParcelaStatus,
  ParcelaTipo,
} from '../../financeiro/enums/cobranca-status.enum';
import { ExpedicaoFinanceiroService } from './expedicao-financeiro.service';

describe('ExpedicaoFinanceiroService', () => {
  let service: ExpedicaoFinanceiroService;
  let prisma: {
    ordemServico: { findFirst: jest.Mock };
    cobranca: { findFirst: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      ordemServico: { findFirst: jest.fn() },
      cobranca: { findFirst: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExpedicaoFinanceiroService,
        StatusRollupService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ExpedicaoFinanceiroService);
  });

  it('libera entrega quando orcamento_id é nulo', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      orcamento_id: null,
    });

    const resultado = await service.verificarBloqueioEntrega('os-1', 'loja-1');

    expect(resultado).toEqual({ bloqueado: false, motivo: 'SEM_ORCAMENTO' });
    expect(prisma.cobranca.findFirst).not.toHaveBeenCalled();
  });

  it('libera entrega quando não há cobrança', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      numero: 'OS-2026-012',
      orcamento_id: 'orc-1',
      orcamento: { numero: 'ORC-2026-010' },
    });
    prisma.cobranca.findFirst.mockResolvedValue(null);

    const resultado = await service.verificarBloqueioEntrega('os-1', 'loja-1');

    expect(resultado).toEqual({ bloqueado: false, motivo: 'SEM_COBRANCA' });
  });

  it('bloqueia quando parcela SALDO está PREVISTO', async () => {
    const vencimento = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      numero: 'OS-2026-012',
      orcamento_id: 'orc-1',
      orcamento: { numero: 'ORC-2026-010' },
    });
    prisma.cobranca.findFirst.mockResolvedValue({
      id: 'cob-1',
      parcelas: [
        {
          id: 'parc-1',
          tipo: ParcelaTipo.ENTRADA,
          valor_previsto: 500,
          valor_recebido: 500,
          data_vencimento: vencimento,
          status: ParcelaStatus.LIQUIDADO,
        },
        {
          id: 'parc-2',
          tipo: ParcelaTipo.SALDO,
          valor_previsto: 500,
          valor_recebido: 0,
          data_vencimento: vencimento,
          status: ParcelaStatus.PREVISTO,
        },
      ],
    });

    const resultado = await service.verificarBloqueioEntrega('os-1', 'loja-1');

    expect(resultado.bloqueado).toBe(true);
    expect(resultado.motivo).toBe('PARCELAS_EM_ABERTO');
    expect(resultado.parcelas).toHaveLength(1);
    expect(resultado.parcelas?.[0].tipo).toBe(ParcelaTipo.SALDO);
    expect(resultado.link_financeiro).toBe(
      '/financeiro/recebimentos?cobranca=cob-1&os=os-1&ref=OS-2026-012',
    );
    expect(resultado.os_numero).toBe('OS-2026-012');
    expect(resultado.orcamento_numero).toBe('ORC-2026-010');
  });

  it('bloqueia quando parcela ENTRADA está VENCIDA', async () => {
    const vencimentoPassado = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    prisma.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      numero: 'OS-2026-012',
      orcamento_id: 'orc-1',
      orcamento: { numero: 'ORC-2026-010' },
    });
    prisma.cobranca.findFirst.mockResolvedValue({
      id: 'cob-1',
      parcelas: [
        {
          id: 'parc-1',
          tipo: ParcelaTipo.ENTRADA,
          valor_previsto: 500,
          valor_recebido: 0,
          data_vencimento: vencimentoPassado,
          status: ParcelaStatus.PREVISTO,
        },
      ],
    });

    const resultado = await service.verificarBloqueioEntrega('os-1', 'loja-1');

    expect(resultado.bloqueado).toBe(true);
    expect(resultado.parcelas?.[0].status).toBe(ParcelaStatus.VENCIDO);
  });

  it('lança NotFoundException quando OS não pertence à loja', async () => {
    prisma.ordemServico.findFirst.mockResolvedValue(null);

    await expect(
      service.verificarBloqueioEntrega('os-x', 'loja-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
