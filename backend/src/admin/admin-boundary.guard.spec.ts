import { Reflector } from '@nestjs/core';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminBoundaryGuard } from './admin-boundary.guard';

function context(path: string) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ path }),
    }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as any;
}

describe('AdminBoundaryGuard', () => {
  afterEach(() => jest.restoreAllMocks());

  it('não interfere em rotas que não pertencem à Gestão', () => {
    const reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;
    const guard = new AdminBoundaryGuard(reflector);
    const authSpy = jest.spyOn(
      AdminAuthGuard.prototype,
      'canActivate',
    );

    expect(guard.canActivate(context('/clientes'))).toBe(true);
    expect(authSpy).not.toHaveBeenCalled();
  });

  it('exige autenticação por padrão em qualquer rota administrativa', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as Reflector;
    const guard = new AdminBoundaryGuard(reflector);
    const authSpy = jest
      .spyOn(AdminAuthGuard.prototype, 'canActivate')
      .mockReturnValue(true);

    expect(guard.canActivate(context('/admin/v1/stores'))).toBe(true);
    expect(authSpy).toHaveBeenCalledTimes(1);
  });

  it('libera somente endpoint marcado explicitamente como público', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(true),
    } as unknown as Reflector;
    const guard = new AdminBoundaryGuard(reflector);
    const authSpy = jest.spyOn(
      AdminAuthGuard.prototype,
      'canActivate',
    );

    expect(guard.canActivate(context('/admin/v1/auth/login'))).toBe(
      true,
    );
    expect(authSpy).not.toHaveBeenCalled();
  });
});

