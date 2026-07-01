import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { FinanceiroPermissionsGuard } from './financeiro-permissions.guard';

describe('FinanceiroPermissionsGuard', () => {
  const guard = new FinanceiroPermissionsGuard();

  function contextoComFuncao(funcao?: string): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: funcao ? { funcao } : {} }),
      }),
    } as ExecutionContext;
  }

  it('permite ADMINISTRADOR e FINANCEIRO', () => {
    expect(guard.canActivate(contextoComFuncao('ADMINISTRADOR'))).toBe(true);
    expect(guard.canActivate(contextoComFuncao('financeiro'))).toBe(true);
  });

  it('bloqueia VENDAS e perfis não financeiros', () => {
    expect(() => guard.canActivate(contextoComFuncao('VENDAS'))).toThrow(
      ForbiddenException,
    );
    expect(() => guard.canActivate(contextoComFuncao('INSTALADOR'))).toThrow(
      ForbiddenException,
    );
  });
});
