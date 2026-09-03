import { ForbiddenException } from '@nestjs/common';
import { OrcamentosV2Service } from './orcamentos-v2.service';
import { VENDAS_PERMISSOES } from '../../vendas/permissions/vendas-permissoes';

describe('OrcamentosV2Service - transferência de responsável', () => {
  const identidade = { usuarioId: 'gestor-1', lojaId: 'loja-1' };
  const dto = {
    para_usuario_id: 'vend-2',
    motivo: 'Redistribuição da fila',
    chave_operacao: 'chave-op-123456',
  };

  it('sem CARTEIRA_TRANSFERIR não muta o orçamento', async () => {
    const assertPode = jest.fn().mockRejectedValue(
      new ForbiddenException(
        'Você não tem permissão para executar esta ação.',
      ),
    );
    const updateMany = jest.fn();
    const findFirst = jest.fn();

    const service = Object.create(
      OrcamentosV2Service.prototype,
    ) as OrcamentosV2Service;
    Object.assign(service as any, {
      vendasPermissions: { assertPode },
      prisma: {
        orcamento: { findFirst, updateMany },
        historicoOrcamento: { findFirst: jest.fn(), create: jest.fn() },
        usuario: { findFirst: jest.fn() },
      },
      carteiraEscopo: { assertOrcamentoAcessivel: jest.fn() },
      logger: { log: jest.fn(), error: jest.fn() },
    });

    await expect(
      service.transferirResponsavel(identidade as never, 'orc-1', dto),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(assertPode).toHaveBeenCalledWith(
      'gestor-1',
      'loja-1',
      VENDAS_PERMISSOES.CARTEIRA_TRANSFERIR,
    );
    expect(findFirst).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });
});
