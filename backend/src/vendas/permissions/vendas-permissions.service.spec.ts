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
 * Prisma mínimo que honra o `where` e devolve decisões explícitas
 * (permitido true e false) para testar a precedência.
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

  describe('precedência de autorização', () => {
    it('negação explícita permitido=false prevalece sobre piso VENDAS', async () => {
      const usuarios = [
        usuario('vendedor', usuario_funcao.VENDAS, [
          {
            nome: 'Revoga ver',
            ativo: true,
            permissoes: [
              { modulo: 'vendas', acao: 'proposta.ver', permitido: false },
            ],
          },
        ]),
      ];
      const svc = new VendasPermissionsService(criarPrismaFake(usuarios));

      // Piso concederia proposta.ver; negação explícita deve vencer.
      await expect(
        svc.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
      await expect(
        svc.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      ).resolves.toBe(false);
    });

    it('perfil ativo concede além do piso', async () => {
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
    });

    it('perfil ativo não herda o restante do piso da função', async () => {
      const restrito = new VendasPermissionsService(
        criarPrismaFake([
          usuario('vendedor', usuario_funcao.VENDAS, [
            {
              nome: 'Restrito',
              ativo: true,
              permissoes: [
                { modulo: 'vendas', acao: 'proposta.ver', permitido: true },
              ],
            },
          ]),
        ]),
      );
      await expect(
        restrito.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);
      await expect(
        restrito.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      ).resolves.toBe(false);
      await expect(
        restrito.pode(
          'vendedor',
          LOJA_A,
          VENDAS_PERMISSOES.CARTEIRA_VER_TODOS,
        ),
      ).resolves.toBe(false);
    });

    it('sem perfil, piso VENDAS concede ver e nega excluir', async () => {
      await expect(
        service.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);
      await expect(
        service.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(false);
    });

    it('função desconhecida nega sem concessão explícita', async () => {
      const desconhecido = new VendasPermissionsService(
        criarPrismaFake([usuario('x', 'FUNCAO_FANTASMA' as usuario_funcao)]),
      );
      await expect(
        desconhecido.pode('x', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('ADMINISTRADOR faz bypass mantendo tenant', async () => {
      await expect(
        service.pode('admin', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(true);
      const outraLoja = new VendasPermissionsService(
        criarPrismaFake([
          usuario('admin', usuario_funcao.ADMINISTRADOR, [], LOJA_B),
        ]),
      );
      await expect(
        outraLoja.pode('admin', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });

    it('não concede bypass só pelo nome textual Administrador', async () => {
      const falsoAdmin = new VendasPermissionsService(
        criarPrismaFake([
          usuario('vendas', usuario_funcao.VENDAS, [
            {
              nome: 'Administrador',
              ativo: true,
              permissoes: [],
            },
          ]),
        ]),
      );
      await expect(
        falsoAdmin.pode('vendas', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(false);
      await expect(
        falsoAdmin.pode('vendas', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });
  });

  describe('piso por função', () => {
    it('vendedor opera a proposta de ponta a ponta', async () => {
      for (const permissao of DEFAULTS_CONCEDIDOS_FASE_2.VENDEDOR) {
        await expect(service.pode('vendedor', LOJA_A, permissao)).resolves.toBe(
          true,
        );
      }
    });

    it('vendedor não exclui nem acessa módulo financeiro', async () => {
      await expect(
        service.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(false);
      await expect(
        service.pode('vendedor', LOJA_A, 'financeiro.cobranca.ver'),
      ).resolves.toBe(false);
    });

    it('gestor via perfil exclui e reabre', async () => {
      await expect(
        service.pode('gestor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(true);
      await expect(
        service.pode('gestor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_REABRIR),
      ).resolves.toBe(true);
    });

    it('financeiro apenas lê', async () => {
      await expect(
        service.pode('financeiro', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);
      await expect(
        service.pode('financeiro', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      ).resolves.toBe(false);
    });

    it('produção e estoque sem acesso comercial', async () => {
      for (const id of ['producao', 'estoque']) {
        await expect(
          service.pode(id, LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
        ).resolves.toBe(false);
      }
    });
  });

  describe('revogação com VENDAS (defeito coberto)', () => {
    it('revogar permitido=false remove acesso do piso funcional', async () => {
      const usuarios = [
        usuario('vendedor', usuario_funcao.VENDAS, [
          {
            nome: 'Ajuste',
            ativo: true,
            permissoes: [
              { modulo: 'vendas', acao: 'proposta.enviar', permitido: true },
            ],
          },
        ]),
      ];
      const svc = new VendasPermissionsService(criarPrismaFake(usuarios));
      await expect(
        svc.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_ENVIAR),
      ).resolves.toBe(true);

      usuarios[0].perfis[0].permissoes[0].permitido = false;
      // Sem cache: reavaliação imediata.
      await expect(
        svc.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_ENVIAR),
      ).resolves.toBe(false);
    });
  });

  describe('sem cache — reavaliação imediata', () => {
    it('usuário inativado deixa de passar após mudança no banco fake', async () => {
      const usuarios = [usuario('vendedor', usuario_funcao.VENDAS)];
      const svc = new VendasPermissionsService(criarPrismaFake(usuarios));
      await expect(
        svc.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);
      usuarios[0].ativo = false;
      await expect(
        svc.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
    });
  });

  describe('isolamento entre lojas', () => {
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
    });

    it('nega usuário inexistente', async () => {
      await expect(
        service.pode('fantasma', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(false);
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
      ).rejects.toBeInstanceOf(ForbiddenException);
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
    });
  });

  describe('frontend nunca autoriza', () => {
    it('MAPA_USER_ROLE é só compatibilidade', () => {
      expect(MAPA_USER_ROLE_PARA_FUNCAO.vendedor).toBe(usuario_funcao.VENDAS);
      expect(MAPA_USER_ROLE_PARA_FUNCAO.gerente).toBe(usuario_funcao.VENDAS);
    });

    it('catálogo listado não implica concessão', () => {
      const catalogo = listarCatalogoVendas();
      expect(catalogo.length).toBeGreaterThanOrEqual(31);
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
