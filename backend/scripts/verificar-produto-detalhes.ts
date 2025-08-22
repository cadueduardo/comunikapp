import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Verificando detalhes completos do produto Banner...')
    
    // Buscar o produto Banner com todos os detalhes
    const produto = await prisma.templateProduto.findFirst({
      where: { nome: 'Banner' },
      include: {
        itens: {
          include: {
            insumo: true,
          },
        },
        maquinas: {
          include: {
            maquina: true,
          },
        },
        funcoes: {
          include: {
            funcao: true,
          },
        },
      },
    });

    if (!produto) {
      console.log('❌ Produto Banner não encontrado')
      return
    }

    console.log(`\n📋 Dados do Produto:`)
    console.log(`  - Nome: ${produto.nome}`)
    console.log(`  - Categoria: ${produto.categoria}`)
    console.log(`  - Serviço: ${produto.nome_servico}`)
    console.log(`  - Descrição: ${produto.descricao_produto}`)
    console.log(`  - Horas de produção: ${produto.horas_producao}`)
    console.log(`  - Largura: ${produto.largura_produto} ${produto.unidade_medida_produto}`)
    console.log(`  - Altura: ${produto.altura_produto} ${produto.unidade_medida_produto}`)
    console.log(`  - Área: ${produto.area_produto} m²`)
    console.log(`  - Quantidade padrão: ${produto.quantidade_padrao}`)
    console.log(`  - Valor calculado: ${(produto as any).valor_calculado}`)
    
    console.log(`\n📦 Itens do Produto:`)
    for (const item of produto.itens) {
      const insumo = await prisma.insumo.findUnique({
        where: { id: item.insumo_id }
      })
      
      if (insumo) {
        console.log(`  - ${insumo.nome}`)
        console.log(`    Quantidade: ${item.quantidade}`)
        console.log(`    Custo unitário: ${item.custo_unitario}`)
        console.log(`    Custo total: ${item.custo_total}`)
        console.log(`    Insumo - Custo unitário: ${insumo.custo_unitario}`)
        console.log(`    Insumo - Quantidade compra: ${insumo.quantidade_compra}`)
        console.log(`    Insumo - Fator conversão: ${insumo.fator_conversao}`)
        console.log(`    Insumo - Unidade uso: ${insumo.unidade_uso}`)
        console.log(`    Insumo - Dimensões: ${insumo.largura}x${insumo.altura} ${insumo.unidade_dimensao}`)
        console.log(`    Insumo - Tipo cálculo: ${insumo.tipo_calculo}`)
        console.log('')
      }
    }
    
    console.log(`\n⚙️ Máquinas do Produto:`)
    for (const maquina of produto.maquinas) {
      const maquinaEncontrada = await prisma.maquina.findUnique({
        where: { id: maquina.maquina_id }
      })
      
      if (maquinaEncontrada) {
        console.log(`  - ${maquinaEncontrada.nome}`)
        console.log(`    Horas utilizadas: ${maquina.horas_utilizadas}`)
        console.log(`    Custo total: ${maquina.custo_total}`)
        console.log(`    Máquina - Custo hora: ${maquinaEncontrada.custo_hora}`)
        console.log('')
      }
    }
    
    console.log(`\n👷 Funções do Produto:`)
    for (const funcao of produto.funcoes) {
      const funcaoEncontrada = await prisma.funcao.findUnique({
        where: { id: funcao.funcao_id }
      })
      
      if (funcaoEncontrada) {
        console.log(`  - ${funcaoEncontrada.nome}`)
        console.log(`    Horas trabalhadas: ${funcao.horas_trabalhadas}`)
        console.log(`    Custo total: ${funcao.custo_total}`)
        console.log(`    Função - Custo hora: ${funcaoEncontrada.custo_hora}`)
        console.log('')
      }
    }
    
    // Verificar se a área está sendo usada como quantidade
    const areaProduto = Number(produto.area_produto)
    if (areaProduto > 0) {
      console.log(`\n🔍 Análise da Área:`)
      console.log(`  - Área do produto: ${areaProduto} m²`)
      console.log(`  - Se usada como quantidade, o custo seria:`)
      
      // Recalcular com a área como quantidade
      let custoMaterialTotal = 0
      for (const item of produto.itens) {
        const insumo = await prisma.insumo.findUnique({
          where: { id: item.insumo_id }
        })
        
        if (insumo) {
          const quantidade = Number(item.quantidade)
          const custoUnitario = Number(insumo.custo_unitario)
          const quantidadeCompra = Number(insumo.quantidade_compra)
          const fatorConversao = Number(insumo.fator_conversao)
          
          let custoPorUnidadeUso = 0
          if (quantidadeCompra > 0 && fatorConversao > 0) {
            custoPorUnidadeUso = custoUnitario / (quantidadeCompra * fatorConversao)
          }
          
          const custoTotal = quantidade * custoPorUnidadeUso
          custoMaterialTotal += custoTotal
        }
      }
      
      const custoMaquinasTotal = produto.maquinas.reduce((total, m) => {
        const maquina = produto.maquinas.find(maq => maq.id === m.id)
        if (maquina) {
          return total + Number(maquina.custo_total)
        }
        return total
      }, 0)
      
      const custoFuncoesTotal = produto.funcoes.reduce((total, f) => {
        const funcao = produto.funcoes.find(func => func.id === f.id)
        if (funcao) {
          return total + Number(funcao.custo_total)
        }
        return total
      }, 0)
      
      const custoTotalProducao = custoMaterialTotal + custoMaquinasTotal + custoFuncoesTotal
      const custoPorMetroQuadrado = custoTotalProducao / areaProduto
      
      console.log(`  - Custo total produção: R$ ${custoTotalProducao.toFixed(2)}`)
      console.log(`  - Custo por m²: R$ ${custoPorMetroQuadrado.toFixed(2)}`)
      console.log(`  - Custo para ${areaProduto} m²: R$ ${(custoPorMetroQuadrado * areaProduto).toFixed(2)}`)
    }
    
    // Verificar se o valor foi realmente atualizado
    console.log(`\n🔍 Verificação final:`)
    const produtoVerificado = await prisma.templateProduto.findFirst({
      where: { nome: 'Banner' }
    });
    
    if (produtoVerificado) {
      console.log(`  - Valor no banco: ${(produtoVerificado as any).valor_calculado}`)
      console.log(`  - Atualizado em: ${produtoVerificado.atualizado_em}`)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao verificar produto:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
