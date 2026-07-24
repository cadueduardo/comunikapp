import { BadRequestException } from '@nestjs/common';
import { StatusOrdemTerceirizacao } from '@prisma/client';
import { TerceirizacaoService } from './terceirizacao.service';

describe('TerceirizacaoService', () => {
  const ordemTerceirizacao = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };
  const itemOSInstalacaoCriacaoService = {
    processarBaixaProducao: jest.fn(),
  };
  const service = new TerceirizacaoService({
    ordemTerceirizacao,
  } as any, itemOSInstalacaoCriacaoService as any);

  beforeEach(() => jest.clearAllMocks());

  it('sempre restringe a listagem à loja autenticada', async () => {
    ordemTerceirizacao.findMany.mockResolvedValue([]);

    await service.listar('loja-1', StatusOrdemTerceirizacao.COTADO);

    expect(ordemTerceirizacao.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { loja_id: 'loja-1', status: StatusOrdemTerceirizacao.COTADO },
      }),
    );
  });

  it('impede saltar etapas do fluxo operacional', async () => {
    ordemTerceirizacao.findFirst.mockResolvedValue({
      id: 'ordem-1',
      loja_id: 'loja-1',
      status: StatusOrdemTerceirizacao.A_COTAR,
    });

    await expect(
      service.atualizarStatus('loja-1', 'ordem-1', {
        status: StatusOrdemTerceirizacao.EM_PRODUCAO,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ordemTerceirizacao.update).not.toHaveBeenCalled();
  });

  it('registra o momento em que o pedido é enviado', async () => {
    ordemTerceirizacao.findFirst.mockResolvedValue({
      id: 'ordem-1',
      loja_id: 'loja-1',
      status: StatusOrdemTerceirizacao.COTADO,
    });
    ordemTerceirizacao.update.mockResolvedValue({ id: 'ordem-1' });

    await service.atualizarStatus('loja-1', 'ordem-1', {
      status: StatusOrdemTerceirizacao.PEDIDO_ENVIADO,
    });

    expect(ordemTerceirizacao.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ordem-1' },
        data: expect.objectContaining({
          status: StatusOrdemTerceirizacao.PEDIDO_ENVIADO,
          pedido_enviado_em: expect.any(Date),
        }),
      }),
    );
  });

  it('envia produto terceirizado pronto ao fluxo de instalação', async () => {
    ordemTerceirizacao.findFirst.mockResolvedValue({
      id: 'ordem-1',
      item_os_id: 'item-1',
      loja_id: 'loja-1',
      status: StatusOrdemTerceirizacao.EM_PRODUCAO,
    });
    ordemTerceirizacao.update.mockResolvedValue({
      id: 'ordem-1',
      item_os: { id: 'item-1', quantidade: 8 },
    });
    itemOSInstalacaoCriacaoService.processarBaixaProducao.mockResolvedValue({
      criado: true,
    });

    await service.atualizarStatus('loja-1', 'ordem-1', {
      status: StatusOrdemTerceirizacao.PRONTO,
    });

    expect(
      itemOSInstalacaoCriacaoService.processarBaixaProducao,
    ).toHaveBeenCalledWith({
      lojaId: 'loja-1',
      itemOsId: 'item-1',
      quantidadeProduzida: 8,
    });
  });
});
