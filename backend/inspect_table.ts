import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  const tables = ['localizacoes', 'itens_estoque', 'estoque_lotes']
  for (const t of tables) {
    try {
      const cols = await prisma.$queryRawUnsafe<any[]>(`DESCRIBE ${t}`)
      console.log(`\n=== ${t} ===`)
      for (const c of cols) {
        console.log(`${c.Field || c.COLUMN_NAME}\t${c.Type || ''}`)
      }
    } catch (e) {
      console.error('Erro ao descrever tabela', t, e)
    }
  }
  await prisma.$disconnect()
}

run()


