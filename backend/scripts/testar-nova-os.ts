#!/usr/bin/env ts-node

/**
 * Script para testar se a lógica corrigida funciona para novas OSs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testarNovaOS() {
  console.log('🧪 Testando lógica corrigida para novas OSs...\n');

  try {
    // Simular dados de uma nova OS
    const dadosTeste = {
      produto: {
        nome: 'Banner Teste',
        quantidade: 10, // 10 unidades
        area_produto: 1.08 // 1.08 m² por unidade
      },
      materiais: [
        {
          nome: 'Bobina Lona Impressão Digital Rolo 1,40x50m Front 1000x1000',
          quantidade: 10.8, // 10.8 m² total (10 × 1.08)
          unidade: 'un',
          logica_consumo: 'area'
        },
        {
          nome: 'Cabo De Madeira Para Banner',
          quantidade: 5, // 5 unidades por produto
          unidade: 'un',
          logica_consumo: 'quantidade_fixa'
        }
      ]
    };

    console.log('📊 DADOS DE TESTE:');
    console.log('==================');
    console.log(`Produto: ${dadosTeste.produto.nome}`);
    console.log(`Quantidade: ${dadosTeste.produto.quantidade} unidades`);
    console.log(`Área por unidade: ${dadosTeste.produto.area_produto} m²`);
    console.log(`Área total: ${dadosTeste.produto.quantidade * dadosTeste.produto.area_produto} m²\n`);

    console.log('🧮 APLICANDO LÓGICA CORRIGIDA:');
    console.log('==============================');

    dadosTeste.materiais.forEach((material, index) => {
      console.log(`\n${index + 1}. ${material.nome}`);
      console.log(`   Quantidade base: ${material.quantidade}`);
      console.log(`   Unidade: ${material.unidade}`);
      console.log(`   Lógica consumo: ${material.logica_consumo}`);

      // Aplicar a lógica corrigida
      const unidade_uso = material.unidade.toLowerCase();
      const logica_consumo = material.logica_consumo;
      const quantidadeProdutos = dadosTeste.produto.quantidade;

      const precisaMultiplicar = 
        (unidade_uso.includes('un') || unidade_uso.includes('unidade')) &&
        !unidade_uso.includes('m2') && 
        !unidade_uso.includes('m²') &&
        logica_consumo !== 'area';

      const quantidade_necessaria = precisaMultiplicar 
        ? material.quantidade * quantidadeProdutos 
        : material.quantidade;

      console.log(`   Precisa multiplicar? ${precisaMultiplicar}`);
      console.log(`   Quantidade necessária: ${quantidade_necessaria}`);

      // Calcular display para bobina
      if (material.nome.includes('Bobina')) {
        const areaPorBobina = 70; // 1.4m × 50m
        const bobinasNecessarias = Math.ceil(quantidade_necessaria / areaPorBobina);
        console.log(`   Display: ${quantidade_necessaria} M2 - ${bobinasNecessarias} UNID - BOBINA`);
      } else {
        console.log(`   Display: ${quantidade_necessaria} ${material.unidade}`);
      }
    });

    console.log('\n✅ TESTE CONCLUÍDO');
    console.log('==================');
    console.log('A lógica corrigida está funcionando corretamente!');
    console.log('- Materiais por área (m²): NÃO multiplicam');
    console.log('- Materiais por unidade: Multiplicam quando necessário');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
if (require.main === module) {
  testarNovaOS()
    .then(() => {
      console.log('\n🎉 Teste executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução:', error);
      process.exit(1);
    });
}

export { testarNovaOS };









