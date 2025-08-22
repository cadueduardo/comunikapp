import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join, resolve } from 'path'

async function main() {
  const prisma = new PrismaClient()
  try {
    const argPath = process.argv[2]
    const sqlPath = argPath ? resolve(process.cwd(), argPath) : join(__dirname, '..', 'sql', 'create_estoque_lotes_if_not_exists.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(Boolean)

    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt)
    }
    console.log('✅ SQL executado com sucesso:', sqlPath)
  } catch (e: any) {
    console.error('❌ Falha ao executar SQL:', e.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()


