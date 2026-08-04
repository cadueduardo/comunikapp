/**
 * Integração MySQL: VendasPermissionsService sem cache + revogação VENDAS.
 * Uso: npx ts-node scripts/validar-rbac-vendas-mysql.ts
 */
import { PrismaClient, usuario_funcao } from '@prisma/client';
import { VendasPermissionsService } from '../src/vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../src/vendas/permissions/vendas-permissoes';
import { PrismaService } from '../src/prisma/prisma.service';
import { validarAmbienteTesteMutavel } from './validar-ambiente-teste-mutavel';

const prisma = new PrismaClient();

async function main() {
  validarAmbienteTesteMutavel();
  const svc = new VendasPermissionsService(prisma as unknown as PrismaService);
  const sufixo = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const lojaId = `rbac-test-loja-${sufixo}`;
  const adminId = `rbac-test-admin-${sufixo}`;
  const vendId = `rbac-test-vend-${sufixo}`;

  let fixtureCriada = false;

  try {
    await prisma.loja.create({
      data: {
        id: lojaId,
        email: `${lojaId}@example.invalid`,
        atualizado_em: new Date(),
        nome: 'Loja isolada para teste RBAC',
        slug: lojaId,
        telefone: '0000000000',
        usuario: {
          create: [
            {
              id: adminId,
              email: `${adminId}@example.invalid`,
              nome_completo: 'RBAC Test Admin',
              funcao: usuario_funcao.ADMINISTRADOR,
              status: 'ATIVO',
              ativo: true,
            },
            {
              id: vendId,
              email: `${vendId}@example.invalid`,
              nome_completo: 'RBAC Test Vendedor',
              funcao: usuario_funcao.VENDAS,
              status: 'ATIVO',
              ativo: true,
            },
          ],
        },
      },
    });
    fixtureCriada = true;

    const perfilVend = await prisma.perfil_acesso.create({
      data: {
        loja_id: lojaId,
        nome: `Vendedor teste ${sufixo}`,
        sistema: true,
        usuarios: { create: { usuario_id: vendId } },
        permissoes: {
          create: {
            modulo: 'vendas',
            acao: 'proposta.enviar',
            permitido: true,
          },
        },
      },
      select: { id: true },
    });

    const resultados: Record<string, boolean | string> = {};

    resultados.admin_excluir = await svc.pode(
      adminId,
      lojaId,
      VENDAS_PERMISSOES.PROPOSTA_EXCLUIR,
    );
    resultados.vendedor_enviar_antes = await svc.pode(
      vendId,
      lojaId,
      VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
    );

    // Negação explícita sobre o piso VENDAS.
    await prisma.perfil_permissao.upsert({
      where: {
        perfil_id_modulo_acao: {
          perfil_id: perfilVend.id,
          modulo: 'vendas',
          acao: 'proposta.enviar',
        },
      },
      create: {
        perfil_id: perfilVend.id,
        modulo: 'vendas',
        acao: 'proposta.enviar',
        permitido: false,
      },
      update: { permitido: false },
    });

    resultados.vendedor_enviar_apos_revoga = await svc.pode(
      vendId,
      lojaId,
      VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
    );

    // Inativar usuário: deve negar imediatamente (sem cache).
    await prisma.usuario.update({
      where: { id: vendId },
      data: { ativo: false },
    });
    resultados.vendedor_inativo = await svc.pode(
      vendId,
      lojaId,
      VENDAS_PERMISSOES.PROPOSTA_VER,
    );

    // Tenant: admin não autoriza em loja fantasma.
    resultados.admin_outra_loja = await svc.pode(
      adminId,
      'loja-inexistente',
      VENDAS_PERMISSOES.PROPOSTA_VER,
    );

    // Assert direto no service.
    let assertNegado = false;
    try {
      await svc.assertPode(vendId, lojaId, VENDAS_PERMISSOES.PROPOSTA_VER);
    } catch {
      assertNegado = true;
    }
    resultados.assert_inativo_lanca = assertNegado;

    const ok =
      resultados.admin_excluir === true &&
      resultados.vendedor_enviar_antes === true &&
      resultados.vendedor_enviar_apos_revoga === false &&
      resultados.vendedor_inativo === false &&
      resultados.admin_outra_loja === false &&
      resultados.assert_inativo_lanca === true;

    console.log(JSON.stringify({ ok, resultados }, null, 2));
    if (!ok) {
      throw new Error('A validação RBAC não satisfez todas as invariantes');
    }
  } finally {
    if (fixtureCriada) {
      await prisma.loja.delete({ where: { id: lojaId } });
    }
  }
}

main()
  .catch((e) => {
    console.error(JSON.stringify({ erro: String(e?.message ?? e) }));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
