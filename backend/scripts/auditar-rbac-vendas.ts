/**
 * Auditoria pré-M2.1 — relatório sanitizado (sem e-mail, CPF, tokens).
 * Uso: npx ts-node scripts/auditar-rbac-vendas.ts
 */
import { PrismaClient, usuario_funcao } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const funcoes = Object.values(usuario_funcao);

  const [
    totalUsuarios,
    usuariosAtivos,
    semPerfil,
    porFuncao,
    funcoesInvalidas,
    perfis,
    permissoesVendas,
    colisoes,
    lojas,
  ] = await Promise.all([
    prisma.usuario.count(),
    prisma.usuario.count({ where: { status: 'ATIVO', ativo: true } }),
    prisma.usuario.count({
      where: { status: 'ATIVO', ativo: true, perfis: { none: {} } },
    }),
    prisma.usuario.groupBy({
      by: ['funcao'],
      _count: { _all: true },
    }),
    prisma.$queryRawUnsafe<Array<{ n: bigint }>>(
      `SELECT COUNT(*) AS n FROM usuario WHERE funcao NOT IN (${funcoes
        .map((f) => `'${f}'`)
        .join(',')})`,
    ).catch(() => [{ n: BigInt(0) }]),
    prisma.perfil_acesso.findMany({
      select: {
        id: true,
        loja_id: true,
        nome: true,
        ativo: true,
        sistema: true,
        _count: { select: { permissoes: true, usuarios: true } },
      },
      orderBy: [{ loja_id: 'asc' }, { nome: 'asc' }],
    }),
    prisma.perfil_permissao.findMany({
      where: { modulo: 'vendas' },
      select: {
        modulo: true,
        acao: true,
        permitido: true,
        perfil: { select: { loja_id: true, nome: true } },
      },
    }),
    prisma.$queryRawUnsafe<
      Array<{ perfil_id: string; modulo: string; acao: string; n: bigint }>
    >(
      `SELECT perfil_id, modulo, acao, COUNT(*) AS n
       FROM perfil_permissao
       GROUP BY perfil_id, modulo, acao
       HAVING COUNT(*) > 1`,
    ).catch(() => []),
    prisma.loja.findMany({
      select: {
        id: true,
        slug: true,
        _count: { select: { usuario: true, perfis_acesso: true } },
      },
    }),
  ]);

  const { detectarColisoesPerfisSistema } = await import(
    '../prisma/seed-vendas-rbac'
  );
  const colisoesNomeSistema = await detectarColisoesPerfisSistema(prisma);

  const relatorio = {
    gerado_em: new Date().toISOString(),
    usuarios: {
      total: totalUsuarios,
      ativos: usuariosAtivos,
      ativos_sem_perfil: semPerfil,
      por_funcao: Object.fromEntries(
        porFuncao.map((r) => [r.funcao, r._count._all]),
      ),
      funcoes_fora_do_enum: Number(funcoesInvalidas[0]?.n ?? 0),
    },
    perfis: perfis.map((p) => ({
      loja_id: p.loja_id,
      nome: p.nome,
      ativo: p.ativo,
      sistema: p.sistema,
      permissoes: p._count.permissoes,
      usuarios_vinculados: p._count.usuarios,
    })),
    permissoes_vendas: {
      total: permissoesVendas.length,
      por_acao: permissoesVendas.reduce<Record<string, number>>((acc, p) => {
        const k = `${p.modulo}.${p.acao}:${p.permitido ? 'ok' : 'neg'}`;
        acc[k] = (acc[k] ?? 0) + 1;
        return acc;
      }, {}),
    },
    colisoes_perfil_modulo_acao: colisoes.map((c) => ({
      perfil_id: c.perfil_id,
      chave: `${c.modulo}.${c.acao}`,
      n: Number(c.n),
    })),
    colisoes_nome_perfil_sistema: colisoesNomeSistema,
    lojas: lojas.map((l) => ({
      loja_id: l.id,
      slug: l.slug,
      usuarios: l._count.usuario,
      perfis: l._count.perfis_acesso,
    })),
  };

  console.log(JSON.stringify(relatorio, null, 2));
}

main()
  .catch((e) => {
    console.error(JSON.stringify({ erro: String(e?.message ?? e) }));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
