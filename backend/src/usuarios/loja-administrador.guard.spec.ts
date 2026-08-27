import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { LojaAdministradorGuard } from './guards/loja-administrador.guard';

function contexto(user: Record<string, unknown> | undefined) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any;
}

describe('LojaAdministradorGuard', () => {
  const guard = new LojaAdministradorGuard();

  it('nega usuário comum', () => {
    expect(() =>
      guard.canActivate(
        contexto({
          id: 'u1',
          loja_id: 'loja-1',
          funcao: usuario_funcao.VENDAS,
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  it('permite administrador da loja', () => {
    expect(
      guard.canActivate(
        contexto({
          id: 'u1',
          loja_id: 'loja-1',
          funcao: usuario_funcao.ADMINISTRADOR,
        }),
      ),
    ).toBe(true);
  });

  it('nega sessão sem identidade', () => {
    expect(() => guard.canActivate(contexto(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
