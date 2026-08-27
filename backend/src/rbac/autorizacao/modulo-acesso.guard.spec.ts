import { ForbiddenException } from '@nestjs/common';
import { ModuloAcessoGuard } from './modulo-acesso.guard';
import { PermissaoEfetivaService } from './permissao-efetiva.service';

describe('ModuloAcessoGuard', () => {
  function criarGuard(pode: jest.Mock) {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };
    const permissaoEfetiva = {
      assertPode: pode,
    } as unknown as PermissaoEfetivaService;
    return new ModuloAcessoGuard(reflector as any, permissaoEfetiva);
  }

  function contexto(path: string, user?: { id: string; loja_id: string; funcao: string }) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          path,
          url: path,
          user,
        }),
      }),
    } as any;
  }

  it('bloqueia prefixo de módulo sem permissão-base', async () => {
    const assertPode = jest.fn().mockRejectedValue(new ForbiddenException());
    const guard = criarGuard(assertPode);
    await expect(
      guard.canActivate(
        contexto('/os', { id: 'u1', loja_id: 'loja-1', funcao: 'VENDAS' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assertPode).toHaveBeenCalledWith('u1', 'loja-1', 'os.acessar');
  });

  it('libera autoatendimento /usuarios/me', async () => {
    const assertPode = jest.fn();
    const guard = criarGuard(assertPode);
    await expect(
      guard.canActivate(
        contexto('/usuarios/me/acesso', { id: 'u1', loja_id: 'loja-1', funcao: 'VENDAS' }),
      ),
    ).resolves.toBe(true);
    expect(assertPode).not.toHaveBeenCalled();
  });

  it('libera GET /api/usuarios/me/acesso usado no carregamento da navegação', async () => {
    const assertPode = jest.fn();
    const guard = criarGuard(assertPode);
    await expect(
      guard.canActivate(
        contexto('/api/usuarios/me/acesso', {
          id: 'u1',
          loja_id: 'loja-1',
          funcao: 'VENDAS',
        }),
      ),
    ).resolves.toBe(true);
    expect(assertPode).not.toHaveBeenCalled();
  });

  it('ainda exige a porta do módulo quando o proxy envia /api', async () => {
    const assertPode = jest.fn().mockRejectedValue(new ForbiddenException());
    const guard = criarGuard(assertPode);
    await expect(
      guard.canActivate(
        contexto('/api/os', { id: 'u1', loja_id: 'loja-1', funcao: 'VENDAS' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assertPode).toHaveBeenCalledWith('u1', 'loja-1', 'os.acessar');
  });
});
