import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const lojaId = 'cme1ops150000w4ikkdtq0h3x'

  // Localizações com capacidade (idempotente)
  await prisma.$executeRawUnsafe(
    `INSERT IGNORE INTO localizacoes (id, codigo, deposito, descricao, capacidade, ativo, loja_id, criado_em, atualizado_em)
     VALUES 
     ('seed-loc-a1-01', 'A1-01', 'Depósito A', 'Corredor 1', 100, 1, ?, NOW(), NOW()),
     ('seed-loc-a1-02', 'A1-02', 'Depósito A', 'Corredor 1', 80, 1, ?, NOW(), NOW()),
     ('seed-loc-b1-01', 'B1-01', 'Depósito B', 'Corredor 1', 120, 1, ?, NOW(), NOW())`,
    lojaId, lojaId, lojaId
  )

  // Pegar uma localização para vincular itens
  const loc: any[] = await prisma.$queryRawUnsafe('SELECT id FROM localizacoes WHERE loja_id = ? ORDER BY codigo LIMIT 1', lojaId)
  const localizacaoId = loc[0]?.id

  if (!localizacaoId) throw new Error('Falha ao criar localizações')

  // Itens (idempotente via ids fixos)
  await prisma.$executeRawUnsafe(
    `INSERT INTO itens_estoque (id, nome, localizacao_id, quantidade, estoque_minimo, unidade_medida, preco_unitario, ativo, loja_id, criado_em, atualizado_em)
     VALUES 
     ('seed-item-1', 'Bobina Lona 440g', ?, 5, 10, 'm', 25.50, 1, ?, NOW(), NOW()),
     ('seed-item-2', 'Vinil Adesivo', ?, 50, 20, 'm', 18.00, 1, ?, NOW(), NOW()),
     ('seed-item-3', 'MDF 6mm', ?, 15, 15, 'un', 32.90, 1, ?, NOW(), NOW())
     ON DUPLICATE KEY UPDATE 
       quantidade = VALUES(quantidade),
       estoque_minimo = VALUES(estoque_minimo),
       preco_unitario = VALUES(preco_unitario),
       atualizado_em = NOW()`,
    localizacaoId, lojaId,
    localizacaoId, lojaId,
    localizacaoId, lojaId,
  )

  // Lote (idempotente)
  const itemRow: any[] = await prisma.$queryRawUnsafe('SELECT id FROM itens_estoque WHERE id = ? AND loja_id = ? LIMIT 1', 'seed-item-1', lojaId)
  const estoqueId = itemRow[0]?.id
  if (estoqueId) {
    const exists: any[] = await prisma.$queryRawUnsafe('SELECT id FROM estoque_lotes WHERE loja_id = ? AND numero_lote = ? LIMIT 1', lojaId, 'LT-TESTE-001')
    if (!exists[0]) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO estoque_lotes (id, estoque_id, numero_lote, data_fabricacao, data_validade, quantidade_lote, status, loja_id, criado_em)
         VALUES ('seed-lote-1', ?, 'LT-TESTE-001', DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 10, 'ATIVO', ?, NOW())`,
        estoqueId, lojaId,
      )
    }
  }

  console.log('✅ Massa de dados de teste criada/atualizada para relatórios')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


