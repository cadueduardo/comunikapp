import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔄 Atualizando valor do produto Banner...')
    
    // Verificar valor atual
    const produtoAntes = await prisma.templateProduto.findFirst({
      where: { nome: 'Banner' }
    });
    
    if (!produtoAntes) {
      console.log('❌ Produto Banner não encontrado')
      return
    }
    
    console.log(`📊 Valor antes: ${(produtoAntes as any).valor_calculado}`)
    
    // Atualizar o valor
    const resultado = await prisma.templateProduto.update({
      where: { id: produtoAntes.id },
      data: { valor_calculado: 63.35 } as any
    });
    
    console.log(`✅ Produto atualizado: ${resultado.nome}`)
    
    // Verificar se foi atualizado
    const produtoDepois = await prisma.templateProduto.findFirst({
      where: { nome: 'Banner' }
    });
    
    if (produtoDepois) {
      console.log(`📊 Valor depois: ${(produtoDepois as any).valor_calculado}`)
      console.log(`📅 Atualizado em: ${produtoDepois.atualizado_em}`)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao atualizar:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
