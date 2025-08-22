import { PrismaClient } from '@prisma/client'
import { OrcamentosService } from '../src/orcamentos/orcamentos.service'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🧪 Testando motor de cálculo de orçamentos diretamente...')
    
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
    console.log(`  - Área: ${produto.area_produto} m²`)
    console.log(`  - Quantidade padrão: ${produto.quantidade_padrao}`)
    console.log(`  - Horas produção: ${produto.horas_producao}`)
    
    // Montar DTO como o service faz
    const dtoParaOrcamento = {
      nome_servico: produto.nome_servico,
      descricao: produto.descricao_produto || undefined,
      horas_producao: Number(produto.horas_producao) || 0,
      // IMPORTANTE: Usar área do produto se quantidade_padrao for null
      quantidade_produto: Number(produto.quantidade_padrao) || Number(produto.area_produto) || 1,
      itens: produto.itens.map((item) => ({
        insumo_id: item.insumo_id,
        quantidade: Number(item.quantidade) || 0,
      })),
      maquinas: produto.maquinas.map((maquina) => ({
        maquina_id: maquina.maquina_id,
        horas_utilizadas: Number(maquina.horas_utilizadas) || 0,
      })),
      funcoes: produto.funcoes.map((funcao) => ({
        funcao_id: funcao.funcao_id,
        horas_trabalhadas: Number(funcao.horas_trabalhadas) || 0,
      })),
      margem_lucro_customizada: undefined,
      impostos_customizados: undefined,
    };

    console.log('\n🔍 DTO para cálculo:')
    console.log(JSON.stringify(dtoParaOrcamento, null, 2))
    
    // Buscar a loja
    const loja = await prisma.loja.findFirst({
      where: { id: produto.loja_id }
    });
    
    if (loja) {
      console.log(`\n🏪 Loja: ${loja.nome}`)
      console.log(`  - Margem padrão: ${loja.margem_lucro_padrao}%`)
      console.log(`  - Impostos padrão: ${loja.impostos_padrao}%`)
      console.log(`  - Horas produtivas/mês: ${loja.horas_produtivas_mensais}`)
    }
    
    // Testar o motor de cálculo diretamente
    console.log('\n🚀 Testando motor de cálculo...')
    
    const orcamentosService = new OrcamentosService(prisma as any)
    
    try {
      const calculo = await orcamentosService.calcularOrcamento(
        dtoParaOrcamento,
        produto.loja_id
      );
      
      console.log('\n📊 Resultado do motor de cálculo:')
      console.log(`  - Custo material: R$ ${calculo.custos.custo_material.toFixed(2)}`)
      console.log(`  - Custo máquinas: R$ ${calculo.custos.custo_maquinaria.toFixed(2)}`)
      console.log(`  - Custo funções: R$ ${calculo.custos.custo_mao_obra.toFixed(2)}`)
      console.log(`  - Custo indireto: R$ ${calculo.custos.custo_indireto.toFixed(2)}`)
      console.log(`  - Custo total produção: R$ ${calculo.custos.custo_total_producao.toFixed(2)}`)
      console.log(`  - Margem lucro: ${calculo.custos.margem_lucro_percentual}%`)
      console.log(`  - Margem valor: R$ ${calculo.custos.margem_lucro_valor.toFixed(2)}`)
      console.log(`  - Subtotal com lucro: R$ ${calculo.custos.subtotal_com_lucro.toFixed(2)}`)
      console.log(`  - Impostos: ${calculo.custos.impostos_percentual}%`)
      console.log(`  - Impostos valor: R$ ${calculo.custos.impostos_valor.toFixed(2)}`)
      console.log(`  - Preço final: R$ ${calculo.custos.preco_final.toFixed(2)}`)
      
      // Comparação
      console.log(`\n🔍 Comparação:`)
      console.log(`  - Valor no banco: ${(produto as any).valor_calculado}`)
      console.log(`  - Motor de cálculo: R$ ${calculo.custos.preco_final.toFixed(2)}`)
      console.log(`  - Preview (esperado): R$ 63,35`)
      
      if (Math.abs(Number(calculo.custos.preco_final) - 63.35) < 0.01) {
        console.log(`  ✅ Motor de cálculo confere com o preview!`)
      } else {
        console.log(`  ❌ Diferença encontrada!`)
      }
      
    } catch (error) {
      console.error('❌ Erro no motor de cálculo:', error)
    }
    
  } catch (e: any) {
    console.error('❌ Erro ao testar motor:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

