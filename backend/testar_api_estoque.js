const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testarAPIEstoque() {
  try {
    console.log('🔍 Testando API de estoque...');
    
    // Gerar um token válido para teste
    const payload = {
      sub: 'cme1ops150000w4ikkdtq0h3x', // loja_id
      name: 'Comunikapp',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
    };
    
    const token = jwt.sign(payload, 'seu_jwt_secret_aqui', { algorithm: 'HS256' });
    console.log(`🔑 Token gerado: ${token.substring(0, 50)}...`);
    
    // Simular a chamada da API
    const lojaId = 'cme1ops150000w4ikkdtq0h3x';
    
    // Usar o service diretamente
    const { EstoqueSimpleService } = require('./src/estoque/services/estoque-simple.service.ts');
    const service = new EstoqueSimpleService(prisma);
    
    const context = { lojaId };
    const result = await service.listarItensEstoque(context, {});
    
    console.log('\n📊 Resultado da API:');
    console.log(`Total de itens: ${result.total}`);
    console.log(`Dados: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.data && result.data.length > 0) {
      console.log('\n✅ Itens encontrados:');
      result.data.forEach((item, i) => {
        console.log(`  ${i + 1}. ${item.insumoNome} - ${item.quantidadeAtual} ${item.unidadeCompra}`);
      });
    } else {
      console.log('\n❌ Nenhum item encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testarAPIEstoque();
