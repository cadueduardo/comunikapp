import { ForbiddenException } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from './vendas-permissions.service';
import { VENDAS_PERMISSOES, separarModuloEAcao } from './vendas-permissoes';

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
  funcao: usuario_funcao;
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
  funcao: usuario_funcao,
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

describe('VendasPermissionsService', () => {
  const base = [
    usuario('admin', usuario_funcao.ADMINISTRADOR),
    usuario('vendedor', usuario_funcao.VENDAS),
    usuario('financeiro', usuario_funcao.FINANCEIRO),
    usuario('producao', usuario_funcao.PRODUCAO),
    usuario('estoque', usuario_funcao.ESTOQUE),
  ];

  const service = new VendasPermissionsService(criarPrismaFake(base));

  describe('piso por função', () => {
    it('administrador pode inclusive excluir proposta', async () => {
      await expect(
        service.pode('admin', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(true);
    });

    it('vendedor opera a proposta de ponta a ponta', async () => {
      for (const permissao of [
        VENDAS_PERMISSOES.PROPOSTA_VER,
        VENDAS_PERMISSOES.PROPOSTA_CRIAR,
        VENDAS_PERMISSOES.PROPOSTA_EDITAR,
        VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
        VENDAS_PERMISSOES.PROPOSTA_ACEITE_REGISTRAR,
      ]) {
        await expect(service.pode('vendedor', LOJA_A, permissao)).resolves.toBe(
          true,
        );
      }
    });

    it('vendedor não exclui proposta', async () => {
      await expect(
        service.pode('vendedor', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_EXCLUIR),
      ).resolves.toBe(false);
    });

    it('financeiro apenas lê', async () => {
      await expect(
        service.pode('financeiro', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_VER),
      ).resolves.toBe(true);
      await expect(
        service.pode('financeiro', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
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
  });

  describe('perfil_permissao complementa o piso', () => {
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
  });

  describe('assertPode', () => {
    it('não lança quando permitido', async () => {
      await expect(
        service.assertPode('admin', LOJA_A, VENDAS_PERMISSOES.PROPOSTA_CRIAR),
      ).resolves.toBeUndefined();
    });

    it('lança ForbiddenException quando negado', async () => {
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
