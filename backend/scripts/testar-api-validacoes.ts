/**
 * Script para testar a API de validações
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarAPI() {
  console.log('🧪 Testando API de validações...\n');

  try {
    // 1. Testar busca de regras
    console.log('1️⃣ Buscando regras...');
    const regras = await prisma.regraValidacao.findMany({
      where: { ativo: true },
      orderBy: { prioridade: 'asc' }
    });
    console.log(`✅ Encontradas ${regras.length} regras ativas`);

    // 2. Testar estatísticas
    console.log('\n2️⃣ Calculando estatísticas...');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [
      totalRegras,
      regrasAtivas,
      execucoesHoje,
      regrasPorCategoria
    ] = await Promise.all([
      prisma.regraValidacao.count(),
      prisma.regraValidacao.count({ where: { ativo: true } }),
      prisma.execucaoRegra.count({
        where: { criado_em: { gte: hoje } }
      }),
      prisma.regraValidacao.groupBy({
        by: ['categoria'],
        where: { ativo: true },
        _count: { id: true }
      })
    ]);

    const stats = {
      totalRegras,
      regrasAtivas,
      execucoesHoje,
      taxaSucesso: 100, // Simulado
      regrasPorCategoria: regrasPorCategoria.map(item => ({
        categoria: item.categoria,
        total: item._count.id,
        ativas: item._count.id
      })),
      execucoesRecentes: []
    };

    console.log('✅ Estatísticas calculadas:');
    console.log(`   - Total de regras: ${stats.totalRegras}`);
    console.log(`   - Regras ativas: ${stats.regrasAtivas}`);
    console.log(`   - Execuções hoje: ${stats.execucoesHoje}`);
    console.log(`   - Regras por categoria: ${stats.regrasPorCategoria.length}`);

    // 3. Simular resposta da API
    console.log('\n3️⃣ Simulando resposta da API...');
    const respostaAPI = {
      data: regras.map(regra => ({
        id: regra.id,
        nome: regra.nome,
        descricao: regra.descricao,
        tipo: regra.tipo,
        categoria: regra.categoria,
        ativo: regra.ativo,
        prioridade: regra.prioridade,
        _count: { execucoes: 0 },
        criado_em: regra.criado_em.toISOString(),
        atualizado_em: regra.atualizado_em.toISOString()
      })),
      total: regras.length,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    console.log('✅ Resposta da API simulada:');
    console.log(`   - Data length: ${respostaAPI.data.length}`);
    console.log(`   - Total: ${respostaAPI.total}`);

    // 4. Verificar se as regras estão corretas
    console.log('\n4️⃣ Verificando regras...');
    regras.forEach((regra, index) => {
      console.log(`   ${index + 1}. ${regra.nome} (${regra.categoria}) - ${regra.ativo ? 'Ativo' : 'Inativo'}`);
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testarAPI();







