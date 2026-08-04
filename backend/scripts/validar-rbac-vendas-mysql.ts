/**
 * Integração MySQL: VendasPermissionsService sem cache + revogação VENDAS.
 * Uso: npx ts-node scripts/validar-rbac-vendas-mysql.ts
 */
import { PrismaClient, usuario_funcao } from '@prisma/client';
import { VendasPermissionsService } from '../src/vendas/permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from '../src/vendas/permissions/vendas-permissoes';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient();

async function main() {
  const svc = new VendasPermissionsService(prisma as unknown as PrismaService);
  const loja = await prisma.loja.findFirst({ select: { id: true } });
  if (!loja) throw new Error('Nenhuma loja');

  const admin = await prisma.usuario.findFirst({
    where: {
      loja_id: loja.id,
      funcao: usuario_funcao.ADMINISTRADOR,
      status: 'ATIVO',
      ativo: true,
    },
    select: { id: true },
  });
  if (!admin) throw new Error('Admin ausente');

  // Cria vendedor temporário + perfil Vendedor sistema.
  const perfilVend = await prisma.perfil_acesso.findFirst({
    where: { loja_id: loja.id, nome: 'Vendedor', sistema: true },
    select: { id: true },
  });
  if (!perfilVend) throw new Error('Perfil Vendedor sistema ausente — rode o seed');

  const vendId = `rbac-test-vend-${Date.now()}`;
  await prisma.usuario.create({
    data: {
      id: vendId,
      nome_completo: 'RBAC Test Vendedor',
      nome: 'RBAC Test Vendedor',
      email: `${vendId}@example.invalid`,
      senha: 'x',
      funcao: usuario_funcao.VENDAS,
      status: 'ATIVO',
      ativo: true,
      loja: { connect: { id: loja.id } },
    },
  });
  await prisma.usuario_perfil.create({
    data: { usuario_id: vendId, perfil_id: perfilVend.id },
  });

  const resultados: Record<string, boolean | string> = {};

  resultados.admin_excluir = await svc.pode(
    admin.id,
    loja.id,
    VENDAS_PERMISSOES.PROPOSTA_EXCLUIR,
  );
  resultados.vendedor_enviar_antes = await svc.pode(
    vendId,
    loja.id,
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
    loja.id,
    VENDAS_PERMISSOES.PROPOSTA_ENVIAR,
  );

  // Inativar usuário: deve negar imediatamente (sem cache).
  await prisma.usuario.update({
    where: { id: vendId },
    data: { ativo: false },
  });
  resultados.vendedor_inativo = await svc.pode(
    vendId,
    loja.id,
    VENDAS_PERMISSOES.PROPOSTA_VER,
  );

  // Tenant: admin não autoriza em loja fantasma.
  resultados.admin_outra_loja = await svc.pode(
    admin.id,
    'loja-inexistente',
    VENDAS_PERMISSOES.PROPOSTA_VER,
  );

  // Assert direto no service.
  let assertNegado = false;
  try {
    await svc.assertPode(vendId, loja.id, VENDAS_PERMISSOES.PROPOSTA_VER);
  } catch {
    assertNegado = true;
  }
  resultados.assert_inativo_lanca = assertNegado;

  // Restaura permissão do perfil sistema (não deixar ambiente sujo).
  await prisma.perfil_permissao.update({
    where: {
      perfil_id_modulo_acao: {
        perfil_id: perfilVend.id,
        modulo: 'vendas',
        acao: 'proposta.enviar',
      },
    },
    data: { permitido: true },
  });
  await prisma.usuario_perfil.deleteMany({ where: { usuario_id: vendId } });
  await prisma.usuario.delete({ where: { id: vendId } });

  const ok =
    resultados.admin_excluir === true &&
    resultados.vendedor_enviar_antes === true &&
    resultados.vendedor_enviar_apos_revoga === false &&
    resultados.vendedor_inativo === false &&
    resultados.admin_outra_loja === false &&
    resultados.assert_inativo_lanca === true;

  console.log(JSON.stringify({ ok, resultados }, null, 2));
  if (!ok) process.exit(2);
}

main()
  .catch((e) => {
    console.error(JSON.stringify({ erro: String(e?.message ?? e) }));
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
