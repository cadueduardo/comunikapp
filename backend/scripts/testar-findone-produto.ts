import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🧪 Testando método findOne do produto Banner...')
    
    // Buscar o produto Banner
    const produto = await prisma.templateProduto.findFirst({
      where: { nome: 'Banner' },
      include: {
        itens: {
          include: {
            insumo: {
              include: {
                categoria: true,
                fornecedor: true,
              },
            },
          },
        },
        maquinas: {
          include: {
            maquina: true,
          },
        },
        funcoes: {
          include: {
            funcao: {
              include: {
                maquina: true,
              },
            },
          },
        },
      },
    });

    if (!produto) {
      console.log('❌ Produto Banner não encontrado')
      return
    }

    console.log(`✅ Produto encontrado: ${produto.nome}`)
    console.log(`  - ID: ${produto.id}`)
    console.log(`  - Valor calculado: ${(produto as any).valor_calculado}`)
    
    console.log(`\n📦 Itens (${produto.itens.length}):`)
    for (const item of produto.itens) {
      console.log(`  - ${item.insumo.nome}`)
      console.log(`    Quantidade: ${item.quantidade}`)
      console.log(`    Custo unitário: ${item.custo_unitario}`)
      console.log(`    Custo total: ${item.custo_total}`)
    }
    
    console.log(`\n⚙️ Máquinas (${produto.maquinas.length}):`)
    for (const maquina of produto.maquinas) {
      console.log(`  - ${maquina.maquina.nome}`)
      console.log(`    Horas utilizadas: ${maquina.horas_utilizadas}`)
      console.log(`    Custo total: ${maquina.custo_total}`)
    }
    
    console.log(`\n👷 Funções (${produto.funcoes.length}):`)
    for (const funcao of produto.funcoes) {
      console.log(`  - ${funcao.funcao.nome}`)
      console.log(`    Horas trabalhadas: ${funcao.horas_trabalhadas}`)
      console.log(`    Custo total: ${funcao.custo_total}`)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao testar findOne:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

