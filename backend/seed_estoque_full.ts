import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const lojaId = 'cme1ops150000w4ikkdtq0h3x'

  // 1) Localizações (idempotente)
  await prisma.$executeRawUnsafe(
         `INSERT IGNORE INTO estoque_localizacoes (id, codigo, deposito, descricao, capacidade, ativo, lojaId, createdAt, updatedAt)
      VALUES 
      ('seed-loc-a1-01', 'A1-01', 'Depósito A', 'Corredor 1', 100, 1, ?, NOW(), NOW()),
      ('seed-loc-a1-02', 'A1-02', 'Depósito A', 'Corredor 1', 80, 1, ?, NOW(), NOW()),
      ('seed-loc-b1-01', 'B1-01', 'Depósito B', 'Corredor 1', 120, 1, ?, NOW(), NOW())`,
    lojaId, lojaId, lojaId
  )

  const [locA, locB]: any[] = await prisma.$queryRawUnsafe(
          `SELECT id FROM estoque_localizacoes WHERE loja_id = ? AND codigo IN ('A1-01','B1-01') ORDER BY codigo`, lojaId
  )
  const locAId = locA?.id || 'seed-loc-a1-01'
  const locBId = locB?.id || 'seed-loc-b1-01'

  // 2) Itens (idempotente via ids fixos)
     await prisma.$executeRawUnsafe(
     `INSERT INTO estoque_itens (id, nome, localizacao_id, quantidade, estoque_minimo, unidade_medida, preco_unitario, ativo, lojaId, createdAt, updatedAt)
      VALUES 
      ('seed-item-1', 'Bobina Lona 440g', ?, 5, 10, 'm', 25.50, 1, ?, NOW(), NOW()),
      ('seed-item-2', 'Vinil Adesivo', ?, 50, 20, 'm', 18.00, 1, ?, NOW(), NOW()),
      ('seed-item-3', 'MDF 6mm', ?, 15, 15, 'un', 32.90, 1, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        quantidade = VALUES(quantidade),
        estoque_minimo = VALUES(estoque_minimo),
        preco_unitario = VALUES(preco_unitario),
        updatedAt = NOW()`,
    locAId, lojaId,
    locAId, lojaId,
    locBId, lojaId,
  )

  // 3) Lotes (idempotente)
     const item1: any[] = await prisma.$queryRawUnsafe('SELECT id FROM estoque_itens WHERE id = ? AND lojaId = ? LIMIT 1', 'seed-item-1', lojaId)
   const item2: any[] = await prisma.$queryRawUnsafe('SELECT id FROM estoque_itens WHERE id = ? AND lojaId = ? LIMIT 1', 'seed-item-2', lojaId)
  const id1 = item1[0]?.id
  const id2 = item2[0]?.id
  if (id1) {
         const exists: any[] = await prisma.$queryRawUnsafe('SELECT id FROM estoque_lotes WHERE lojaId = ? AND numero_lote = ? LIMIT 1', lojaId, 'LT-TESTE-001')
    if (!exists[0]) {
             await prisma.$executeRawUnsafe(
         `INSERT INTO estoque_lotes (id, estoque_id, numero_lote, data_fabricacao, data_validade, quantidade_lote, status, lojaId, createdAt)
          VALUES ('seed-lote-1', ?, 'LT-TESTE-001', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 10, 'ATIVO', ?, NOW())`,
         id1, lojaId,
       )
     }
   }
   if (id2) {
     const exists2: any[] = await prisma.$queryRawUnsafe('SELECT id FROM estoque_lotes WHERE lojaId = ? AND numero_lote = ? LIMIT 1', lojaId, 'LT-TESTE-002')
     if (!exists2[0]) {
       await prisma.$executeRawUnsafe(
         `INSERT INTO estoque_lotes (id, estoque_id, numero_lote, data_fabricacao, data_validade, quantidade_lote, status, lojaId, createdAt)
          VALUES ('seed-lote-2', ?, 'LT-TESTE-002', DATE_SUB(NOW(), INTERVAL 60 DAY), DATE_ADD(NOW(), INTERVAL 35 DAY), 20, 'ATIVO', ?, NOW())`,
         id2, lojaId,
       )
     }
  }

  console.log('✅ Seed completo de estoque aplicado')

  // 4) Movimentações (se existirem IDs reais)
     if (id2) {
     await prisma.$executeRawUnsafe(
       `INSERT INTO estoque_movimentacoes (id, lojaId, item_id, tipo, quantidade, observacoes, createdAt)
        VALUES ('seed-mov-ent-1', ?, ?, 'ENTRADA', 10, 'Entrada de teste', NOW())
        ON DUPLICATE KEY UPDATE quantidade=VALUES(quantidade), createdAt=NOW()`,
       lojaId, id2
     )
   }
   if (id1) {
     await prisma.$executeRawUnsafe(
       `INSERT INTO estoque_movimentacoes (id, lojaId, item_id, tipo, quantidade, observacoes, createdAt)
        VALUES ('seed-mov-sai-1', ?, ?, 'SAIDA', 2, 'Saída de teste', NOW())
        ON DUPLICATE KEY UPDATE quantidade=VALUES(quantidade), createdAt=NOW()`,
       lojaId, id1
     )
   }
   const item3: any[] = await prisma.$queryRawUnsafe('SELECT id FROM estoque_itens WHERE id = ? AND lojaId = ? LIMIT 1', 'seed-item-3', lojaId)
   const id3 = item3[0]?.id
   if (id3) {
     await prisma.$executeRawUnsafe(
       `INSERT INTO estoque_movimentacoes (id, lojaId, item_id, tipo, quantidade, observacoes, createdAt)
        VALUES ('seed-mov-aj-1', ?, ?, 'AJUSTE', 1, 'Ajuste de teste', NOW())
        ON DUPLICATE KEY UPDATE quantidade=VALUES(quantidade), createdAt=NOW()`,
       lojaId, id3
     )
   }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})


