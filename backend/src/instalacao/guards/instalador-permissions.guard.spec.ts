import { ForbiddenException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common/interfaces';
import { InstaladorPermissionsGuard } from './instalador-permissions.guard';

describe('InstaladorPermissionsGuard', () => {
  const guard = new InstaladorPermissionsGuard();

  const criarContexto = (funcao?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: funcao ? { funcao } : undefined }),
      }),
    }) as ExecutionContext;

  it('permite ADMINISTRADOR e PRODUCAO', () => {
    expect(guard.canActivate(criarContexto('ADMINISTRADOR'))).toBe(true);
    expect(guard.canActivate(criarContexto('PRODUCAO'))).toBe(true);
  });

  it('nega VENDAS e FINANCEIRO', () => {
    expect(() => guard.canActivate(criarContexto('VENDAS'))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(criarContexto('FINANCEIRO'))).toThrow(
      ForbiddenException,
    );
  });
});
