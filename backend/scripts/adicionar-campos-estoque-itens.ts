import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔧 Adicionando campos necessários à tabela estoque_itens...')
    
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
    
    // Verificar colunas existentes
    const existingColumns = await prisma.$queryRaw<Array<{COLUMN_NAME: string}>>`
      SELECT COLUMN_NAME 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'comunikapp' 
      AND TABLE_NAME = 'estoque_itens'
      ORDER BY ORDINAL_POSITION
    `
    
    const existingCols = new Set(existingColumns.map(c => c.COLUMN_NAME))
    console.log('📋 Colunas existentes:', Array.from(existingCols))
    
    // Campos que precisam ser adicionados baseado no formulário
    const camposParaAdicionar = [
      { nome: 'codigo', tipo: 'VARCHAR(100)', nullable: 'NULL', comentario: 'Código interno do item' },
      { nome: 'nome', tipo: 'VARCHAR(255)', nullable: 'NULL', comentario: 'Nome do item em estoque' },
      { nome: 'descricao', tipo: 'TEXT', nullable: 'NULL', comentario: 'Descrição detalhada do item' },
      { nome: 'unidadeMedida', tipo: 'VARCHAR(50)', nullable: 'NULL', comentario: 'Unidade de medida do item' },
      { nome: 'precoUnitario', tipo: 'DECIMAL(10,2)', nullable: 'NULL', comentario: 'Preço unitário do item' },
      { nome: 'codigoBarras', tipo: 'VARCHAR(100)', nullable: 'NULL', comentario: 'Código de barras do produto' },
      { nome: 'lote', tipo: 'VARCHAR(100)', nullable: 'NULL', comentario: 'Número do lote' },
      { nome: 'dataValidade', tipo: 'DATE', nullable: 'NULL', comentario: 'Data de validade do item' },
      { nome: 'observacoes', tipo: 'TEXT', nullable: 'NULL', comentario: 'Observações adicionais sobre o item' },
      { nome: 'ativo', tipo: 'BOOLEAN', nullable: 'NOT NULL DEFAULT 1', comentario: 'Status ativo/inativo do item' }
    ]
    
    // Adicionar campos que não existem
    for (const campo of camposParaAdicionar) {
      if (!existingCols.has(campo.nome)) {
        try {
          const sql = `ALTER TABLE estoque_itens ADD COLUMN ${campo.nome} ${campo.tipo} ${campo.nullable} COMMENT '${campo.comentario}'`
          await prisma.$executeRawUnsafe(sql)
          console.log(`✅ Campo ${campo.nome} adicionado`)
        } catch (e: any) {
          console.log(`⚠️ Erro ao adicionar campo ${campo.nome}: ${e.message}`)
        }
      } else {
        console.log(`ℹ️ Campo ${campo.nome} já existe`)
      }
    }
    
    // Verificar resultado final
    const finalColumns = await prisma.$queryRaw<Array<{COLUMN_NAME: string, DATA_TYPE: string, IS_NULLABLE: string}>>`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = 'comunikapp' 
      AND TABLE_NAME = 'estoque_itens'
      ORDER BY ORDINAL_POSITION
    `
    
    console.log('📋 Colunas finais da tabela:')
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`)
    })
    
    console.log('✅ Campos adicionados com sucesso!')
    
  } catch (e: any) {
    console.error('❌ Erro ao adicionar campos:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

