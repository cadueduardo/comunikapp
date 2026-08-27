import { usuario_funcao } from '@prisma/client';
import { PermissaoEfetivaService } from './permissao-efetiva.service';
import { PrismaService } from '../../prisma/prisma.service';
import { listarManifestos } from '../catalogo/agregador';

interface PerfilFake {
  ativo: boolean;
  permissoes: { modulo: string; acao: string; permitido: boolean }[];
}

interface UsuarioFake {
  id: string;
  loja_id: string;
  status: string;
  ativo: boolean;
  funcao: usuario_funcao;
  perfis: PerfilFake[];
}

function criarPrismaFake(usuarios: UsuarioFake[]): PrismaService {
  const findFirst = jest.fn((args: any) => {
    const filtro = args.where;
    const usuario = usuarios.find(
      (candidato) =>
        candidato.id === filtro.id &&
        candidato.loja_id === filtro.loja_id &&
        candidato.status === filtro.status &&
        candidato.ativo === filtro.ativo,
    );
    if (!usuario) {
      return Promise.resolve(null);
    }
    return Promise.resolve({
      funcao: usuario.funcao,
      perfis: usuario.perfis.map((perfil) => ({
        perfil: {
          ativo: perfil.ativo,
          permissoes: perfil.permissoes.map((permissao) => ({
            modulo: permissao.modulo,
            acao: permissao.acao,
            permitido: permissao.permitido,
          })),
        },
      })),
    });
  });
  return {
    usuario: { findFirst },
  } as unknown as PrismaService;
}

describe('PermissaoEfetivaService', () => {
  const lojaA = 'loja-a';
  const lojaB = 'loja-b';

  function svc(usuarios: UsuarioFake[]) {
    return new PermissaoEfetivaService(criarPrismaFake(usuarios));
  }

  function usuario(
    id: string,
    funcao: usuario_funcao,
    perfis: PerfilFake[] = [],
    lojaId = lojaA,
  ): UsuarioFake {
    return {
      id,
      loja_id: lojaId,
      status: 'ATIVO',
      ativo: true,
      funcao,
      perfis,
    };
  }

  it('nega permissão desconhecida', async () => {
    const service = svc([usuario('u1', usuario_funcao.ADMINISTRADOR)]);
    await expect(service.pode('u1', lojaA, 'inventado.foo.bar')).resolves.toBe(
      false,
    );
  });

  it('administrador da loja recebe bypass', async () => {
    const service = svc([usuario('admin', usuario_funcao.ADMINISTRADOR)]);
    await expect(
      service.pode('admin', lojaA, 'usuarios.perfis.gerenciar'),
    ).resolves.toBe(true);
  });

  it('não vaza entre lojas', async () => {
    const service = svc([usuario('admin', usuario_funcao.ADMINISTRADOR)]);
    await expect(
      service.pode('admin', lojaB, 'usuarios.usuarios.gerenciar'),
    ).resolves.toBe(false);
  });

  it('perfil inativo não concede', async () => {
    const service = svc([
      usuario('vendas', usuario_funcao.VENDAS, [
        {
          ativo: false,
          permissoes: [
            { modulo: 'usuarios', acao: 'usuarios.gerenciar', permitido: true },
          ],
        },
      ]),
    ]);
    await expect(
      service.pode('vendas', lojaA, 'usuarios.usuarios.gerenciar'),
    ).resolves.toBe(false);
  });

  it('deny explícito vence o piso', async () => {
    const service = svc([
      usuario('vendas', usuario_funcao.VENDAS, [
        {
          ativo: true,
          permissoes: [{ modulo: 'vendas', acao: 'acessar', permitido: false }],
        },
      ]),
    ]);
    await expect(service.pode('vendas', lojaA, 'vendas.acessar')).resolves.toBe(
      false,
    );
  });

  it('ausência de decisão usa o piso da função', async () => {
    const service = svc([usuario('vendas', usuario_funcao.VENDAS)]);
    await expect(service.pode('vendas', lojaA, 'vendas.acessar')).resolves.toBe(
      true,
    );
    await expect(
      service.pode('vendas', lojaA, 'usuarios.usuarios.gerenciar'),
    ).resolves.toBe(false);
  });

  it('grant explícito concede em perfil customizado', async () => {
    const service = svc([
      usuario('vendas', usuario_funcao.VENDAS, [
        {
          ativo: true,
          permissoes: [
            { modulo: 'usuarios', acao: 'usuarios.gerenciar', permitido: true },
          ],
        },
      ]),
    ]);
    await expect(
      service.pode('vendas', lojaA, 'usuarios.usuarios.gerenciar'),
    ).resolves.toBe(true);
  });

  it('usuário sem perfil não recebe permissão administrativa', async () => {
    const service = svc([usuario('vendas', usuario_funcao.VENDAS)]);
    await expect(
      service.pode('vendas', lojaA, 'usuarios.perfis.gerenciar'),
    ).resolves.toBe(false);
  });

  it('listarAcessoModulos carrega o usuário uma vez e não exige usuarios.acessar', async () => {
    const prisma = criarPrismaFake([usuario('vendas', usuario_funcao.VENDAS)]);
    const service = new PermissaoEfetivaService(prisma);
    const findFirst = prisma.usuario.findFirst as jest.Mock;

    const flags = await service.listarAcessoModulos('vendas', lojaA);

    expect(findFirst).toHaveBeenCalledTimes(1);
    const chaves = listarManifestos().map((modulo) => modulo.chave);
    expect(Object.keys(flags).sort()).toEqual([...chaves].sort());
    expect(flags.vendas).toBe(true);
    expect(flags.usuarios).toBe(false);
    expect(flags.dashboard).toBe(true);
  });

  it('listarAcessoModulos nega todos os módulos se o usuário não estiver ativo na loja', async () => {
    const service = svc([]);
    const flags = await service.listarAcessoModulos('ausente', lojaA);
    expect(Object.values(flags).every((flag) => flag === false)).toBe(true);
    expect(flags.usuarios).toBe(false);
  });
});
