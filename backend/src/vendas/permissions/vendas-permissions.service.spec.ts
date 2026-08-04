import { ForbiddenException } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from './vendas-permissions.service';
import {
  DEFAULTS_CONCEDIDOS_FASE_2,
  MAPA_USER_ROLE_PARA_FUNCAO,
  NOMES_PERFIL_SISTEMA,
  VENDAS_PERMISSOES,
  listarCatalogoVendas,
  separarModuloEAcao,
} from './vendas-permissoes';

interface PerfilFake {
  nome: string;
  ativo: boolean;
  permissoes: { modulo: string; acao: string; permitido: boolean }[];
}

interface UsuarioFake {
  id: string;
  loja_id: string;
  status: string;
  ativo: boolean;
  funcao: usuario_funcao | string;
  perfis: PerfilFake[];
}

/**
 * Prisma mínimo que honra o `where` e o filtro de permissões usado pelo
 * service, para que o teste falhe caso o escopo por loja seja removido.
 */
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
              nome: perfil.nome,
              ativo: perfil.ativo,
              permissoes: perfil.permissoes
                .filter(
                  (permissao) =>
                    permissao.modulo === filtroPermissao.modulo &&
                    permissao.acao === filtroPermissao.acao &&
                    permissao.permitido === filtroPermissao.permitido,
                )
                .map(() => ({ id: 'permissao-fake' })),
            },
          })),
        });
      },
    },
  } as unknown as PrismaService;
}

const LOJA_A = 'loja-a';
const LOJA_B = 'loja-b';

function usuario(
  id: string,
  funcao: usuario_funcao | string,
  perfis: PerfilFake[] = [],
  lojaId = LOJA_A,
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

function perfilGestor(): PerfilFake {
  return {
    nome: NOMES_PERFIL_SISTEMA.GESTOR,
    ativo: true,
    permissoes: DEFAULTS_CONCEDIDOS_FASE_2.GESTOR.map((chave) => {
      const { modulo, acao } = separarModuloEAcao(chave);
      return { modulo, acao, permitido: true };
    }),
  };
}

describe('VendasPermissionsService', () => {
  const base = [
    usuario('admin', usuario_funcao.ADMINISTRADOR),
    usuario('vendedor', usuario_funcao.VENDAS),
    usuario('financeiro', usuario_funcao.FINANCEIRO),
    usuario('producao', usuario_funcao.PRODUCAO),
    usuario('estoque', usuario_funcao.ESTOQUE),
    usuario('gestor', usuario_funcao.VENDAS, [perfilGestor()]),
  ];

  const service = new VendasPermissionsService(criarPrismaFake(base));

  describe('piso por função', () => {
    it('administrador pode inclusive excluir proposta', async () => {
      await expect(
        service.pode('admin', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(true);
    });

    it('vendedor opera a proposta de ponta a ponta', async () => {
      for (const permissao of DEFAULTS_CONCEDIDOS_FASE_2.VENDEDOR) {
        await expect(service.pode('vendedor', LOJA_A, permissao)).resolves.toBe(
          true,
        );
      }
    });

    it('vendedor não exclui proposta nem acessa módulo financeiro', async () => {
      await expect(
        service.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(false);
      await expect(
        service.pode('vendedor', LOJA_A, 'financeiro.cobranca.ver'),
      ).resolves.toBe(false);
    });

    it('gestor via perfil exclui e reabre; vendedor puro não', async () => {
      await expect(
        service.pode('gestor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(true);
      await expect(
        service.pode('gestor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_REABRIR),
      ).resolves.toBe(true);
      await expect(
        service.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_REABRIR),
      ).resolves.toBe(false);
    });

    it('financeiro apenas lê', async () => {
      await expect(
        service.pode('financeiro', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);
      await expect(
        service.pode('financeiro', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      ).resolves.toBe(false);
      await expect(
        service.pode('financeiro', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EDITAR),
      ).resolves.toBe(false);
    });

    it('produção e estoque não têm acesso comercial', async () => {
      for (const id of ['producao', 'estoque']) {
        await expect(
          service.pode(id, LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
        ).resolves.toBe(false);
        await expect(
          service.pode(
            id,
            LOJA_A,
            VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR,
          ),
        ).resolves.toBe(false);
      }
    });

    it('função desconhecida nega por padrão', async () => {
      const desconhecido = new VendasPermissionsService(
        criarPrismaFake([usuario('x', 'FUNCAO_FANTASMA' as usuario_funcao)]),
      );
      await expect(
        desconhecido.pode('x', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('usuário sem perfil e sem piso funcional nega', async () => {
      const semPerfil = new VendasPermissionsService(
        criarPrismaFake([usuario('op', usuario_funcao.PRODUCAO)]),
      );
      await expect(
        semPerfil.pode('op', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });
  });

  describe('perfil_permissao concede e revoga', () => {
    it('concede ação que a função sozinha negaria', async () => {
      const comPerfil = new VendasPermissionsService(
        criarPrismaFake([
          usuario('producao', usuario_funcao.PRODUCAO, [
            {
              nome: 'Consulta comercial',
              ativo: true,
              permissoes: [
                { modulo: 'vendas', acao: 'proposta.ver', permitido: true },
              ],
            },
          ]),
        ]),
      );

      await expect(
        comPerfil.pode('producao', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);
      await expect(
        comPerfil.pode('producao', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      ).resolves.toBe(false);
    });

    it('revogar permitido=false remove o acesso do perfil', async () => {
      const usuarios = [
        usuario('producao', usuario_funcao.PRODUCAO, [
          {
            nome: 'Consulta comercial',
            ativo: true,
            permissoes: [
              { modulo: 'vendas', acao: 'proposta.ver', permitido: true },
            ],
          },
        ]),
      ];
      const comPerfil = new VendasPermissionsService(criarPrismaFake(usuarios));
      await expect(
        comPerfil.pode('producao', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);

      usuarios[0].perfis[0].permissoes[0].permitido = false;
      comPerfil.invalidarCacheUsuario('producao', LOJA_A);
      await expect(
        comPerfil.pode('producao', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('ignora perfil inativo', async () => {
      const comPerfilInativo = new VendasPermissionsService(
        criarPrismaFake([
          usuario('producao', usuario_funcao.PRODUCAO, [
            {
              nome: 'Consulta comercial',
              ativo: false,
              permissoes: [
                { modulo: 'vendas', acao: 'proposta.ver', permitido: true },
              ],
            },
          ]),
        ]),
      );

      await expect(
        comPerfilInativo.pode(
          'producao',
          LOJA_A,
          VENDAS_PERMISSOES.PROPOSTA_VER,
        ),
      ).resolves.toBe(false);
    });
  });

  describe('cache', () => {
    it('invalidarCacheUsuario força reavaliação após mudança', async () => {
      const usuarios = [
        usuario('producao', usuario_funcao.PRODUCAO, [
          {
            nome: 'Consulta',
            ativo: true,
            permissoes: [
              { modulo: 'vendas', acao: 'proposta.ver', permitido: true },
            ],
          },
        ]),
      ];
      const svc = new VendasPermissionsService(criarPrismaFake(usuarios));

      await expect(
        svc.pode('producao', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);

      usuarios[0].perfis = [];
      // Sem invalidar, cache ainda permite
      await expect(
        svc.pode('producao', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);

      svc.invalidarCacheUsuario('producao', LOJA_A);
      await expect(
        svc.pode('producao', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('invalidarCacheLoja limpa todos os usuários da loja', async () => {
      const usuarios = [
        usuario('a', usuario_funcao.PRODUCAO, [
          {
            nome: 'Consulta',
            ativo: true,
            permissoes: [
              { modulo: 'vendas', acao: 'proposta.ver', permitido: true },
            ],
          },
        ]),
      ];
      const svc = new VendasPermissionsService(criarPrismaFake(usuarios));
      await svc.pode('a', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER);
      usuarios[0].perfis = [];
      svc.invalidarCacheLoja(LOJA_A);
      await expect(
        svc.pode('a', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });
  });

  describe('isolamento entre lojas e sessões revogadas', () => {
    it('nega usuário de outra loja mesmo sendo administrador', async () => {
      const outraLoja = new VendasPermissionsService(
        criarPrismaFake([
          usuario('admin', usuario_funcao.ADMINISTRADOR, [], LOJA_B),
        ]),
      );

      await expect(
        outraLoja.pode('admin', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('nega usuário inativo', async () => {
      const inativo = new VendasPermissionsService(
        criarPrismaFake([
          { ...usuario('vendedor', usuario_funcao.VENDAS), ativo: false },
        ]),
      );

      await expect(
        inativo.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('nega usuário inexistente', async () => {
      await expect(
        service.pode('fantasma', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('dois tenants: admin da loja A não autoriza na loja B', async () => {
      const multi = new VendasPermissionsService(
        criarPrismaFake([
          usuario('admin-a', usuario_funcao.ADMINISTRADOR, [], LOJA_A),
          usuario('admin-b', usuario_funcao.ADMINISTRADOR, [], LOJA_B),
        ]),
      );
      await expect(
        multi.pode('admin-a', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(true);
      await expect(
        multi.pode('admin-a', LOJA_B, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(false);
      await expect(
        multi.pode('admin-b', LOJA_B, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(true);
    });
  });

  describe('assertPode', () => {
    it('não lança quando permitido', async () => {
      await expect(
        service.assertPode('admin', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      ).resolves.toBeUndefined();
    });

    it('lança ForbiddenException genérica (sem enumeração)', async () => {
      await expect(
        service.assertPode(
          'producao',
          LOJA_A,
          VENDAS_PERMISSOES.PROPOSTA_CRIAR,
        ),
      ).rejects.toMatchObject({
        response: {
          message: 'Você não tem permissão para executar esta ação.',
        },
      });
      await expect(
        service.assertPode(
          'producao',
          LOJA_A,
          VENDAS_PERMISSOES.PROPOSTA_CRIAR,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('assertPodeQualquer aceita uma das permissões', async () => {
      await expect(
        service.assertPodeQualquer('financeiro', LOJA_A, [
          VENDAS_PERMISSOES.PROPOSTA_CRIAR,
          VENDAS_PERMISSOES.PROPOSTA_VER,
        ]),
      ).resolves.toBeUndefined();
    });
  });

  describe('frontend nunca autoriza', () => {
    it('MAPA_USER_ROLE_PARA_FUNCAO é só compatibilidade — não concede sozinho', () => {
      expect(MAPA_USER_ROLE_PARA_FUNCAO.vendedor).toBe(usuario_funcao.VENDAS);
      expect(MAPA_USER_ROLE_PARA_FUNCAO.gerente).toBe(usuario_funcao.VENDAS);
      // Sem consulta ao service/banco, papel legado não prova autorização.
      expect(typeof MAPA_USER_ROLE_PARA_FUNCAO.admin).toBe('string');
    });

    it('catálogo listado não implica concessão', () => {
      const catalogo = listarCatalogoVendas();
      expect(catalogo.length).toBeGreaterThanOrEqual(31);
      expect(catalogo).toContain(VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA);
      // Carteira está no catálogo mas fora do default do vendedor nesta fase.
      expect(DEFAULTS_CONCEDIDOS_FASE_2.VENDEDOR).not.toContain(
        VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA,
      );
    });
  });
});

describe('separarModuloEAcao', () => {
  it('separa módulo e ação composta', () => {
    expect(separarModuloEAcao('vendas.proposta.aceite.registrar')).toEqual({
      modulo: 'vendas',
      acao: 'proposta.aceite.registrar',
    });
  });

  it('rejeita permissão sem ação', () => {
    expect(() => separarModuloEAcao('vendas')).toThrow();
  });
});
