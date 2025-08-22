import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Debug: Produto Banner para edição')
    
    // Buscar o produto Banner com TODOS os relacionamentos
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

    console.log(`✅ Produto: ${produto.nome}`)
    console.log(`  - ID: ${produto.id}`)
    console.log(`  - Área: ${produto.area_produto} m²`)
    
    console.log('\n📦 Itens (Materiais):')
    console.log(`  - Total: ${produto.itens.length}`)
    for (const item of produto.itens) {
      console.log(`    - ${item.insumo.nome}: ${item.quantidade} (ID: ${item.id})`)
    }
    
    console.log('\n⚙️ Máquinas:')
    console.log(`  - Total: ${produto.maquinas.length}`)
    for (const maquina of produto.maquinas) {
      console.log(`    - ${maquina.maquina.nome}: ${maquina.horas_utilizadas}h (ID: ${maquina.id})`)
    }
    
    console.log('\n👷 Funções:')
    console.log(`  - Total: ${produto.funcoes.length}`)
    for (const funcao of produto.funcoes) {
      console.log(`    - ${funcao.funcao.nome}: ${funcao.horas_trabalhadas}h (ID: ${funcao.id})`)
    }
    
    // Verificar se há dados para cada tipo
    console.log('\n🔍 Resumo dos dados:')
    console.log(`  - Itens: ${produto.itens.length > 0 ? '✅' : '❌'} (${produto.itens.length})`)
    console.log(`  - Máquinas: ${produto.maquinas.length > 0 ? '✅' : '❌'} (${produto.maquinas.length})`)
    console.log(`  - Funções: ${produto.funcoes.length > 0 ? '✅' : '❌'} (${produto.funcoes.length})`)
    
    // Verificar se os dados estão sendo retornados corretamente
    if (produto.maquinas.length === 0) {
      console.log('\n⚠️ PROBLEMA: Máquinas não encontradas!')
      console.log('  - Verificar se há máquinas cadastradas para este produto')
      console.log('  - Verificar se o relacionamento está correto')
    }
    
    if (produto.funcoes.length === 0) {
      console.log('\n⚠️ PROBLEMA: Funções não encontradas!')
      console.log('  - Verificar se há funções cadastradas para este produto')
      console.log('  - Verificar se o relacionamento está correto')
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao debugar produto:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

