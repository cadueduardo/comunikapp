import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { usuario_funcao, usuario_status } from '@prisma/client';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService contenção (Fase 0)', () => {
  type AtorFake = {
    id: string;
    funcao: usuario_funcao;
    status: usuario_status;
    ativo?: boolean;
    loja_id?: string;
  };

  function setup(overrides?: {
    findFirst?: unknown;
    atores?: Record<string, AtorFake>;
    count?: number;
    update?: unknown;
    updateManyCount?: number;
    resetToken?: unknown;
  }) {
    const prisma: any = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        update: jest.fn().mockResolvedValue(overrides?.update ?? { id: 'u1' }),
        updateMany: jest
          .fn()
          .mockResolvedValue({ count: overrides?.updateManyCount ?? 1 }),
        count: jest.fn().mockResolvedValue(overrides?.count ?? 0),
      },
      passwordResetToken: {
        findUnique: jest.fn().mockResolvedValue(overrides?.resetToken ?? null),
        updateMany: jest
          .fn()
          .mockResolvedValue({ count: overrides?.updateManyCount ?? 1 }),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn(),
    };
    prisma.usuario.findFirst.mockImplementation(
      async (args: {
        where?: {
          id?: string;
          loja_id?: string;
          status?: usuario_status;
          ativo?: boolean;
        };
      }) => {
        const where = args?.where ?? {};
        const id = where.id;
        const candidato: AtorFake | (Record<string, unknown> & { id?: string }) | null =
          (id && overrides?.atores?.[id]) ||
          (overrides?.findFirst &&
          (!id ||
            (overrides.findFirst as { id?: string }).id === id)
            ? (overrides.findFirst as Record<string, unknown> & { id?: string })
            : null);
        if (!candidato) {
          return null;
        }
        const row = candidato as AtorFake;
        if (where.loja_id && row.loja_id && row.loja_id !== where.loja_id) {
          return null;
        }
        if (where.status && row.status !== where.status) {
          return null;
        }
        if (where.ativo === true && row.ativo === false) {
          return null;
        }
        return row;
      },
    );
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof prisma) => unknown) => fn(prisma),
    );
    const mail = { sendVerificationEmail: jest.fn() };
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new UsuariosService(
      prisma as any,
      mail as any,
      audit as any,
    );
    return { service, prisma, mail, audit };
  }

  it('obter não devolve senha nem segredo', async () => {
    const publico = {
      id: 'u1',
      nome_completo: 'Ana',
      email: 'ana@loja.com',
      telefone: null,
      funcao: usuario_funcao.VENDAS,
      loja_id: 'loja-1',
      status: usuario_status.ATIVO,
      ativo: true,
      email_verificado: true,
      criado_em: new Date(),
      atualizado_em: new Date(),
    };
    const { service, prisma } = setup({ findFirst: publico });

    const resultado = await service.obter('u1', 'loja-1');

    expect(resultado).toEqual(publico);
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          email: true,
        }),
      }),
    );
    const select = prisma.usuario.findFirst.mock.calls[0][0].select;
    expect(select.senha).toBeUndefined();
    expect(select.two_factor_secret).toBeUndefined();
    expect(select.codigo_verificacao_email).toBeUndefined();
  });

  it('obter de outra loja resulta em não encontrado', async () => {
    const { service } = setup({ findFirst: null });
    await expect(service.obter('u1', 'loja-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('impede rebaixar o último administrador ativo', async () => {
    const { service, prisma } = setup({
      findFirst: {
        id: 'admin-1',
        funcao: usuario_funcao.ADMINISTRADOR,
        status: usuario_status.ATIVO,
      },
      atores: {
        'admin-2': {
          id: 'admin-2',
          funcao: usuario_funcao.ADMINISTRADOR,
          status: usuario_status.ATIVO,
          ativo: true,
          loja_id: 'loja-1',
        },
      },
      count: 0,
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { funcao: usuario_funcao.VENDAS },
        'admin-2',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('impede autoelevação de função, perfis e status', async () => {
    const { service } = setup({
      findFirst: {
        id: 'user-1',
        funcao: usuario_funcao.VENDAS,
        status: usuario_status.ATIVO,
      },
    });

    await expect(
      service.atualizar(
        'user-1',
        'loja-1',
        { funcao: usuario_funcao.ADMINISTRADOR },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.atualizar('user-1', 'loja-1', { perfilIds: ['p1'] }, 'user-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.atualizar(
        'user-1',
        'loja-1',
        { status: usuario_status.INATIVO },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('permite que outro administrador altere função de um não-admin', async () => {
    const { service, prisma } = setup({
      findFirst: {
        id: 'user-1',
        funcao: usuario_funcao.VENDAS,
        status: usuario_status.ATIVO,
      },
      atores: {
        'admin-2': {
          id: 'admin-2',
          funcao: usuario_funcao.ADMINISTRADOR,
          status: usuario_status.ATIVO,
          ativo: true,
        },
      },
      update: {
        id: 'user-1',
        funcao: usuario_funcao.ADMINISTRADOR,
        status: usuario_status.ATIVO,
      },
    });

    await service.atualizar(
      'user-1',
      'loja-1',
      { funcao: usuario_funcao.ADMINISTRADOR },
      'admin-2',
    );

    expect(prisma.usuario.update).toHaveBeenCalled();
  });

  it('impede que gestor com usuarios.usuarios.gerenciar promova outro a administrador', async () => {
    const { service, prisma } = setup({
      findFirst: {
        id: 'user-1',
        funcao: usuario_funcao.VENDAS,
        status: usuario_status.ATIVO,
      },
      atores: {
        'gestor-1': {
          id: 'gestor-1',
          funcao: usuario_funcao.VENDAS,
          status: usuario_status.ATIVO,
          ativo: true,
        },
      },
    });

    await expect(
      service.atualizar(
        'user-1',
        'loja-1',
        { funcao: usuario_funcao.ADMINISTRADOR },
        'gestor-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('impede que gestor crie usuário com função administrador', async () => {
    const { service, prisma } = setup({
      atores: {
        'gestor-1': {
          id: 'gestor-1',
          funcao: usuario_funcao.FINANCEIRO,
          status: usuario_status.ATIVO,
          ativo: true,
        },
      },
    });

    await expect(
      service.criar(
        'loja-1',
        {
          nome_completo: 'Novo Admin',
          email: 'admin2@loja.com',
          funcao: usuario_funcao.ADMINISTRADOR,
          senha: 'senha-segura',
        },
        'gestor-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });

  it('permite que administrador crie outro administrador', async () => {
    const { service, prisma } = setup({
      atores: {
        'admin-1': {
          id: 'admin-1',
          funcao: usuario_funcao.ADMINISTRADOR,
          status: usuario_status.ATIVO,
          ativo: true,
        },
      },
    });
    prisma.usuario.create.mockResolvedValue({
      id: 'user-2',
      email: 'admin2@loja.com',
      funcao: usuario_funcao.ADMINISTRADOR,
    });

    await expect(
      service.criar(
        'loja-1',
        {
          nome_completo: 'Novo Admin',
          email: 'admin2@loja.com',
          funcao: usuario_funcao.ADMINISTRADOR,
          senha: 'senha-segura',
        },
        'admin-1',
      ),
    ).resolves.toEqual({ id: 'user-2' });
    expect(prisma.usuario.create).toHaveBeenCalled();
  });

  it('reenviar código não revela se o e-mail existe', async () => {
    const { service, mail } = setup();
    const resposta = await service.reenviarCodigo('naoexiste@loja.com');
    expect(resposta.message).toMatch(/Se o e-mail existir/i);
    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('lista só a loja autenticada e pagina', async () => {
    const { service, prisma } = setup();
    prisma.usuario.findMany.mockResolvedValue([
      { id: 'u1', loja_id: 'loja-1' },
    ]);
    prisma.usuario.count.mockResolvedValue(1);

    const resultado = await service.listar('loja-1', { page: 1, limit: 20 });

    expect(resultado.total).toBe(1);
    expect(resultado.items).toHaveLength(1);
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ loja_id: 'loja-1' }),
        take: 20,
        skip: 0,
      }),
    );
  });

  it('reset de senha queima o token de forma atômica e incrementa session_version', async () => {
    const { service, prisma } = setup({
      resetToken: {
        id: 'tok-1',
        used_at: null,
        expires_at: new Date(Date.now() + 60_000),
        usuario_id: 'u1',
        usuario: {
          id: 'u1',
          status: usuario_status.ATIVO,
          email_verificado: true,
        },
      },
      updateManyCount: 1,
    });

    await service.redefinirSenha('token-valido', 'novaSenha1');

    expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'tok-1', used_at: null }),
      }),
    );
    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: expect.objectContaining({
          session_version: { increment: 1 },
        }),
      }),
    );
  });

  it('recusa replay de token de reset já usado', async () => {
    const { service } = setup({
      resetToken: {
        id: 'tok-1',
        used_at: null,
        expires_at: new Date(Date.now() + 60_000),
        usuario_id: 'u1',
        usuario: {
          id: 'u1',
          status: usuario_status.ATIVO,
          email_verificado: true,
        },
      },
      updateManyCount: 0,
    });

    await expect(
      service.redefinirSenha('token-replay', 'novaSenha1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('UsuariosService contenção de contas ADMINISTRADOR', () => {
  const gestor = {
    id: 'gestor-1',
    funcao: usuario_funcao.VENDAS,
    status: usuario_status.ATIVO,
    ativo: true,
    loja_id: 'loja-1',
  } as const;
  const adminAtivo = {
    id: 'admin-2',
    funcao: usuario_funcao.ADMINISTRADOR,
    status: usuario_status.ATIVO,
    ativo: true,
    loja_id: 'loja-1',
  } as const;
  const adminAlvo = {
    id: 'admin-1',
    funcao: usuario_funcao.ADMINISTRADOR,
    status: usuario_status.ATIVO,
    ativo: true,
    loja_id: 'loja-1',
  };

  function setupConta(overrides?: {
    findFirst?: unknown;
    atores?: Record<
      string,
      {
        id: string;
        funcao: usuario_funcao;
        status: usuario_status;
        ativo?: boolean;
        loja_id?: string;
      }
    >;
    count?: number;
    update?: unknown;
  }) {
    const prisma: any = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        update: jest.fn().mockResolvedValue(overrides?.update ?? { id: 'u1' }),
        count: jest.fn().mockResolvedValue(overrides?.count ?? 1),
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
      $transaction: jest.fn(),
    };
    prisma.usuario.findFirst.mockImplementation(
      async (args: {
        where?: {
          id?: string;
          loja_id?: string;
          status?: usuario_status;
          ativo?: boolean;
        };
      }) => {
        const where = args?.where ?? {};
        const id = where.id;
        const candidato =
          (id && overrides?.atores?.[id]) ||
          (overrides?.findFirst &&
          (!id || (overrides.findFirst as { id?: string }).id === id)
            ? overrides.findFirst
            : null);
        if (!candidato) {
          return null;
        }
        const row = candidato as {
          id: string;
          funcao: usuario_funcao;
          status: usuario_status;
          ativo?: boolean;
          loja_id?: string;
        };
        if (where.loja_id && row.loja_id && row.loja_id !== where.loja_id) {
          return null;
        }
        if (where.status && row.status !== where.status) {
          return null;
        }
        if (where.ativo === true && row.ativo === false) {
          return null;
        }
        return row;
      },
    );
    prisma.$transaction.mockImplementation(
      async (fn: (client: typeof prisma) => unknown) => fn(prisma),
    );
    const mail = { sendVerificationEmail: jest.fn() };
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new UsuariosService(
      prisma as any,
      mail as any,
      audit as any,
    );
    return { service, prisma };
  }

  function lookupAtorNoBanco(prisma: any, atorId: string) {
    return prisma.usuario.findFirst.mock.calls.find(
      (call: [{ where?: { id?: string; ativo?: boolean } }]) =>
        call[0]?.where?.id === atorId && call[0]?.where?.ativo === true,
    );
  }

  it('gestor não altera o e-mail de um administrador', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: { [gestor.id]: { ...gestor } },
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { email: 'atacante@externo.com' },
        gestor.id,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(lookupAtorNoBanco(prisma, gestor.id)?.[0].where).toEqual(
      expect.objectContaining({
        id: gestor.id,
        loja_id: 'loja-1',
        status: usuario_status.ATIVO,
        ativo: true,
      }),
    );
  });

  it('gestor não altera nome, telefone, status, função ou perfis de um administrador', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: { [gestor.id]: { ...gestor } },
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { nome_completo: 'Nome Tomado' },
        gestor.id,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { telefone: '11999999999' },
        gestor.id,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { status: usuario_status.INATIVO },
        gestor.id,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { funcao: usuario_funcao.VENDAS },
        gestor.id,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.atualizar('admin-1', 'loja-1', { perfilIds: ['p1'] }, gestor.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('gestor não reativa administrador inativo', async () => {
    const { service, prisma } = setupConta({
      findFirst: {
        ...adminAlvo,
        status: usuario_status.INATIVO,
        ativo: false,
      },
      atores: { [gestor.id]: { ...gestor } },
    });

    await expect(
      service.reativar('admin-1', 'loja-1', gestor.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('gestor não desativa administrador', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: { [gestor.id]: { ...gestor } },
    });

    await expect(
      service.desativar('admin-1', 'loja-1', gestor.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  it('gestor continua podendo editar e reativar usuários operacionais', async () => {
    const operacional = {
      id: 'user-1',
      funcao: usuario_funcao.VENDAS,
      status: usuario_status.INATIVO,
      ativo: false,
      loja_id: 'loja-1',
    };
    const { service, prisma } = setupConta({
      findFirst: operacional,
      atores: { [gestor.id]: { ...gestor } },
      update: {
        id: 'user-1',
        funcao: usuario_funcao.VENDAS,
        status: usuario_status.ATIVO,
        email: 'ops@loja.com',
      },
    });

    await expect(
      service.atualizar(
        'user-1',
        'loja-1',
        { email: 'ops@loja.com', nome_completo: 'Operacional' },
        gestor.id,
      ),
    ).resolves.toEqual(expect.objectContaining({ id: 'user-1' }));
    await expect(
      service.reativar('user-1', 'loja-1', gestor.id),
    ).resolves.toEqual(expect.objectContaining({ id: 'user-1' }));
    expect(prisma.usuario.update).toHaveBeenCalled();
  });

  it('gestor continua sem conseguir criar ou promover administrador', async () => {
    const { service, prisma } = setupConta({
      findFirst: {
        id: 'user-1',
        funcao: usuario_funcao.VENDAS,
        status: usuario_status.ATIVO,
        loja_id: 'loja-1',
      },
      atores: { [gestor.id]: { ...gestor } },
    });

    await expect(
      service.criar(
        'loja-1',
        {
          nome_completo: 'Novo Admin',
          email: 'admin2@loja.com',
          funcao: usuario_funcao.ADMINISTRADOR,
          senha: 'senha-segura',
        },
        gestor.id,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.atualizar(
        'user-1',
        'loja-1',
        { funcao: usuario_funcao.ADMINISTRADOR },
        gestor.id,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.create).not.toHaveBeenCalled();
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('administrador ativo da mesma loja pode editar, desativar e reativar outro administrador', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: { [adminAtivo.id]: { ...adminAtivo } },
      count: 1,
      update: {
        id: 'admin-1',
        funcao: usuario_funcao.ADMINISTRADOR,
        status: usuario_status.ATIVO,
        email: 'admin1@loja.com',
      },
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { email: 'admin1@loja.com', telefone: '11000000000' },
        adminAtivo.id,
      ),
    ).resolves.toEqual(expect.objectContaining({ id: 'admin-1' }));
    await expect(
      service.desativar('admin-1', 'loja-1', adminAtivo.id),
    ).resolves.toEqual(expect.objectContaining({ id: 'admin-1' }));
    await expect(
      service.reativar('admin-1', 'loja-1', adminAtivo.id),
    ).resolves.toEqual(expect.objectContaining({ id: 'admin-1' }));
    expect(prisma.usuario.update).toHaveBeenCalled();
  });

  it('administrador de outra loja não administra conta privilegiada', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: {
        'admin-outra': {
          id: 'admin-outra',
          funcao: usuario_funcao.ADMINISTRADOR,
          status: usuario_status.ATIVO,
          ativo: true,
          loja_id: 'loja-b',
        },
      },
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { email: 'x@loja.com' },
        'admin-outra',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('administrador inativo não administra conta privilegiada', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: {
        'admin-inativo': {
          id: 'admin-inativo',
          funcao: usuario_funcao.ADMINISTRADOR,
          status: usuario_status.INATIVO,
          ativo: true,
          loja_id: 'loja-1',
        },
      },
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { email: 'x@loja.com' },
        'admin-inativo',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('administrador com ativo=false não administra conta privilegiada', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: {
        'admin-flag': {
          id: 'admin-flag',
          funcao: usuario_funcao.ADMINISTRADOR,
          status: usuario_status.ATIVO,
          ativo: false,
          loja_id: 'loja-1',
        },
      },
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { email: 'x@loja.com' },
        'admin-flag',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });

  it('preserva FOR UPDATE ao desativar o último administrador', async () => {
    const { service, prisma } = setupConta({
      findFirst: adminAlvo,
      atores: { [adminAtivo.id]: { ...adminAtivo } },
      count: 0,
    });

    await expect(
      service.desativar('admin-1', 'loja-1', adminAtivo.id),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.usuario.update).not.toHaveBeenCalled();
  });
});
