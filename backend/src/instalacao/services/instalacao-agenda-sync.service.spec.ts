import { NotFoundException } from '@nestjs/common';
import { StatusInstalacao } from '@prisma/client';
import { InstalacaoAgendaSyncService } from './instalacao-agenda-sync.service';

describe('InstalacaoAgendaSyncService', () => {
  let service: InstalacaoAgendaSyncService;

  const txMock = {
    itemOSInstalacao: { findFirst: jest.fn() },
    ordemServico: { updateMany: jest.fn() },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InstalacaoAgendaSyncService();
  });

  it('sincroniza OS com a menor data_previsao futura entre lotes ativos', async () => {
    const menorData = new Date('2026-08-15T14:00:00.000Z');
    txMock.itemOSInstalacao.findFirst.mockResolvedValue({
      data_previsao: menorData,
    });
    txMock.ordemServico.updateMany.mockResolvedValue({ count: 1 });

    await service.sincronizarDataOs(txMock as never, 'loja-1', 'os-1');

    expect(txMock.itemOSInstalacao.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          loja_id: 'loja-1',
          item_os: { os_id: 'os-1' },
          data_previsao: expect.objectContaining({ not: null }),
          status_instalacao: {
            notIn: [
              StatusInstalacao.CONCLUIDO,
              StatusInstalacao.LOGISTICA_NEGATIVA,
            ],
          },
        }),
        orderBy: { data_previsao: 'asc' },
      }),
    );

    expect(txMock.ordemServico.updateMany).toHaveBeenCalledWith({
      where: { id: 'os-1', loja_id: 'loja-1' },
      data: { data_instalacao_agendada: menorData },
    });
  });

  it('define data_instalacao_agendada como null quando não há lotes futuros ativos', async () => {
    txMock.itemOSInstalacao.findFirst.mockResolvedValue(null);
    txMock.ordemServico.updateMany.mockResolvedValue({ count: 1 });

    await service.sincronizarDataOs(txMock as never, 'loja-1', 'os-1');

    expect(txMock.ordemServico.updateMany).toHaveBeenCalledWith({
      where: { id: 'os-1', loja_id: 'loja-1' },
      data: { data_instalacao_agendada: null },
    });
  });

  it('isola tenant — não atualiza OS de outra loja', async () => {
    txMock.itemOSInstalacao.findFirst.mockResolvedValue({
      data_previsao: new Date('2026-08-20T10:00:00.000Z'),
    });
    txMock.ordemServico.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.sincronizarDataOs(txMock as never, 'loja-incompativel', 'os-1'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(txMock.ordemServico.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'os-1', loja_id: 'loja-incompativel' },
      }),
    );
  });
});
