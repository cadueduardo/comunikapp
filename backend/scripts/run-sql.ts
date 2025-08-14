import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  const prisma = new PrismaClient()
  try {
    const sqlPath = join(__dirname, '..', 'sql', 'create_estoque_lotes_if_not_exists.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    // dividir em statements; simples por ;
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)

    for (const stmt of statements) {
      // usar executeRawUnsafe para aceitar DDL
      await prisma.$executeRawUnsafe(stmt)
    }
    console.log('✅ Tabela estoque_lotes verificada/criada com sucesso')
  } catch (e: any) {
    console.error('❌ Falha ao executar SQL:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


