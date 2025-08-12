const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verificarDadosEstoque() {
  try {
    console.log('🔍 Verificando dados da tabela itens_estoque...');
    
    // Verificar estrutura da tabela
    const colunas = await prisma.$queryRaw`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'itens_estoque'
      ORDER BY ORDINAL_POSITION
    `;
    
    console.log('\n📋 Estrutura da tabela itens_estoque:');
    colunas.forEach(col => {
      console.log(`  ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar total de registros
    const total = await prisma.$queryRaw`SELECT COUNT(*) as total FROM itens_estoque`;
    console.log(`\n📊 Total de registros: ${total[0].total}`);
    
    if (total[0].total > 0) {
      // Verificar alguns registros
      const registros = await prisma.$queryRaw`
        SELECT id, loja_id, codigo, nome, quantidade, unidade_medida, preco_unitario, criado_em
        FROM itens_estoque 
        LIMIT 5
      `;
      
      console.log('\n📦 Primeiros registros:');
      registros.forEach((reg, i) => {
        console.log(`  ${i + 1}. ID: ${reg.id}`);
        console.log(`     Loja: ${reg.loja_id}`);
        console.log(`     Código: ${reg.codigo}`);
        console.log(`     Nome: ${reg.nome}`);
        console.log(`     Quantidade: ${reg.quantidade}`);
        console.log(`     Unidade: ${reg.unidade_medida}`);
        console.log(`     Preço: ${reg.preco_unitario}`);
        console.log(`     Criado: ${reg.criado_em}`);
        console.log('');
      });
    }
    
    // Verificar se há localizações
    const totalLocalizacoes = await prisma.$queryRaw`SELECT COUNT(*) as total FROM localizacoes`;
    console.log(`📍 Total de localizações: ${totalLocalizacoes[0].total}`);
    
    if (totalLocalizacoes[0].total > 0) {
      const localizacoes = await prisma.$queryRaw`
        SELECT id, codigo, nome, tipo, loja_id
        FROM localizacoes 
        LIMIT 3
      `;
      
      console.log('\n📍 Primeiras localizações:');
      localizacoes.forEach((loc, i) => {
        console.log(`  ${i + 1}. ID: ${loc.id}`);
        console.log(`     Código: ${loc.codigo}`);
        console.log(`     Nome: ${loc.nome}`);
        console.log(`     Tipo: ${loc.tipo}`);
        console.log(`     Loja: ${loc.loja_id}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verificarDadosEstoque();
