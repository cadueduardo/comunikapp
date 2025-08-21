import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('🔍 Verificando dados da tabela estoque_itens...')
    
    // Verificar se há dados
    const dados = await prisma.$queryRaw<Array<any>>`
      SELECT * FROM estoque_itens LIMIT 5
    `
    
    if (dados.length === 0) {
      console.log('❌ Nenhum dado encontrado na tabela estoque_itens')
      return
    }
    
    console.log(`✅ Encontrados ${dados.length} registros`)
    
    // Mostrar dados do primeiro registro
    const primeiro = dados[0]
    console.log('📋 Primeiro registro:')
    console.log(`  - id: ${primeiro.id}`)
    console.log(`  - nome: ${primeiro.nome || 'NULL'}`)
    console.log(`  - codigo: ${primeiro.codigo || 'NULL'}`)
    console.log(`  - quantidadeAtual: ${primeiro.quantidadeAtual || 'NULL'}`)
    console.log(`  - precoUnitario: ${primeiro.precoUnitario || 'NULL'}`)
    console.log(`  - ativo: ${primeiro.ativo || 'NULL'}`)
    console.log(`  - lojaId: ${primeiro.lojaId || 'NULL'}`)
    
    // Calcular valor total manualmente
    const valorTotal = Number(primeiro.quantidadeAtual || 0) * Number(primeiro.precoUnitario || 0)
    console.log(`💰 Valor total calculado: R$ ${valorTotal.toFixed(2)}`)
    
    // Verificar se há dados de localizações
    const localizacoes = await prisma.$queryRaw<Array<any>>`
      SELECT COUNT(*) as total FROM estoque_localizacoes WHERE ativo = 1
    `
    console.log(`📍 Total de localizações ativas: ${localizacoes[0]?.total || 0}`)
    
  } catch (e: any) {
    console.error('❌ Erro ao verificar dados:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()

