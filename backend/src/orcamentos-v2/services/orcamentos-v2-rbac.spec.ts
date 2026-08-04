import { OrcamentosV2Service } from './orcamentos-v2.service';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';

describe('OrcamentosV2Service - autorização interna', () => {
  it('autoriza no service antes de marcar mensagem como visualizada', async () => {
    const assertPode = jest.fn().mockResolvedValue(undefined);
    const findFirst = jest.fn().mockResolvedValue({ id: 'orc-1' });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });

    const service = Object.create(
      OrcamentosV2Service.prototype,
    ) as OrcamentosV2Service;
    Object.assign(service as any, {
      vendasPermissions: { assertPode },
      prisma: {
        orcamento: { findFirst },
        mensagemChat: { updateMany },
      },
      logger: { log: jest.fn(), error: jest.fn() },
    });

    await service.marcarMensagemVisualizadaPublica(
      'orc-1',
      'msg-1',
      'loja-1',
      'usuario-1',
    );

    expect(assertPode).toHaveBeenCalledWith(
      'usuario-1',
      'loja-1',
      VENDAS_PERMISSOES.PROPOSTA_VER,
    );
    expect(assertPode.mock.invocationCallOrder[0]).toBeLessThan(
      findFirst.mock.invocationCallOrder[0],
    );
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'msg-1', orcamento_id: 'orc-1' },
      data: { lida: true },
    });
  });
});
