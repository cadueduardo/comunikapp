import { usuario_funcao } from '@prisma/client';
import { PermissaoEfetivaService } from './permissao-efetiva.service';
import { PrismaService } from '../../prisma/prisma.service';

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
  return {
    usuario: {
      findFirst: (args: any) => {
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
        const filtroPermissao =
          args.select.perfis.select.perfil.select.permissoes.where;
        return Promise.resolve({
          funcao: usuario.funcao,
          perfis: usuario.perfis.map((perfil) => ({
            perfil: {
              ativo: perfil.ativo,
              permissoes: perfil.permissoes
                .filter(
                  (permissao) =>
                    permissao.modulo === filtroPermissao.modulo &&
                    permissao.acao === filtroPermissao.acao,
                )
                .map((permissao) => ({ permitido: permissao.permitido })),
            },
          })),
        });
      },
    },
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
});
