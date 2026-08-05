/**
 * Provas MySQL 8 (scratch) — M4.4 unicidade por tenant, isolamento e CAS.
 *
 * Pré-requisitos:
 * - mysqld 8.x em porta dedicada (ex.: 3307)
 * - DATABASE_URL=mysql://.../comunikapp_ci_scratch
 * - prisma migrate deploy já aplicado
 *
 * Não usa produção. Não imprime PII.
 */
import { createHash, randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function pseudo(valor: string): string {
  return createHash('sha256').update(valor).digest('hex').slice(0, 12);
}

function assert(condicao: boolean, mensagem: string): void {
  if (!condicao) throw new Error(mensagem);
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Proibido em production.');
  }

  const url = process.env.DATABASE_URL ?? '';
  const nomeBanco = decodeURIComponent(
    new URL(url).pathname.replace(/^\//, ''),
  );
  assert(
    /(test|teste|scratch|ci)/i.test(nomeBanco),
    `Banco "${nomeBanco}" não é scratch/ci.`,
  );

  const versao = await prisma.$queryRawUnsafe<
    { version: string }[]
  >('SELECT VERSION() AS version');
  const engine = await prisma.$queryRawUnsafe<
    { engine: string }[]
  >("SELECT ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cliente' LIMIT 1");

  console.log(
    JSON.stringify({
      host_porta: new URL(url).host,
      banco: nomeBanco,
      versao: versao[0]?.version,
      engine_cliente: engine[0]?.engine,
    }),
  );

  const lojaA = `loja_a_${randomUUID().slice(0, 8)}`;
  const lojaB = `loja_b_${randomUUID().slice(0, 8)}`;
  const userA1 = `user_a1_${randomUUID().slice(0, 8)}`;
  const userA2 = `user_a2_${randomUUID().slice(0, 8)}`;
  const userB1 = `user_b1_${randomUUID().slice(0, 8)}`;
  const cliA = `cli_a_${randomUUID().slice(0, 8)}`;
  const cliB = `cli_b_${randomUUID().slice(0, 8)}`;
  const chave = `chave_compartilhada_${randomUUID().slice(0, 8)}`;

  await prisma.loja.create({
    data: {
      id: lojaA,
      nome: 'Loja A Scratch',
      email: `${lojaA}@scratch.local`,
      telefone: '11000000000',
      slug: lojaA,
      atualizado_em: new Date(),
      status: 'ATIVO',
    },
  });
  await prisma.loja.create({
    data: {
      id: lojaB,
      nome: 'Loja B Scratch',
      email: `${lojaB}@scratch.local`,
      telefone: '11000000001',
      slug: lojaB,
      atualizado_em: new Date(),
      status: 'ATIVO',
    },
  });

  // Schema de usuario via Prisma.
  const criarUsuario = async (
    id: string,
    lojaId: string,
    nome: string,
  ) => {
    await prisma.usuario.create({
      data: {
        id,
        loja_id: lojaId,
        nome_completo: nome,
        email: `${id}@scratch.local`,
        senha: 'x',
        funcao: 'VENDAS',
        status: 'ATIVO',
        ativo: true,
      },
    });
  };

  try {
    await criarUsuario(userA1, lojaA, 'Vend A1');
    await criarUsuario(userA2, lojaA, 'Vend A2');
    await criarUsuario(userB1, lojaB, 'Vend B1');
  } catch (erro) {
    console.error(
      'Falha ao criar usuario scratch (schema pode exigir campos extras).',
      erro instanceof Error ? erro.message : erro,
    );
    throw erro;
  }

  await prisma.cliente.create({
    data: {
      id: cliA,
      loja_id: lojaA,
      nome: 'Cliente A',
      tipo_pessoa: 'PESSOA_FISICA',
      documento: '00000000000',
      responsavel_comercial_id: userA1,
      responsavel_desde: new Date(),
    },
  });
  await prisma.cliente.create({
    data: {
      id: cliB,
      loja_id: lojaB,
      nome: 'Cliente B',
      tipo_pessoa: 'PESSOA_FISICA',
      documento: '00000000001',
      responsavel_comercial_id: userB1,
      responsavel_desde: new Date(),
    },
  });

  // Mesma chave em lojas diferentes — permitido (unique composto).
  await prisma.cliente_transferencia_carteira.create({
    data: {
      loja_id: lojaA,
      cliente_id: cliA,
      de_usuario_id: userA1,
      para_usuario_id: userA2,
      autor_id: userA1,
      motivo: 'prova loja A',
      chave_operacao: chave,
    },
  });
  await prisma.cliente_transferencia_carteira.create({
    data: {
      loja_id: lojaB,
      cliente_id: cliB,
      de_usuario_id: userB1,
      para_usuario_id: userB1,
      autor_id: userB1,
      motivo: 'prova loja B',
      chave_operacao: chave,
    },
  });
  console.log(
    JSON.stringify({
      prova: 'mesma_chave_duas_lojas',
      ok: true,
      chave_ref: pseudo(chave),
      loja_a_ref: pseudo(lojaA),
      loja_b_ref: pseudo(lojaB),
    }),
  );

  // Mesma chave na mesma loja — deve falhar.
  let duplicataNegada = false;
  try {
    await prisma.cliente_transferencia_carteira.create({
      data: {
        loja_id: lojaA,
        cliente_id: cliA,
        de_usuario_id: userA1,
        para_usuario_id: userA2,
        autor_id: userA1,
        motivo: 'duplicata',
        chave_operacao: chave,
      },
    });
  } catch {
    duplicataNegada = true;
  }
  assert(duplicataNegada, 'unicidade por loja_id+chave_operacao falhou');
  console.log(JSON.stringify({ prova: 'unicidade_mesma_loja', ok: true }));

  // CAS concorrente: dois updateMany; só um deve alterar.
  const cliCas = `cli_cas_${randomUUID().slice(0, 8)}`;
  await prisma.cliente.create({
    data: {
      id: cliCas,
      loja_id: lojaA,
      nome: 'Cliente CAS',
      tipo_pessoa: 'PESSOA_FISICA',
      documento: '00000000002',
      responsavel_comercial_id: userA1,
      responsavel_desde: new Date(),
    },
  });

  const [r1, r2] = await Promise.all([
    prisma.cliente.updateMany({
      where: {
        id: cliCas,
        loja_id: lojaA,
        responsavel_comercial_id: userA1,
      },
      data: { responsavel_comercial_id: userA2 },
    }),
    prisma.cliente.updateMany({
      where: {
        id: cliCas,
        loja_id: lojaA,
        responsavel_comercial_id: userA1,
      },
      data: { responsavel_comercial_id: userA2 },
    }),
  ]);
  const totalAlterado = r1.count + r2.count;
  assert(totalAlterado === 1, `CAS esperado 1, obtido ${totalAlterado}`);
  console.log(JSON.stringify({ prova: 'cas_concorrente', ok: true, totalAlterado }));

  // Rollback transacional.
  const cliRb = `cli_rb_${randomUUID().slice(0, 8)}`;
  await prisma.cliente.create({
    data: {
      id: cliRb,
      loja_id: lojaA,
      nome: 'Cliente RB',
      tipo_pessoa: 'PESSOA_FISICA',
      documento: '00000000003',
      responsavel_comercial_id: userA1,
      responsavel_desde: new Date(),
    },
  });
  try {
    await prisma.$transaction(async (tx) => {
      await tx.cliente.update({
        where: { id: cliRb },
        data: { responsavel_comercial_id: userA2 },
      });
      throw new Error('forcar_rollback');
    });
  } catch {
    // esperado
  }
  const apos = await prisma.cliente.findUnique({
    where: { id: cliRb },
    select: { responsavel_comercial_id: true },
  });
  assert(
    apos?.responsavel_comercial_id === userA1,
    'rollback transacional falhou',
  );
  console.log(JSON.stringify({ prova: 'rollback_transacional', ok: true }));

  console.log(JSON.stringify({ resultado: 'TODAS_PROVAS_OK' }));
}

main()
  .catch((erro) => {
    console.error(erro instanceof Error ? erro.message : erro);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
