import { PerfisAcessoService } from './perfis-acesso.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { usuario_funcao, usuario_status } from '@prisma/client';

describe('PerfisAcessoService contenção', () => {
  function setup(overrides?: {
    findFirst?: unknown;
    updateManyCount?: number;
  }) {
    const prisma: any = {
      perfil_acesso: {
        findFirst: jest.fn().mockResolvedValue(overrides?.findFirst ?? null),
        create: jest
          .fn()
          .mockResolvedValue({ id: 'p1', sistema: false, nome: 'Customizado' }),
        updateMany: jest
          .fn()
          .mockResolvedValue({ count: overrides?.updateManyCount ?? 1 }),
      },
      perfil_permissao: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof prisma) => unknown) => fn(prisma),
    );
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
      service.atualizar('p1', 'loja-1', { nome: 'Ops', versao: 2 }, 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('recusa permissão fora do catálogo', async () => {
    const { service, prisma } = setup();

    await expect(
      service.criar(
        'loja-1',
        {
          nome: 'Invalido',
          permissoes: [{ modulo: 'inventado', acao: 'voar', permitido: true }],
        },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.perfil_acesso.create).not.toHaveBeenCalled();
  });

  it('recusa associar perfil a conta administradora sem ator administrador da loja', async () => {
    const prisma: any = {
      perfil_acesso: {
        findFirst: jest.fn().mockResolvedValue({ id: 'p1', loja_id: 'loja-1' }),
      },
      usuario: {
        findFirst: jest.fn().mockImplementation(
          async (args: {
            where?: {
              id?: string;
              ativo?: boolean;
              status?: usuario_status;
            };
          }) => {
            if (args?.where?.id === 'gestor-1' && args?.where?.ativo === true) {
              return {
                funcao: usuario_funcao.VENDAS,
                status: usuario_status.ATIVO,
              };
            }
            return { id: 'admin-1', funcao: usuario_funcao.ADMINISTRADOR };
          },
        ),
      },
      usuario_perfil: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof prisma) => unknown) => fn(prisma),
    );
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new PerfisAcessoService(prisma as any, audit as any);

    await expect(
      service.associarUsuario('p1', 'admin-1', 'loja-1', 'gestor-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario_perfil.create).not.toHaveBeenCalled();
  });
});
