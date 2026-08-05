/**
 * Prova MySQL 8 — claim CAS do outbox (Fase 5).
 * Uso: npx ts-node --transpile-only scripts/prova-outbox-cas-mysql8.ts
 */
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

const prisma = new PrismaClient();

function hashEmail(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');
}

async function main() {
  const loja = await prisma.loja.findFirst({ select: { id: true } });
  if (!loja) {
    console.log('SKIP: sem loja no scratch');
    return;
  }
  const usuario = await prisma.usuario.findFirst({
    where: { loja_id: loja.id, ativo: true },
    select: { id: true, email: true },
  });
  if (!usuario?.email) {
    console.log('SKIP: sem usuario com e-mail');
    return;
  }

  const chave = `email:ATIVIDADE_ATRIBUIDA:prova-${randomUUID()}:${usuario.id}`;
  const row = await prisma.outbox_email_vendas.create({
    data: {
      loja_id: loja.id,
      chave_dedup: chave,
      evento: 'ATIVIDADE_ATRIBUIDA',
      canal: 'email',
      destinatario_usuario_id: usuario.id,
      destinatario_email_hash: hashEmail(usuario.email),
      assunto_sanitizado: 'prova cas',
      template_codigo: 'vendas.atividade.atribuida',
      payload_sanitizado: {
        atividade_id: 'prova',
        url_destino: '/vendas/atividades',
      },
      estado: 'pendente',
      tentativas: 0,
      max_tentativas: 5,
      proxima_tentativa_em: new Date(0),
    },
  });

  const [c1, c2] = await Promise.all([
    prisma.outbox_email_vendas.updateMany({
      where: { id: row.id, estado: 'pendente' },
      data: {
        estado: 'processando',
        bloqueado_em: new Date(),
        bloqueado_por: 'w1',
      },
    }),
    prisma.outbox_email_vendas.updateMany({
      where: { id: row.id, estado: 'pendente' },
      data: {
        estado: 'processando',
        bloqueado_em: new Date(),
        bloqueado_por: 'w2',
      },
    }),
  ]);

  const vencedores = [c1.count, c2.count].filter((c) => c === 1).length;
  console.log(
    JSON.stringify({
      ok: vencedores === 1,
      c1: c1.count,
      c2: c2.count,
      id: row.id,
      engine: 'mysql8_scratch_3307',
    }),
  );

  await prisma.outbox_email_vendas.delete({ where: { id: row.id } });
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
