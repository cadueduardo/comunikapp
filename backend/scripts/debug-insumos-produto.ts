import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Debug: Valores dos insumos do produto Banner')
    
    // Buscar o produto Banner com seus itens
    const produto = await prisma.templateProduto.findFirst({
      where: { nome: 'Banner' },
      include: {
        itens: {
          include: {
            insumo: true,
          },
        },
      },
    });

    if (!produto) {
      console.log('❌ Produto Banner não encontrado')
      return
    }

    console.log(`✅ Produto: ${produto.nome}`)
    console.log(`  - ID: ${produto.id}`)
    console.log(`  - Área: ${produto.area_produto} m²`)
    
    console.log('\n📦 Itens do produto:')
    let custoTotalCalculado = 0
    
    for (const item of produto.itens) {
      const insumo = item.insumo
      const quantidade = Number(item.quantidade)
      const custoUnitario = Number(insumo.custo_unitario)
      const quantidadeCompra = Number(insumo.quantidade_compra)
      const fatorConversao = Number(insumo.fator_conversao)
      
      // Calcular custo por unidade de uso
      let custoPorUnidadeUso = 0
      if (quantidadeCompra > 0 && fatorConversao > 0) {
        custoPorUnidadeUso = custoUnitario / (quantidadeCompra * fatorConversao)
      }
      
      // Custo total para este item
      const custoTotalItem = quantidade * custoPorUnidadeUso
      custoTotalCalculado += custoTotalItem
      
      console.log(`  - ${insumo.nome}:`)
      console.log(`    Quantidade: ${quantidade}`)
      console.log(`    Custo unitário: R$ ${custoUnitario.toFixed(2)}`)
      console.log(`    Quantidade compra: ${quantidadeCompra}`)
      console.log(`    Fator conversão: ${fatorConversao}`)
      console.log(`    Custo por unidade uso: R$ ${custoPorUnidadeUso.toFixed(4)}`)
      console.log(`    Custo total item: R$ ${custoTotalItem.toFixed(2)}`)
      console.log(`    Custo total no banco: R$ ${(item as any).custo_total || 'N/A'}`)
      console.log('')
    }
    
    console.log(`📊 Resumo:`)
    console.log(`  - Total de itens: ${produto.itens.length}`)
    console.log(`  - Custo total calculado: R$ ${custoTotalCalculado.toFixed(2)}`)
    console.log(`  - Valor esperado no grid: R$ ${custoTotalCalculado.toFixed(2)}`)
    console.log(`  - Valor atual no grid: R$ 10.232,79`)
    
    if (Math.abs(custoTotalCalculado - 10232.79) < 1) {
      console.log(`  ✅ Valores conferem!`)
    } else {
      console.log(`  ❌ Diferença encontrada: R$ ${Math.abs(custoTotalCalculado - 10232.79).toFixed(2)}`)
    }
    
    // Verificar se há algum problema com os campos custo_total no banco
    console.log('\n🔍 Verificando campos custo_total no banco:')
    for (const item of produto.itens) {
      const custoTotalBanco = (item as any).custo_total
      console.log(`  - ${item.insumo.nome}: R$ ${custoTotalBanco || 'NULL'}`)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao debugar insumos:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

