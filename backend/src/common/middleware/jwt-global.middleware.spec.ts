import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtGlobalMiddleware } from './jwt-global.middleware';

function request(path = '/clientes') {
  return {
    method: 'GET',
    path,
    headers: {},
    cookies: { comunikapp_session: 'store-token' },
  } as any;
}

function activeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'usuario@loja.com',
    loja_id: 'loja-1',
    funcao: 'ADMINISTRADOR',
    nome_completo: 'Usuário Teste',
    session_version: 0,
    loja: {
      id: 'loja-1',
      nome: 'Loja Teste',
      slug: 'loja-teste',
      status: 'ATIVO',
      session_version: 0,
    },
    ...overrides,
  };
}

describe('JwtGlobalMiddleware', () => {
  const payload = {
    sub: 'user-1',
    loja_id: 'loja-1',
    loja_session_version: 0,
  };

  function setup(user = activeUser()) {
    const jwtService = { verify: jest.fn().mockReturnValue(payload) };
    const prisma = {
      usuario: { findFirst: jest.fn().mockResolvedValue(user) },
    };
    const middleware = new JwtGlobalMiddleware(
      jwtService as any,
      prisma as any,
    );
    return { middleware, jwtService, prisma };
  }

  it('não tenta validar sessão de loja em rotas administrativas', async () => {
    const { middleware, jwtService, prisma } = setup();
    const next = jest.fn();

    await middleware.use(
      request('/admin/v1/auth/login'),
      {} as any,
      next,
    );

    expect(next).toHaveBeenCalledTimes(1);
    expect(jwtService.verify).not.toHaveBeenCalled();
    expect(prisma.usuario.findFirst).not.toHaveBeenCalled();
  });

  it('nega requisição autenticada de loja bloqueada', async () => {
    const user = activeUser({
      loja: {
        ...activeUser().loja,
        status: 'BLOQUEADO',
      },
    });
    const { middleware } = setup(user);

    await expect(
      middleware.use(request(), {} as any, jest.fn()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('nega token anterior à revogação da loja', async () => {
    const user = activeUser({
      loja: {
        ...activeUser().loja,
        session_version: 1,
      },
    });
    const { middleware } = setup(user);

    await expect(
      middleware.use(request(), {} as any, jest.fn()),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('autoriza usuário e loja ativos com versão vigente', async () => {
    const { middleware } = setup();
    const req = request();
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.loja.id).toBe('loja-1');
  });
});

