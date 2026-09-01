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

  it('bloqueia insumos e compras sem a porta do módulo', async () => {
    const assertPode = jest.fn().mockRejectedValue(new ForbiddenException());
    const guard = criarGuard(assertPode);
    await expect(
      guard.canActivate(
        contexto('/insumos', { id: 'u1', loja_id: 'loja-1', funcao: 'VENDAS' }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guard.canActivate(
        contexto('/compras/pedidos', {
          id: 'u1',
          loja_id: 'loja-1',
          funcao: 'VENDAS',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guard.canActivate(
        contexto('/orcamentos-v2', {
          id: 'u1',
          loja_id: 'loja-1',
          funcao: 'VENDAS',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('não exige configuracoes.acessar em /lojas/me (sessão)', async () => {
    const assertPode = jest.fn();
    const guard = criarGuard(assertPode);
    await expect(
      guard.canActivate(
        contexto('/lojas/me', { id: 'u1', loja_id: 'loja-1', funcao: 'VENDAS' }),
      ),
    ).resolves.toBe(true);
    expect(assertPode).not.toHaveBeenCalled();
  });

  it('bloqueia /configuracoes/loja sem configuracoes.acessar', async () => {
    const assertPode = jest.fn().mockRejectedValue(new ForbiddenException());
    const guard = criarGuard(assertPode);
    await expect(
      guard.canActivate(
        contexto('/configuracoes/loja', {
          id: 'u1',
          loja_id: 'loja-1',
          funcao: 'VENDAS',
        }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(assertPode).toHaveBeenCalledWith(
      'u1',
      'loja-1',
      'configuracoes.acessar',
    );
  });

  it('bloqueia prefixos equivalentes a URL direta no browser', async () => {
    const assertPode = jest.fn().mockRejectedValue(new ForbiddenException());
    const guard = criarGuard(assertPode);
    const casos: Array<[string, string]> = [
      ['/financeiro', 'financeiro.acessar'],
      ['/estoque/itens', 'estoque.acessar'],
      ['/usuarios/perfis', 'usuarios.acessar'],
      ['/arte-aprovacao', 'arte.acessar'],
      ['/pcp/workflows', 'pcp.acessar'],
      ['/catalogo/estampas', 'catalogo.acessar'],
    ];
    for (const [path, permissao] of casos) {
      assertPode.mockClear();
      await expect(
        guard.canActivate(
          contexto(path, { id: 'u1', loja_id: 'loja-1', funcao: 'VENDAS' }),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(assertPode).toHaveBeenCalledWith('u1', 'loja-1', permissao);
    }
  });
});
