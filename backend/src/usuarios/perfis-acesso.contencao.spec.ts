import { PerfisAcessoService } from './perfis-acesso.service';
import { ConflictException } from '@nestjs/common';

describe('PerfisAcessoService contenção', () => {
  function setup(overrides?: { findFirst?: unknown; updateManyCount?: number }) {
    const prisma = {
      perfil_acesso: {
        findFirst: jest.fn().mockResolvedValue(overrides?.findFirst ?? null),
        create: jest.fn().mockResolvedValue({ id: 'p1', sistema: false, nome: 'Customizado' }),
        updateMany: jest
          .fn()
          .mockResolvedValue({ count: overrides?.updateManyCount ?? 1 }),
      },
      $transaction: jest.fn(),
    };
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new PerfisAcessoService(prisma as any, audit as any);
    return { service, prisma, audit };
  }

  it('força sistema=false mesmo se o cliente enviar o campo', async () => {
    const { service, prisma } = setup();

    await service.criar(
      'loja-1',
      {
        nome: 'Customizado',
        sistema: true,
      } as any,
      'admin-1',
    );

    expect(prisma.perfil_acesso.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja_id: 'loja-1',
          nome: 'Customizado',
          sistema: false,
        }),
      }),
    );
  });

  it('recusa update concorrente com versão desatualizada', async () => {
    const prisma = {
      perfil_acesso: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'p1',
            loja_id: 'loja-1',
            nome: 'Ops',
            sistema: false,
            versao: 3,
          })
          .mockResolvedValueOnce(null),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new PerfisAcessoService(prisma as any, audit as any);

    await expect(
      service.atualizar(
        'p1',
        'loja-1',
        { nome: 'Ops', versao: 2 },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
