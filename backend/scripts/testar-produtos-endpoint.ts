import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🧪 Testando endpoint de produtos...')
    
    // Simular o que o service faz no findAll
    const produtos = await prisma.templateProduto.findMany({
      where: {
        loja_id: 'xyjrwbqff', // ID da loja do produto Banner
      },
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

    console.log(`📊 Produtos encontrados: ${produtos.length}`)
    
    for (const produto of produtos) {
      console.log(`\n🔍 Produto: ${produto.nome}`)
      console.log(`  - ID: ${produto.id}`)
      console.log(`  - Valor calculado atual: ${produto.valor_calculado}`)
      console.log(`  - Itens: ${produto.itens.length}`)
      console.log(`  - Máquinas: ${produto.maquinas.length}`)
      console.log(`  - Funções: ${produto.funcoes.length}`)
      
      // Verificar se tem valor_calculado
      if (!produto.valor_calculado || produto.valor_calculado === 0) {
        console.log(`  ⚠️  Produto sem valor_calculado - precisa ser calculado`)
      } else {
        console.log(`  ✅ Produto com valor_calculado: R$ ${produto.valor_calculado}`)
      }
    }
    
    // Verificar se o valor foi atualizado no banco
    const produtoAtualizado = await prisma.templateProduto.findFirst({
      where: { nome: 'Banner' }
    });
    
    if (produtoAtualizado) {
      console.log(`\n📊 Status no banco:`)
      console.log(`  - Nome: ${produtoAtualizado.nome}`)
      console.log(`  - Valor calculado: ${produtoAtualizado.valor_calculado}`)
      console.log(`  - Atualizado em: ${produtoAtualizado.atualizado_em}`)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao testar produtos:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

