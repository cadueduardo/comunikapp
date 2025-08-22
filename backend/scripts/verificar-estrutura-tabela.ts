import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Verificando estrutura da tabela item_template_produtos...')
    
    // Verificar estrutura da tabela
    const estrutura = await prisma.$queryRaw`DESCRIBE item_template_produtos`
    console.log('📋 Estrutura da tabela:', estrutura)
    
    // Verificar dados de exemplo
    const itens = await (prisma as any).itemTemplateProduto.findMany({
      take: 2,
      include: {
        insumo: true,
        templateProduto: true
      }
    })
    
    console.log('\n📦 Dados de exemplo:')
    for (const item of itens) {
      console.log('  - Item ID:', item.id)
      console.log('    Insumo:', item.insumo?.nome)
      console.log('    Produto:', item.templateProduto?.nome)
      console.log('    Campos disponíveis:', Object.keys(item))
      console.log('')
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao verificar estrutura:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

