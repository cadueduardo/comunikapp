import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔄 Renomeando tabelas de estoque de inglês para português...')
    
    // Verificar se as tabelas em inglês existem
    const tables = await prisma.$queryRaw<Array<{TABLE_NAME: string}>>`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'comunikapp' 
      AND TABLE_NAME LIKE 'inventory_%'
    `
    
    console.log('📋 Tabelas encontradas:', tables.map(t => t.TABLE_NAME))
    
    if (tables.length === 0) {
      console.log('✅ Nenhuma tabela em inglês encontrada. Verificando se já existem em português...')
      
      const portugueseTables = await prisma.$queryRaw<Array<{TABLE_NAME: string}>>`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = 'comunikapp' 
        AND TABLE_NAME LIKE 'estoque_%'
      `
      
      if (portugueseTables.length > 0) {
        console.log('✅ Tabelas em português já existem:', portugueseTables.map(t => t.TABLE_NAME))
        return
      }
      
      console.log('❌ Nenhuma tabela de estoque encontrada. Execute primeiro a migração do Prisma.')
      return
    }
    
    // Renomear tabelas
    const renameQueries = [
      'RENAME TABLE inventory_locations TO estoque_localizacoes',
      'RENAME TABLE inventory_stock TO estoque_itens',
      'RENAME TABLE inventory_movements TO estoque_movimentacoes',
      'RENAME TABLE inventory_lots TO estoque_lotes'
    ]
    
    for (const query of renameQueries) {
      try {
        await prisma.$executeRawUnsafe(query)
        console.log(`✅ ${query}`)
      } catch (e: any) {
        console.log(`⚠️ ${query} - ${e.message}`)
      }
    }
    
    // Verificar resultado
    const finalTables = await prisma.$queryRaw<Array<{TABLE_NAME: string}>>`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'comunikapp' 
      AND TABLE_NAME LIKE 'estoque_%'
    `
    
    console.log('✅ Tabelas renomeadas com sucesso:', finalTables.map(t => t.TABLE_NAME))
    
  } catch (e: any) {
    console.error('❌ Erro ao renomear tabelas:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


