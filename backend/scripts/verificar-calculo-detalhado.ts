import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Verificando cálculo detalhado do produto Banner...')
    
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

    console.log(`✅ Produto encontrado: ${produto.nome}`)
    console.log(`  - ID: ${produto.id}`)
    console.log(`  - Valor atual no banco: ${(produto as any).valor_calculado}`)
    
    // Simular o cálculo manual para ver onde está a diferença
    console.log('\n🧮 Cálculo manual:')
    
    // 1. Custos dos itens
    let custoMaterialTotal = 0
    console.log('\n📦 Custos dos itens:')
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
        
        console.log(`  - ${insumo.nome}: ${quantidade} x R$ ${custoPorUnidadeUso.toFixed(2)} = R$ ${custoTotal.toFixed(2)}`)
      }
    }
    console.log(`  📊 Total materiais: R$ ${custoMaterialTotal.toFixed(2)}`)
    
    // 2. Custos das máquinas
    let custoMaquinasTotal = 0
    console.log('\n⚙️ Custos das máquinas:')
    for (const maquina of produto.maquinas) {
      const maquinaEncontrada = await prisma.maquina.findUnique({
        where: { id: maquina.maquina_id }
      })
      
      if (maquinaEncontrada) {
        const horas = Number(maquina.horas_utilizadas)
        const custoHora = Number(maquinaEncontrada.custo_hora)
        const custoTotal = horas * custoHora
        custoMaquinasTotal += custoTotal
        
        console.log(`  - ${maquinaEncontrada.nome}: ${horas}h x R$ ${custoHora}/h = R$ ${custoTotal.toFixed(2)}`)
      }
    }
    console.log(`  📊 Total máquinas: R$ ${custoMaquinasTotal.toFixed(2)}`)
    
    // 3. Custos das funções
    let custoFuncoesTotal = 0
    console.log('\n👷 Custos das funções:')
    for (const funcao of produto.funcoes) {
      const funcaoEncontrada = await prisma.funcao.findUnique({
        where: { id: funcao.funcao_id }
      })
      
      if (funcaoEncontrada) {
        const horas = Number(funcao.horas_trabalhadas)
        const custoHora = Number(funcaoEncontrada.custo_hora)
        const custoTotal = horas * custoHora
        custoFuncoesTotal += custoTotal
        
        console.log(`  - ${funcaoEncontrada.nome}: ${horas}h x R$ ${custoHora}/h = R$ ${custoTotal.toFixed(2)}`)
      }
    }
    console.log(`  📊 Total funções: R$ ${custoFuncoesTotal.toFixed(2)}`)
    
    // 4. Custo total de produção
    const custoTotalProducao = custoMaterialTotal + custoMaquinasTotal + custoFuncoesTotal
    console.log(`\n📊 Custo total de produção: R$ ${custoTotalProducao.toFixed(2)}`)
    
    // 5. Custos indiretos (baseado em horas)
    const horasProducao = produto.maquinas.reduce((total, m) => total + Number(m.horas_utilizadas), 0) +
                          produto.funcoes.reduce((total, f) => total + Number(f.horas_trabalhadas), 0)
    
    // Buscar custos indiretos da loja
    const custosIndiretos = await prisma.custoindireto.findMany({
      where: { 
        loja_id: produto.loja_id,
        ativo: true
      }
    })
    
    let custoIndiretoTotal = 0
    if (custosIndiretos.length > 0) {
      const totalCustosIndiretosMensais = custosIndiretos.reduce((total, custo) => total + Number(custo.valor_mensal), 0)
      const horasProdutivasMes = 352 // Valor padrão
      const custoIndiretoPorHora = totalCustosIndiretosMensais / horasProdutivasMes
      custoIndiretoTotal = custoIndiretoPorHora * horasProducao
      
      console.log(`\n🏢 Custos indiretos:`)
      console.log(`  - Total mensal: R$ ${totalCustosIndiretosMensais.toFixed(2)}`)
      console.log(`  - Horas produtivas/mês: ${horasProdutivasMes}h`)
      console.log(`  - Custo por hora: R$ ${custoIndiretoPorHora.toFixed(2)}/h`)
      console.log(`  - Horas de produção: ${horasProducao}h`)
      console.log(`  - Custo indireto total: R$ ${custoIndiretoTotal.toFixed(2)}`)
    }
    
    // 6. Custo total com indiretos
    const custoTotalComIndiretos = custoTotalProducao + custoIndiretoTotal
    console.log(`\n📊 Custo total com indiretos: R$ ${custoTotalComIndiretos.toFixed(2)}`)
    
    // 7. Margem de lucro (padrão 30%)
    const margemLucroPercentual = 30
    const margemLucroValor = custoTotalComIndiretos * (margemLucroPercentual / 100)
    const subtotalComLucro = custoTotalComIndiretos + margemLucroValor
    
    console.log(`\n💰 Margem de lucro:`)
    console.log(`  - Percentual: ${margemLucroPercentual}%`)
    console.log(`  - Valor: R$ ${margemLucroValor.toFixed(2)}`)
    console.log(`  - Subtotal com lucro: R$ ${subtotalComLucro.toFixed(2)}`)
    
    // 8. Impostos (padrão 18%)
    const impostosPercentual = 18
    const impostosValor = subtotalComLucro * (impostosPercentual / 100)
    const precoFinal = subtotalComLucro + impostosValor
    
    console.log(`\n🏛️ Impostos:`)
    console.log(`  - Percentual: ${impostosPercentual}%`)
    console.log(`  - Valor: R$ ${impostosValor.toFixed(2)}`)
    console.log(`  - Preço final: R$ ${precoFinal.toFixed(2)}`)
    
    // 9. Comparação
    console.log(`\n🔍 Comparação:`)
    console.log(`  - Valor no banco: R$ ${(produto as any).valor_calculado}`)
    console.log(`  - Cálculo manual: R$ ${precoFinal.toFixed(2)}`)
    console.log(`  - Preview (esperado): R$ 63,35`)
    
    if (Math.abs(precoFinal - 63.35) < 0.01) {
      console.log(`  ✅ Cálculo manual confere com o preview!`)
    } else {
      console.log(`  ❌ Diferença encontrada!`)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao verificar cálculo:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
