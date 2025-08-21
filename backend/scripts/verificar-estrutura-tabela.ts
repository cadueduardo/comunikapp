import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Verificando estrutura da tabela estoque_itens...')
    
    // Verificar se a tabela existe
    const tableExists = await prisma.$queryRaw<Array<{TABLE_NAME: string}>>`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'comunikapp' 
      AND TABLE_NAME = 'estoque_itens'
    `
    
    if (tableExists.length === 0) {
      console.log('❌ Tabela estoque_itens não existe!')
      return
    }
    
    console.log('✅ Tabela estoque_itens existe')
    
    // Verificar colunas da tabela
    const columns = await prisma.$queryRaw<Array<{COLUMN_NAME: string, DATA_TYPE: string, IS_NULLABLE: string}>>`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'comunikapp' 
      AND TABLE_NAME = 'estoque_itens'
      ORDER BY ORDINAL_POSITION
    `
    
    console.log('📋 Colunas da tabela:')
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`)
    })
    
    // Verificar se há dados na tabela
    const count = await prisma.$queryRaw<Array<{total: bigint}>>`
      SELECT COUNT(*) as total FROM estoque_itens
    `
    
    console.log(`📊 Total de registros: ${count[0]?.total || 0}`)
    
  } catch (e: any) {
    console.error('❌ Erro ao verificar tabela:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

