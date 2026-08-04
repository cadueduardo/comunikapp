import { usuario_funcao } from '@prisma/client';
import {
  DEFAULTS_CONCEDIDOS_FASE_2,
  NOMES_PERFIL_SISTEMA,
} from './vendas-permissoes';
import { seedVendasPerfisEPermissoes } from '../../../prisma/seed-vendas-rbac';

type EstadoFake = {
  lojas: { id: string }[];
  perfis: Array<{
    id: string;
    loja_id: string;
    nome: string;
    descricao?: string;
    ativo: boolean;
    sistema: boolean;
  }>;
  permissoes: Array<{
    id: string;
    perfil_id: string;
    modulo: string;
    acao: string;
    permitido: boolean;
  }>;
  usuarios: Array<{
    id: string;
    loja_id: string;
    status: string;
    ativo: boolean;
    funcao: usuario_funcao;
    perfis: { perfil_id: string }[];
  }>;
  vinculos: Array<{ usuario_id: string; perfil_id: string }>;
};

function criarPrismaSeedFake(estado: EstadoFake) {
  let seq = 1;
  const nextId = () => `id-${seq++}`;

  return {
    loja: {
      findMany: async () => estado.lojas,
    },
    perfil_acesso: {
      findUnique: async ({
        where,
      }: {
        where: { loja_id_nome: { loja_id: string; nome: string } };
      }) => {
        const { loja_id, nome } = where.loja_id_nome;
        return (
          estado.perfis.find((p) => p.loja_id === loja_id && p.nome === nome) ??
          null
        );
      },
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: { loja_id_nome: { loja_id: string; nome: string } };
        create: any;
        update: any;
      }) => {
        const { loja_id, nome } = where.loja_id_nome;
        const existente = estado.perfis.find(
          (p) => p.loja_id === loja_id && p.nome === nome,
        );
        if (existente) {
          Object.assign(existente, update);
          return { id: existente.id };
        }
        const id = nextId();
        estado.perfis.push({ id, ...create });
        return { id };
      },
    },
    perfil_permissao: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: {
          perfil_id_modulo_acao: {
            perfil_id: string;
            modulo: string;
            acao: string;
          };
        };
        create: any;
        update: any;
      }) => {
        const chave = where.perfil_id_modulo_acao;
        const existente = estado.permissoes.find(
          (p) =>
            p.perfil_id === chave.perfil_id &&
            p.modulo === chave.modulo &&
            p.acao === chave.acao,
        );
        if (existente) {
          Object.assign(existente, update);
          return existente;
        }
        const row = { id: nextId(), ...create };
        estado.permissoes.push(row);
        return row;
      },
    },
    usuario: {
      findMany: async ({ where }: { where: any }) =>
        estado.usuarios.filter(
          (u) =>
            u.loja_id === where.loja_id &&
            u.status === where.status &&
            u.ativo === where.ativo,
        ),
    },
    usuario_perfil: {
      create: async ({
        data,
      }: {
        data: { usuario_id: string; perfil_id: string };
      }) => {
        estado.vinculos.push(data);
        const u = estado.usuarios.find((x) => x.id === data.usuario_id);
        if (u) {
          u.perfis.push({ perfil_id: data.perfil_id });
        }
        return data;
      },
    },
  } as any;
}

describe('seedVendasPerfisEPermissoes (M2.1)', () => {
  it('é idempotente e não reabre permissão revogada', async () => {
    const estado: EstadoFake = {
      lojas: [{ id: 'loja-1' }],
      perfis: [],
      permissoes: [],
      usuarios: [
        {
          id: 'u-admin',
          loja_id: 'loja-1',
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.ADMINISTRADOR,
          perfis: [],
        },
        {
          id: 'u-vendas',
          loja_id: 'loja-1',
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.VENDAS,
          perfis: [],
        },
        {
          id: 'u-fin',
          loja_id: 'loja-1',
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.FINANCEIRO,
          perfis: [],
        },
        {
          id: 'u-prod',
          loja_id: 'loja-1',
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.PRODUCAO,
          perfis: [],
        },
      ],
      vinculos: [],
    };

    const prisma = criarPrismaSeedFake(estado);
    const r1 = await seedVendasPerfisEPermissoes(prisma);
    expect(r1.perfis_criados).toBe(4);
    expect(r1.vinculos_criados).toBe(3);
    expect(r1.usuarios_sem_associacao).toEqual([
      expect.objectContaining({
        usuario_id: 'u-prod',
        motivo: 'funcao_operacional_sem_acesso_comercial',
      }),
    ]);

    const vendedor = estado.perfis.find(
      (p) => p.nome === NOMES_PERFIL_SISTEMA.VENDEDOR,
    )!;
    expect(
      estado.permissoes.find(
        (p) =>
          p.perfil_id === vendedor.id &&
          p.acao === 'proposta.excluir' &&
          p.modulo === 'vendas',
      ),
    ).toBeUndefined();

    const finPerfil = estado.perfis.find(
      (p) => p.nome === NOMES_PERFIL_SISTEMA.FINANCEIRO,
    )!;
    const verFin = estado.permissoes.find(
      (p) =>
        p.perfil_id === finPerfil.id &&
        p.modulo === 'vendas' &&
        p.acao === 'proposta.ver',
    )!;
    verFin.permitido = false;

    const r2 = await seedVendasPerfisEPermissoes(prisma);
    expect(r2.perfis_criados).toBe(0);
    expect(r2.vinculos_criados).toBe(0);
    expect(verFin.permitido).toBe(false);
    expect(estado.permissoes.every((p) => p.modulo === 'vendas')).toBe(true);

    for (const chave of DEFAULTS_CONCEDIDOS_FASE_2.VENDEDOR) {
      const acao = chave.split('.').slice(1).join('.');
      expect(
        estado.permissoes.some(
          (p) =>
            p.perfil_id === vendedor.id &&
            p.modulo === 'vendas' &&
            p.acao === acao &&
            p.permitido,
        ),
      ).toBe(true);
    }

    const json = JSON.stringify(r1);
    expect(json).not.toMatch(/@/);
    expect(json).not.toMatch(/senha|password|token/i);
  });
});
