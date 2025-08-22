import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const prisma = new PrismaClient()
  try {
    // Pegar o nome do arquivo SQL dos argumentos da linha de comando
    const sqlFileName = process.argv[2]
    if (!sqlFileName) {
      console.error('❌ Por favor, forneça o nome do arquivo SQL como argumento')
      console.error('Exemplo: npx tsx scripts/executar-sql.ts add_valor_calculado_column.sql')
      process.exit(1)
    }

    const sqlPath = join(__dirname, '..', sqlFileName)
    console.log(`📁 Executando arquivo: ${sqlPath}`)
    
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Dividir em statements; simples por ;
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)

    console.log(`📋 Executando ${statements.length} statements SQL...`)

    for (const stmt of statements) {
      if (stmt.trim()) {
        console.log(`🔧 Executando: ${stmt.substring(0, 50)}...`)
        // Usar executeRawUnsafe para aceitar DDL
        await prisma.$executeRawUnsafe(stmt)
      }
    }
    
    console.log('✅ Script SQL executado com sucesso!')
  } catch (e: any) {
    console.error('❌ Falha ao executar SQL:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

