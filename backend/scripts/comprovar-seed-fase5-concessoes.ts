/**
 * Confirma pós-seed: perfis de sistema e ausência de concessões indevidas (Fase 5).
 * Uso: ALLOW_RBAC_TEST_MUTATIONS=true npx ts-node --transpile-only scripts/comprovar-seed-fase5-concessoes.ts
 */
import { PrismaClient } from '@prisma/client';
import { validarAmbienteTesteMutavel } from './validar-ambiente-teste-mutavel';
import {
  DEFAULTS_CONCEDIDOS_FASE_5,
  NOMES_PERFIL_SISTEMA,
  separarModuloEAcao,
  VENDAS_PERMISSOES,
} from '../src/vendas/permissions/vendas-permissoes';

const prisma = new PrismaClient();

function chavePerm(permissao: string) {
  const { modulo, acao } = separarModuloEAcao(permissao);
  return `${modulo}:${acao}`;
}

async function main() {
  validarAmbienteTesteMutavel();
  const lojas = await prisma.loja.findMany({ select: { id: true }, take: 20 });
  const resumoLojas: Array<{
    loja_pseudo: string;
    financeiro_sem_atividade: boolean;
    vendedor_tem_defaults_f5: boolean;
    gestor_tem_defaults_f5: boolean;
  }> = [];

  for (const loja of lojas) {
    const perfis = await prisma.perfil_acesso.findMany({
      where: {
        loja_id: loja.id,
        sistema: true,
        nome: {
          in: [
            NOMES_PERFIL_SISTEMA.VENDEDOR,
            NOMES_PERFIL_SISTEMA.GESTOR,
            NOMES_PERFIL_SISTEMA.FINANCEIRO,
          ],
        },
      },
      include: { permissoes: true },
    });

    const porNome = Object.fromEntries(perfis.map((p) => [p.nome, p]));
    const setPerm = (nome: string) =>
      new Set(
        (porNome[nome]?.permissoes ?? [])
          .filter((p) => p.permitido)
          .map((p) => `${p.modulo}:${p.acao}`),
      );

    const fin = setPerm(NOMES_PERFIL_SISTEMA.FINANCEIRO);
    const vend = setPerm(NOMES_PERFIL_SISTEMA.VENDEDOR);
    const gest = setPerm(NOMES_PERFIL_SISTEMA.GESTOR);

    const atividadeKeys = [
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
      VENDAS_PERMISSOES.ATIVIDADE_VER_EQUIPE,
      VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
    ].map(chavePerm);

    const financeiroSemAtividade = atividadeKeys.every((k) => !fin.has(k));

    const defaultsVend = DEFAULTS_CONCEDIDOS_FASE_5.VENDEDOR.map(chavePerm);
    const defaultsGest = DEFAULTS_CONCEDIDOS_FASE_5.GESTOR.map(chavePerm);

    resumoLojas.push({
      loja_pseudo: loja.id.slice(0, 8),
      financeiro_sem_atividade: financeiroSemAtividade,
      vendedor_tem_defaults_f5: defaultsVend.every((k) => vend.has(k)),
      gestor_tem_defaults_f5: defaultsGest.every((k) => gest.has(k)),
    });
  }

  const ok =
    resumoLojas.length > 0 &&
    resumoLojas.every(
      (r) =>
        r.financeiro_sem_atividade &&
        r.vendedor_tem_defaults_f5 &&
        r.gestor_tem_defaults_f5,
    );

  console.log(
    JSON.stringify(
      {
        ok,
        lojas_verificadas: resumoLojas.length,
        resumo: resumoLojas,
      },
      null,
      2,
    ),
  );
  if (!ok) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
