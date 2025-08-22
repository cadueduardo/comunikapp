import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Verificando tabelas do banco...')
    
    // Tentar acessar as tabelas para ver os nomes reais
    const tables = await prisma.$queryRaw`SHOW TABLES LIKE '%produto%'`
    console.log('📋 Tabelas encontradas:', tables)
    
    // Tentar acessar a tabela de produtos
    try {
      const produtos = await prisma.templateProduto.findMany({
        take: 1,
        select: { id: true, nome: true }
      })
      console.log('✅ TemplateProduto acessível:', produtos)
    } catch (e: any) {
      console.log('❌ Erro ao acessar TemplateProduto:', e.message)
    }
    
    // Tentar acessar a tabela de itens
    try {
      const itens = await (prisma as any).itemTemplateProduto.findMany({
        take: 1,
        select: { id: true }
      })
      console.log('✅ ItemTemplateProduto acessível:', itens)
    } catch (e: any) {
      console.log('❌ Erro ao acessar ItemTemplateProduto:', e.message)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao verificar tabelas:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

