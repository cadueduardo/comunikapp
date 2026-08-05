import { BadRequestException } from '@nestjs/common';
import { ValidacaoV2Service } from './validacao-v2.service';

describe('ValidacaoV2Service — contato_id (critério 37)', () => {
  function build(prisma: Record<string, unknown>) {
    return new ValidacaoV2Service(prisma as never);
  }

  it('aceita contato da mesma loja e do mesmo cliente', async () => {
    const prisma = {
      cliente: {
        findFirst: jest.fn().mockResolvedValue({ id: 'c1', ativo: true }),
      },
      cliente_contato: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ct1' }),
      },
    };
    const svc = build(prisma);
    await expect(
      (svc as any).validarContato('ct1', 'c1', 'l1'),
    ).resolves.toBeUndefined();
    expect(prisma.cliente_contato.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'ct1',
        loja_id: 'l1',
        cliente_id: 'c1',
        ativo: true,
      },
      select: { id: true },
    });
  });

  it('nega contato de outra loja / outro cliente', async () => {
    const prisma = {
      cliente_contato: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const svc = build(prisma);
    await expect(
      (svc as any).validarContato('ct-outro', 'c1', 'l1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('nega contato sem cliente_id', async () => {
    const svc = build({});
    await expect(
      (svc as any).validarContato('ct1', null, 'l1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('validarDadosCriacao propaga contato incompatível', async () => {
    const prisma = {
      cliente: {
        findFirst: jest.fn().mockResolvedValue({ id: 'c1', ativo: true }),
      },
      cliente_contato: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const svc = build(prisma);
    jest.spyOn(svc as any, 'validarCamposObrigatorios').mockReturnValue(undefined);
    jest.spyOn(svc as any, 'validarTiposDados').mockReturnValue(undefined);
    jest.spyOn(svc as any, 'validarValores').mockReturnValue(undefined);
    jest.spyOn(svc as any, 'validarProdutos').mockResolvedValue(undefined);
    jest.spyOn(svc as any, 'validarConfiguracoes').mockResolvedValue(undefined);
    jest.spyOn(svc as any, 'validarIntegridadeDados').mockReturnValue(undefined);
    jest.spyOn(svc as any, 'validarRegrasNegocio').mockReturnValue(undefined);

    await expect(
      svc.validarDadosCriacao(
        {
          cliente_id: 'c1',
          contato_id: 'ct-x',
          produtos: [{ nome: 'x' }],
          status: 'rascunho',
        },
        'l1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
