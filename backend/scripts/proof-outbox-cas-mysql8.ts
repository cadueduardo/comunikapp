/**
 * Provas MySQL 8 — outbox CAS em lote + retenção (Fase 5).
 * Uso: npx ts-node --transpile-only scripts/proof-outbox-cas-mysql8.ts
 */
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';

const prisma = new PrismaClient();

function hashEmail(email: string) {
  return createHash('sha256').update(email.trim().toLowerCase(), 'utf8').digest('hex');
}

async function criarLinha(
  lojaId: string,
  usuarioId: string,
  email: string,
  sufixo: string,
) {
  return prisma.outbox_email_vendas.create({
    data: {
      loja_id: lojaId,
      chave_dedup: `email:ATIVIDADE_ATRIBUIDA:prova-${sufixo}:${usuarioId}`,
      evento: 'ATIVIDADE_ATRIBUIDA',
      canal: 'email',
      destinatario_usuario_id: usuarioId,
      destinatario_email_hash: hashEmail(email),
      assunto_sanitizado: 'prova cas',
      template_codigo: 'vendas.atividade.atribuida',
      payload_sanitizado: {
        atividade_id: sufixo,
        url_destino: '/vendas/atividades',
      },
      estado: 'pendente',
      tentativas: 0,
      max_tentativas: 5,
      proxima_tentativa_em: new Date(0),
    },
  });
}

async function main() {
  const loja = await prisma.loja.findFirst({ select: { id: true } });
  if (!loja) {
    console.log(JSON.stringify({ skip: true, motivo: 'sem_loja' }));
    return;
  }
  const usuario = await prisma.usuario.findFirst({
    where: { loja_id: loja.id, ativo: true },
    select: { id: true, email: true },
  });
  if (!usuario?.email) {
    console.log(JSON.stringify({ skip: true, motivo: 'sem_usuario' }));
    return;
  }

  // 1) Disputa em uma linha
  const unica = await criarLinha(loja.id, usuario.id, usuario.email, randomUUID());
  const [c1, c2] = await Promise.all([
    prisma.outbox_email_vendas.updateMany({
      where: { id: unica.id, estado: 'pendente' },
      data: { estado: 'processando', bloqueado_em: new Date(), bloqueado_por: 'w1' },
    }),
    prisma.outbox_email_vendas.updateMany({
      where: { id: unica.id, estado: 'pendente' },
      data: { estado: 'processando', bloqueado_em: new Date(), bloqueado_por: 'w2' },
    }),
  ]);
  const umaLinhaOk = [c1.count, c2.count].filter((c) => c === 1).length === 1;

  // 2) Lote com 3 linhas — workers paralelos claimam por id
  const lote = await Promise.all([
    criarLinha(loja.id, usuario.id, usuario.email, randomUUID()),
    criarLinha(loja.id, usuario.id, usuario.email, randomUUID()),
    criarLinha(loja.id, usuario.id, usuario.email, randomUUID()),
  ]);
  const claimsW1: number[] = [];
  const claimsW2: number[] = [];
  await Promise.all(
    lote.flatMap((row) => [
      prisma.outbox_email_vendas
        .updateMany({
          where: { id: row.id, estado: 'pendente' },
          data: {
            estado: 'processando',
            bloqueado_em: new Date(),
            bloqueado_por: 'lote-w1',
          },
        })
        .then((r) => claimsW1.push(r.count)),
      prisma.outbox_email_vendas
        .updateMany({
          where: { id: row.id, estado: 'pendente' },
          data: {
            estado: 'processando',
            bloqueado_em: new Date(),
            bloqueado_por: 'lote-w2',
          },
        })
        .then((r) => claimsW2.push(r.count)),
    ]),
  );
  const adquiridos =
    claimsW1.filter((c) => c === 1).length +
    claimsW2.filter((c) => c === 1).length;
  const loteOk = adquiridos === lote.length;

  // 3) Worker antigo não finaliza
  const retomada = await criarLinha(
    loja.id,
    usuario.id,
    usuario.email,
    randomUUID(),
  );
  await prisma.outbox_email_vendas.updateMany({
    where: { id: retomada.id },
    data: {
      estado: 'processando',
      bloqueado_em: new Date(),
      bloqueado_por: 'worker-novo',
    },
  });
  const antigo = await prisma.outbox_email_vendas.updateMany({
    where: {
      id: retomada.id,
      bloqueado_por: 'worker-antigo',
      estado: 'processando',
    },
    data: { estado: 'enviado', processado_em: new Date() },
  });
  const antigoBloqueado = antigo.count === 0;

  const ids = [unica.id, ...lote.map((r) => r.id), retomada.id];
  await prisma.outbox_email_vendas.deleteMany({ where: { id: { in: ids } } });

  console.log(
    JSON.stringify({
      ok: umaLinhaOk && loteOk && antigoBloqueado,
      uma_linha: { c1: c1.count, c2: c2.count, ok: umaLinhaOk },
      lote: { adquiridos, esperado: lote.length, ok: loteOk },
      worker_antigo_bloqueado: antigoBloqueado,
      engine: 'mysql8_scratch_3307',
    }),
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
