import { usuario_funcao } from '@prisma/client';
import {
  DEFAULTS_CONCEDIDOS_FASE_2,
  DEFAULTS_CONCEDIDOS_FASE_5,
  NOMES_PERFIL_SISTEMA,
  VENDAS_PERMISSOES,
} from './vendas-permissoes';
import {
  SeedVendasColisaoError,
  seedVendasPerfisEPermissoes,
} from '../../../prisma/seed-vendas-rbac';

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

  const api: any = {
    loja: {
      findMany: async () => estado.lojas,
    },
    perfil_acesso: {
      findMany: async ({ where }: { where: any }) => {
        return estado.perfis.filter((p) => {
          if (where.loja_id && p.loja_id !== where.loja_id) return false;
          if (where.sistema === false && p.sistema !== false) return false;
          if (where.nome?.in && !where.nome.in.includes(p.nome)) return false;
          return true;
        });
      },
      create: async ({ data, select }: any) => {
        const id = nextId();
        estado.perfis.push({ id, ...data });
        return select?.id ? { id } : { id, ...data };
      },
      update: async ({ where, data }: any) => {
        const p = estado.perfis.find((x) => x.id === where.id)!;
        Object.assign(p, data);
        return p;
      },
    },
    perfil_permissao: {
      upsert: async ({ where, create, update }: any) => {
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
      create: async ({ data }: any) => {
        estado.vinculos.push(data);
        const u = estado.usuarios.find((x) => x.id === data.usuario_id);
        if (u) u.perfis.push({ perfil_id: data.perfil_id });
        return data;
      },
    },
    $transaction: async (fn: (tx: any) => Promise<void>) => fn(api),
  };

  return api;
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
          p.perfil_id === vendedor.id && p.acao === 'proposta.excluir',
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

    for (const chave of DEFAULTS_CONCEDIDOS_FASE_2.VENDEDOR) {
      const acao = chave.split('.').slice(1).join('.');
      expect(
        estado.permissoes.some(
          (p) =>
            p.perfil_id === vendedor.id &&
            p.acao === acao &&
            p.permitido,
        ),
      ).toBe(true);
    }

    // Fase 5: seed 2× preserva ATIVIDADE_* no vendedor; Financeiro sem atividade.
    for (const chave of DEFAULTS_CONCEDIDOS_FASE_5.VENDEDOR) {
      const acao = chave.split('.').slice(1).join('.');
      expect(
        estado.permissoes.some(
          (p) =>
            p.perfil_id === vendedor.id &&
            p.acao === acao &&
            p.permitido,
        ),
      ).toBe(true);
    }
    expect(
      estado.permissoes.some(
        (p) =>
          p.perfil_id === finPerfil.id &&
          p.acao === 'atividade.ver.propria' &&
          p.permitido,
      ),
    ).toBe(false);
    expect(VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA).toBe(
      'vendas.atividade.ver.propria',
    );

    expect(JSON.stringify(r1)).not.toMatch(/@/);
  });

  it('aborta com relatório sanitizado em colisão de nome customizado', async () => {
    const estado: EstadoFake = {
      lojas: [{ id: 'loja-1' }],
      perfis: [
        {
          id: 'custom-1',
          loja_id: 'loja-1',
          nome: NOMES_PERFIL_SISTEMA.VENDEDOR,
          ativo: true,
          sistema: false,
        },
      ],
      permissoes: [],
      usuarios: [],
      vinculos: [],
    };

    await expect(
      seedVendasPerfisEPermissoes(criarPrismaSeedFake(estado)),
    ).rejects.toBeInstanceOf(SeedVendasColisaoError);

    try {
      await seedVendasPerfisEPermissoes(criarPrismaSeedFake(estado));
    } catch (erro) {
      const e = erro as SeedVendasColisaoError;
      expect(e.relatorio.colisoes).toEqual([
        expect.objectContaining({
          perfil_id: 'custom-1',
          nome: NOMES_PERFIL_SISTEMA.VENDEDOR,
          motivo: 'nome_sistema_ocupado_por_perfil_customizado',
        }),
      ]);
      expect(JSON.stringify(e.relatorio)).not.toMatch(/@|senha|token/i);
    }

    // Não mutou (nenhum perfil sistema criado).
    expect(estado.perfis).toHaveLength(1);
    expect(estado.permissoes).toHaveLength(0);
  });

  it('não reativa perfil de sistema inativo', async () => {
    const estado: EstadoFake = {
      lojas: [{ id: 'loja-1' }],
      perfis: [
        {
          id: 'vend-off',
          loja_id: 'loja-1',
          nome: NOMES_PERFIL_SISTEMA.VENDEDOR,
          ativo: false,
          sistema: true,
        },
      ],
      permissoes: [],
      usuarios: [
        {
          id: 'u-v',
          loja_id: 'loja-1',
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.VENDAS,
          perfis: [],
        },
      ],
      vinculos: [],
    };

    const r = await seedVendasPerfisEPermissoes(criarPrismaSeedFake(estado));
    expect(estado.perfis.find((p) => p.id === 'vend-off')!.ativo).toBe(false);
    expect(r.perfis_inalterados_inativos).toBeGreaterThanOrEqual(1);
    expect(estado.vinculos).toHaveLength(0);
  });
});
