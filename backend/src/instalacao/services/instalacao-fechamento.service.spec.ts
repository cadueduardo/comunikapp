import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StatusInstalacao, StatusInstalacaoOs } from '@prisma/client';
import { StatusExpedicao } from '../../expedicao/enums/status-expedicao.enum';
import { InstalacaoFechamentoService } from './instalacao-fechamento.service';

describe('InstalacaoFechamentoService', () => {
  let service: InstalacaoFechamentoService;

  const txMock = {
    itemOSInstalacao: { count: jest.fn() },
    ordemServico: { findFirst: jest.fn(), updateMany: jest.fn() },
    expedicaoLogistica: { updateMany: jest.fn() },
  };

  const prismaMock = {
    relatorioTecnicoInstalacao: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstalacaoFechamentoService(prismaMock as never);
  });

  it('não altera OS nem expedição quando ainda há lotes pendentes', async () => {
    txMock.itemOSInstalacao.count.mockResolvedValueOnce(1);

    await service.reterAposInstalacaoCompleta(
      txMock as never,
      'loja-1',
      'os-1',
    );

    expect(txMock.ordemServico.updateMany).not.toHaveBeenCalled();
    expect(txMock.expedicaoLogistica.updateMany).not.toHaveBeenCalled();
    expect(txMock.itemOSInstalacao.count).toHaveBeenCalledTimes(1);
  });

  it('não altera OS nem expedição quando a OS não possui lotes', async () => {
    txMock.itemOSInstalacao.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    await service.reterAposInstalacaoCompleta(
      txMock as never,
      'loja-1',
      'os-1',
    );

    expect(txMock.ordemServico.updateMany).not.toHaveBeenCalled();
    expect(txMock.expedicaoLogistica.updateMany).not.toHaveBeenCalled();
  });

  it('retém OS e expedição quando todos os lotes estão encerrados (DEC-04)', async () => {
    txMock.itemOSInstalacao.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);
    txMock.ordemServico.updateMany.mockResolvedValue({ count: 1 });
    txMock.expedicaoLogistica.updateMany.mockResolvedValue({ count: 1 });

    await service.reterAposInstalacaoCompleta(
      txMock as never,
      'loja-1',
      'os-1',
    );

    expect(txMock.itemOSInstalacao.count).toHaveBeenNthCalledWith(1, {
      where: {
        loja_id: 'loja-1',
        item_os: { os_id: 'os-1' },
        status_instalacao: {
          notIn: [
            StatusInstalacao.CONCLUIDO,
            StatusInstalacao.LOGISTICA_NEGATIVA,
          ],
        },
      },
    });

    expect(txMock.ordemServico.updateMany).toHaveBeenCalledWith({
      where: { id: 'os-1', loja_id: 'loja-1' },
      data: {
        status_instalacao_os:
          StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO,
      },
    });

    expect(txMock.expedicaoLogistica.updateMany).toHaveBeenCalledWith({
      where: {
        os_id: 'os-1',
        loja_id: 'loja-1',
        status: StatusExpedicao.AGUARDANDO_INSTALACAO,
      },
      data: {
        status: StatusExpedicao.AGUARDANDO_FECHAMENTO,
        atualizado_em: expect.any(Date),
      },
    });

    const expedicaoData =
      txMock.expedicaoLogistica.updateMany.mock.calls[0][0].data;
    expect(expedicaoData.status).not.toBe(StatusExpedicao.ENTREGUE_FINALIZADO);
  });

  describe('reconciliarStatusComRelatorioEmitido', () => {
    it('corrige OS para CONCLUIDA quando relatório já existe', async () => {
      const txReparo = {
        relatorioTecnicoInstalacao: {
          findFirst: jest.fn().mockResolvedValue({ id: 'rel-1' }),
        },
        ordemServico: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        expedicaoLogistica: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      prismaMock.relatorioTecnicoInstalacao.findMany.mockResolvedValue([
        { os_id: 'os-1' },
      ]);
      prismaMock.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
        fn(txReparo),
      );

      const corrigidos =
        await service.reconciliarStatusComRelatorioEmitido('loja-1', [
          'os-1',
        ]);

      expect(corrigidos).toEqual(new Set(['os-1']));
      expect(txReparo.ordemServico.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'os-1',
          loja_id: 'loja-1',
          status_instalacao_os: { not: StatusInstalacaoOs.CONCLUIDA },
        },
        data: { status_instalacao_os: StatusInstalacaoOs.CONCLUIDA },
      });
    });
  });

  describe('finalizarAposRelatorioTecnico', () => {
    it('conclui OS e finaliza expedição após relatório técnico (DEC-04)', async () => {
      txMock.ordemServico.findFirst.mockResolvedValue({
        id: 'os-1',
        status_instalacao_os:
          StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO,
      });
      txMock.ordemServico.updateMany.mockResolvedValue({ count: 1 });
      txMock.expedicaoLogistica.updateMany.mockResolvedValue({ count: 1 });

      await service.finalizarAposRelatorioTecnico(
        txMock as never,
        'loja-1',
        'os-1',
      );

      expect(txMock.ordemServico.findFirst).toHaveBeenCalledWith({
        where: { id: 'os-1', loja_id: 'loja-1' },
        select: { id: true, status_instalacao_os: true },
      });

      expect(txMock.ordemServico.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'os-1',
          loja_id: 'loja-1',
          status_instalacao_os:
            StatusInstalacaoOs.AGUARDANDO_RELATORIO_TECNICO,
        },
        data: { status_instalacao_os: StatusInstalacaoOs.CONCLUIDA },
      });

      expect(txMock.expedicaoLogistica.updateMany).toHaveBeenCalledWith({
        where: {
          os_id: 'os-1',
          loja_id: 'loja-1',
          status: StatusExpedicao.AGUARDANDO_FECHAMENTO,
        },
        data: {
          status: StatusExpedicao.ENTREGUE_FINALIZADO,
          data_conclusao: expect.any(Date),
          atualizado_em: expect.any(Date),
        },
      });
    });

    it('rejeita finalização quando loja_id não corresponde à OS (IDOR)', async () => {
      txMock.ordemServico.findFirst.mockResolvedValue(null);

      await expect(
        service.finalizarAposRelatorioTecnico(
          txMock as never,
          'loja-incompativel',
          'os-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(txMock.ordemServico.updateMany).not.toHaveBeenCalled();
      expect(txMock.expedicaoLogistica.updateMany).not.toHaveBeenCalled();
    });

    it('rejeita finalização quando OS não está aguardando relatório técnico', async () => {
      txMock.ordemServico.findFirst.mockResolvedValue({
        id: 'os-1',
        status_instalacao_os: StatusInstalacaoOs.EM_ANDAMENTO,
      });

      await expect(
        service.finalizarAposRelatorioTecnico(
          txMock as never,
          'loja-1',
          'os-1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(txMock.ordemServico.updateMany).not.toHaveBeenCalled();
      expect(txMock.expedicaoLogistica.updateMany).not.toHaveBeenCalled();
    });
  });
});
