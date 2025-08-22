import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Debug: Preview vs Backend - Diferença de valores')
    
    // Buscar o produto Banner
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

    console.log(`✅ Produto: ${produto.nome}`)
    console.log(`  - Área: ${produto.area_produto} m²`)
    console.log(`  - Quantidade padrão: ${produto.quantidade_padrao}`)
    console.log(`  - Horas produção: ${produto.horas_producao}`)
    
    // Buscar a loja
    const loja = await prisma.loja.findFirst({
      where: { id: produto.loja_id }
    });
    
    console.log(`\n🏪 Loja: ${loja?.nome}`)
    console.log(`  - Margem padrão: ${loja?.margem_lucro_padrao}%`)
    console.log(`  - Impostos padrão: ${loja?.impostos_padrao}%`)
    
    // TESTE 1: Cálculo usando área do produto (como backend faz)
    console.log('\n🧮 TESTE 1: Cálculo usando área do produto (Backend)')
    const quantidadeBackend = Number(produto.quantidade_padrao) || Number(produto.area_produto) || 1
    console.log(`  - Quantidade usada: ${quantidadeBackend}`)
    
    // Calcular custos como o backend faz
    let custoMaterialBackend = 0
    for (const item of produto.itens) {
      const insumo = item.insumo
      const quantidade = Number(item.quantidade)
      const custoUnitario = Number(insumo.custo_unitario)
      const quantidadeCompra = Number(insumo.quantidade_compra)
      const fatorConversao = Number(insumo.fator_conversao)
      
      let custoPorUnidadeUso = 0
      if (quantidadeCompra > 0 && fatorConversao > 0) {
        custoPorUnidadeUso = custoUnitario / (quantidadeCompra * fatorConversao)
      }
      
      const custoTotal = quantidade * custoPorUnidadeUso
      custoMaterialBackend += custoTotal
      
      console.log(`    - ${insumo.nome}: ${quantidade} x R$ ${custoPorUnidadeUso.toFixed(4)} = R$ ${custoTotal.toFixed(2)}`)
    }
    console.log(`  📊 Total materiais: R$ ${custoMaterialBackend.toFixed(2)}`)
    
    // Custos máquinas e funções
    let custoMaquinasBackend = 0
    for (const maquina of produto.maquinas) {
      const custoHora = Number(maquina.maquina.custo_hora)
      const horas = Number(maquina.horas_utilizadas)
      const custoTotal = custoHora * horas
      custoMaquinasBackend += custoTotal
      console.log(`    - ${maquina.maquina.nome}: ${horas}h x R$ ${custoHora}/h = R$ ${custoTotal.toFixed(2)}`)
    }
    console.log(`  📊 Total máquinas: R$ ${custoMaquinasBackend.toFixed(2)}`)
    
    let custoFuncoesBackend = 0
    for (const funcao of produto.funcoes) {
      const custoHora = Number(funcao.funcao.custo_hora)
      const horas = Number(funcao.horas_trabalhadas)
      const custoTotal = custoHora * horas
      custoFuncoesBackend += custoTotal
      console.log(`    - ${funcao.funcao.nome}: ${horas}h x R$ ${custoHora}/h = R$ ${custoTotal.toFixed(2)}`)
    }
    console.log(`  📊 Total funções: R$ ${custoFuncoesBackend.toFixed(2)}`)
    
    // Custo total de produção
    const custoTotalProducaoBackend = custoMaterialBackend + custoMaquinasBackend + custoFuncoesBackend
    console.log(`  📊 Custo total produção: R$ ${custoTotalProducaoBackend.toFixed(2)}`)
    
    // Custos indiretos
    const custosIndiretos = await prisma.custoindireto.findMany({
      where: { 
        loja_id: produto.loja_id,
        ativo: true
      }
    })
    
    let custoIndiretoBackend = 0
    if (custosIndiretos.length > 0) {
      const totalCustosIndiretosMensais = custosIndiretos.reduce((total, custo) => total + Number(custo.valor_mensal), 0)
      const horasProdutivasMes = loja?.horas_produtivas_mensais || 352
      const custoIndiretoPorHora = totalCustosIndiretosMensais / horasProdutivasMes
      const horasProducao = produto.maquinas.reduce((total, m) => total + Number(m.horas_utilizadas), 0) +
                            produto.funcoes.reduce((total, f) => total + Number(f.horas_trabalhadas), 0)
      custoIndiretoBackend = custoIndiretoPorHora * horasProducao
      
      console.log(`  🏢 Custos indiretos: ${horasProducao}h x R$ ${custoIndiretoPorHora.toFixed(2)}/h = R$ ${custoIndiretoBackend.toFixed(2)}`)
    }
    
    // Custo total com indiretos
    const custoTotalComIndiretosBackend = custoTotalProducaoBackend + custoIndiretoBackend
    console.log(`  📊 Custo total com indiretos: R$ ${custoTotalComIndiretosBackend.toFixed(2)}`)
    
    // Aplicar quantidade
    const custoTotalComIndiretosComQuantidadeBackend = custoTotalComIndiretosBackend * quantidadeBackend
    console.log(`  📊 Custo total com indiretos x ${quantidadeBackend}: R$ ${custoTotalComIndiretosComQuantidadeBackend.toFixed(2)}`)
    
    // Margem e impostos
    const margemLucro = loja?.margem_lucro_padrao || 30
    const impostos = loja?.impostos_padrao || 18
    
    const margemLucroValorBackend = custoTotalComIndiretosComQuantidadeBackend * (margemLucro / 100)
    const subtotalComLucroBackend = custoTotalComIndiretosComQuantidadeBackend + margemLucroValorBackend
    const impostosValorBackend = subtotalComLucroBackend * (impostos / 100)
    const precoFinalBackend = subtotalComLucroBackend + impostosValorBackend
    
    console.log(`  💰 Margem ${margemLucro}%: R$ ${margemLucroValorBackend.toFixed(2)}`)
    console.log(`  🏛️ Impostos ${impostos}%: R$ ${impostosValorBackend.toFixed(2)}`)
    console.log(`  🎯 Preço final: R$ ${precoFinalBackend.toFixed(2)}`)
    
    // TESTE 2: Tentar diferentes quantidades para encontrar o preview
    console.log('\n🧮 TESTE 2: Tentar diferentes quantidades para encontrar o preview')
    
    const quantidadesTeste = [0.1, 0.15, 0.2, 0.25, 0.3, 0.5, 0.75, 1.0]
    
    for (const qtd of quantidadesTeste) {
      const custoTotalComIndiretosComQuantidade = custoTotalComIndiretosBackend * qtd
      const margemLucroValor = custoTotalComIndiretosComQuantidade * (margemLucro / 100)
      const subtotalComLucro = custoTotalComIndiretosComQuantidade + margemLucroValor
      const impostosValor = subtotalComLucro * (impostos / 100)
      const precoFinal = subtotalComLucro + impostosValor
      
      const diferenca = Math.abs(precoFinal - 63.35)
      console.log(`  - Quantidade ${qtd}: R$ ${precoFinal.toFixed(2)} (diferença: R$ ${diferenca.toFixed(2)})`)
      
      if (diferenca < 1) {
        console.log(`  🎯 ENCONTRADO! Quantidade ${qtd} dá R$ ${precoFinal.toFixed(2)} (próximo de R$ 63,35)`)
      }
    }
    
    // TESTE 3: Verificar se há algum problema com os custos base
    console.log('\n🧮 TESTE 3: Verificar custos base (sem quantidade)')
    console.log(`  - Custo material base: R$ ${custoMaterialBackend.toFixed(2)}`)
    console.log(`  - Custo máquinas base: R$ ${custoMaquinasBackend.toFixed(2)}`)
    console.log(`  - Custo funções base: R$ ${custoFuncoesBackend.toFixed(2)}`)
    console.log(`  - Custo indireto base: R$ ${custoIndiretoBackend.toFixed(2)}`)
    console.log(`  - Custo total base: R$ ${custoTotalComIndiretosBackend.toFixed(2)}`)
    
    // TESTE 4: Comparar com valor atual no banco
    console.log('\n🔍 TESTE 4: Comparação com banco')
    console.log(`  - Valor no banco: ${(produto as any).valor_calculado}`)
    console.log(`  - Cálculo backend: R$ ${precoFinalBackend.toFixed(2)}`)
    console.log(`  - Preview esperado: R$ 63,35`)
    console.log(`  - Diferença backend vs preview: R$ ${Math.abs(precoFinalBackend - 63.35).toFixed(2)}`)
    
  } catch (e: any) {
    console.error('❌ Erro ao debugar:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

