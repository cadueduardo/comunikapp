const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

async function testarAPIEstoque() {
  try {
    console.log('🔍 Testando consulta simples do estoque...');

    // Gerar um token válido para teste (não usado neste script atualmente)
    const payload = {
      sub: 'cme1ops150000w4ikkdtq0h3x',
      name: 'Comunikapp',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
    };
    const token = jwt.sign(payload, 'seu_jwt_secret_aqui', { algorithm: 'HS256' });
    console.log(`🔑 Token gerado: ${token.substring(0, 50)}...`);

    const lojaId = 'cme1ops150000w4ikkdtq0h3x';

    // Consulta simples via Prisma (raw) apenas para validar acesso ao BD
    const prisma = new PrismaClient();
    const rows = await prisma.$queryRawUnsafe(
      'SELECT COUNT(*) as total FROM localizacoes WHERE loja_id = ? LIMIT 1',
      lojaId,
    );
    console.log('\n📊 Resultado:');
    console.log(`Total de localizações da loja: ${Number(rows?.[0]?.total ?? 0)}`);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  }
}

testarAPIEstoque();
