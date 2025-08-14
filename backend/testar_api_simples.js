const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testarAPI() {
  try {
    console.log('🔍 Testando API de estoque...');
    
    const lojaId = 'cme1ops150000w4ikkdtq0h3x';
    const tableName = 'itens_estoque';
    
    // Query direta como o service faz
    const sql = `
      SELECT 
        t.id AS id,
        NULL AS insumoId,
        t.localizacao_id AS localizacaoId,
        COALESCE(t.nome, '') AS insumoNome,
        t.quantidade AS quantidadeAtual,
        t.quantidadeReservada AS quantidadeReservada,
        t.estoque_minimo AS estoqueMinimo,
        t.estoque_maximo AS estoqueMaximo,
        COALESCE(t.unidadeMedida, '') AS unidadeCompra,
        t.precoUnitario AS valorUnitario,
        t.dataUltimaMov AS dataUltimaMov,
        t.criado_em AS createdAt,
        COALESCE(l.codigo, '') AS localizacaoCodigo
      FROM ${tableName} t
      LEFT JOIN localizacoes l ON l.id = t.localizacao_id
      WHERE t.loja_id = ?
      ORDER BY t.id DESC
    `;
    
    const items = await prisma.$queryRawUnsafe(sql, lojaId);
    
    console.log(`\n📊 Resultado: ${items.length} itens encontrados`);
    
    if (items.length > 0) {
      console.log('\n✅ Itens:');
      items.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.insumoNome}`);
        console.log(`     Quantidade: ${item.quantidadeAtual} ${item.unidadeCompra}`);
        console.log(`     Localização: ${item.localizacaoCodigo}`);
        console.log(`     Valor: R$ ${item.valorUnitario}`);
        console.log('');
      });
    }
    
    // Simular resposta da API
    const apiResponse = {
      data: items,
      total: items.length,
      page: 1,
      limit: 20,
    };
    
    console.log('\n📋 Resposta da API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testarAPI();
