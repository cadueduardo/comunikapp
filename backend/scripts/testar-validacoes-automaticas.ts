/**
 * Script para testar o sistema de validações automáticas
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarValidacoesAutomaticas() {
  console.log('🧪 Testando Sistema de Validações Automáticas...\n');

  try {
    // 1. Testar criação de regra de validação
    console.log('1️⃣ Criando regra de validação de exemplo...');
    
    const regra = await prisma.regraValidacao.create({
      data: {
        nome: 'Validação de Estoque Mínimo - Teste',
        descricao: 'Regra de teste para verificar estoque mínimo',
        tipo: 'VALIDACAO',
        categoria: 'ESTOQUE',
        ativo: true,
        prioridade: 1,
        loja_id: null, // Regra global
        condicoes: {
          campo: 'quantidade_estoque',
          operador: 'greater_than',
          valor: 10,
          mensagem_erro: 'Estoque insuficiente para esta OS',
          mensagem_alerta: 'Estoque baixo, verifique disponibilidade'
        },
        acoes: {
          tipo: 'bloquear',
          status_os: 'BLOQUEADA',
          notificar: ['admin', 'gerente'],
          parametros: {},
          delay: 0
        },
        criado_por: 'teste-script',
        atualizado_por: 'teste-script'
      }
    });

    console.log('✅ Regra criada:', {
      id: regra.id,
      nome: regra.nome,
      tipo: regra.tipo,
      categoria: regra.categoria,
      ativo: regra.ativo
    });

    // 2. Testar busca de regras ativas
    console.log('\n2️⃣ Buscando regras ativas...');
    
    const regrasAtivas = await prisma.regraValidacao.findMany({
      where: {
        ativo: true,
        OR: [
          { loja_id: null }, // Regras globais
          { loja_id: 'loja-teste' } // Regras específicas da loja
        ]
      },
      orderBy: { prioridade: 'asc' }
    });

    console.log('✅ Regras ativas encontradas:', regrasAtivas.length);
    regrasAtivas.forEach(regra => {
      console.log(`   - ${regra.nome} (${regra.categoria}) - Prioridade: ${regra.prioridade}`);
    });

    // 3. Buscar uma OS existente ou criar uma para teste
    console.log('\n3️⃣ Buscando OS existente para teste...');
    
    let osExistente = await prisma.ordemServico.findFirst({
      select: { id: true, numero: true }
    });

    if (!osExistente) {
      console.log('   Nenhuma OS encontrada, criando uma para teste...');
      
      // Buscar uma loja existente
      const lojaExistente = await prisma.loja.findFirst({
        select: { id: true }
      });

      if (!lojaExistente) {
        throw new Error('Nenhuma loja encontrada no banco de dados');
      }

      // Buscar um cliente existente
      const clienteExistente = await prisma.cliente.findFirst({
        where: { loja_id: lojaExistente.id },
        select: { id: true }
      });

      if (!clienteExistente) {
        throw new Error('Nenhum cliente encontrado no banco de dados');
      }

      osExistente = await prisma.ordemServico.create({
        data: {
          numero: 'OS-TESTE-001',
          loja_id: lojaExistente.id,
          cliente_id: clienteExistente.id,
          nome_servico: 'Serviço de Teste',
          quantidade: 1,
          status: 'FILA'
        },
        select: { id: true, numero: true }
      });
    }

    console.log(`   Usando OS: ${osExistente.numero} (${osExistente.id})`);

    // 4. Testar criação de execução de regra
    console.log('\n4️⃣ Criando execução de regra de exemplo...');
    
    const execucao = await prisma.execucaoRegra.create({
      data: {
        regra_id: regra.id,
        os_id: osExistente.id,
        resultado: 'SUCESSO',
        mensagem: 'Validação de estoque aprovada',
        dados_execucao: {
          campo_avaliado: 'quantidade_estoque',
          valor_campo: 15,
          valor_esperado: 10,
          operador: 'greater_than',
          condicao_atendida: true
        },
        tempo_execucao: 150
      }
    });

    console.log('✅ Execução criada:', {
      id: execucao.id,
      regra_id: execucao.regra_id,
      os_id: execucao.os_id,
      resultado: execucao.resultado,
      tempo_execucao: execucao.tempo_execucao
    });

    // 5. Testar estatísticas
    console.log('\n5️⃣ Calculando estatísticas...');
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const [
      totalRegras,
      regrasAtivasCount,
      execucoesHoje,
      execucoesRecentes
    ] = await Promise.all([
      prisma.regraValidacao.count(),
      prisma.regraValidacao.count({ where: { ativo: true } }),
      prisma.execucaoRegra.count({
        where: { criado_em: { gte: hoje } }
      }),
      prisma.execucaoRegra.findMany({
        where: { criado_em: { gte: hoje } },
        take: 5,
        orderBy: { criado_em: 'desc' },
        include: {
          regra: {
            select: { nome: true, categoria: true }
          }
        }
      })
    ]);

    const sucessos = execucoesRecentes.filter(e => e.resultado === 'SUCESSO').length;
    const taxaSucesso = execucoesRecentes.length > 0 ? (sucessos / execucoesRecentes.length) * 100 : 0;

    console.log('✅ Estatísticas calculadas:');
    console.log(`   - Total de regras: ${totalRegras}`);
    console.log(`   - Regras ativas: ${regrasAtivasCount}`);
    console.log(`   - Execuções hoje: ${execucoesHoje}`);
    console.log(`   - Taxa de sucesso: ${taxaSucesso.toFixed(1)}%`);

    // 6. Testar regras por categoria
    console.log('\n6️⃣ Regras por categoria...');
    
    const regrasPorCategoria = await prisma.regraValidacao.groupBy({
      by: ['categoria'],
      where: { ativo: true },
      _count: { id: true }
    });

    console.log('✅ Regras por categoria:');
    regrasPorCategoria.forEach(item => {
      console.log(`   - ${item.categoria}: ${item._count.id} regras`);
    });

    // 7. Limpeza dos dados de teste
    console.log('\n7️⃣ Limpando dados de teste...');
    
    await prisma.execucaoRegra.deleteMany({
      where: { regra_id: regra.id }
    });
    
    await prisma.regraValidacao.delete({
      where: { id: regra.id }
    });

    console.log('✅ Dados de teste removidos');

    console.log('\n🎉 Teste concluído com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Criação de regras funcionando');
    console.log('   ✅ Busca de regras ativas funcionando');
    console.log('   ✅ Criação de execuções funcionando');
    console.log('   ✅ Cálculo de estatísticas funcionando');
    console.log('   ✅ Agrupamento por categoria funcionando');
    console.log('   ✅ Limpeza de dados funcionando');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testarValidacoesAutomaticas();
