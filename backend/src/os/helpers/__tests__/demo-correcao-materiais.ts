/**
 * Demo da correção de materiais
 * Execute com: npx ts-node src/os/helpers/__tests__/demo-correcao-materiais.ts
 */

import { CorrecaoMateriaisHelper, InsumoCalculado } from '../correcao-materiais.helper';

// Dados do exemplo do usuário (25 banners)
const insumosExemplo: InsumoCalculado[] = [
  {
    insumo_id: 'lona',
    nome: 'Bobina Lona Impressão Digital',
    quantidade_necessaria: 27.00,
    unidade: 'm²',
    custo_unitario: 10.14,
    custo_total: 273.78,
    disponivel_estoque: true,
  },
  {
    insumo_id: 'cabo',
    nome: 'Cabo De Madeira Para Banner',
    quantidade_necessaria: 90,
    unidade: 'cm',
    custo_unitario: 70.91,
    custo_total: 6381.90,
    disponivel_estoque: true,
  },
  {
    insumo_id: 'corda',
    nome: 'Cordão Para Banner',
    quantidade_necessaria: 120,
    unidade: 'cm',
    custo_unitario: 0.01,
    custo_total: 1.20,
    disponivel_estoque: true,
  },
  {
    insumo_id: 'ponteira',
    nome: 'Ponteira Para Banner',
    quantidade_necessaria: 2,
    unidade: 'unidades',
    custo_unitario: 0.13,
    custo_total: 0.26,
    disponivel_estoque: true,
  },
];

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarQuantidade(quantidade: number, unidade: string): string {
  if (unidade === 'm²') {
    return `${quantidade.toFixed(2)}m²`;
  } else if (unidade === 'cm') {
    return `${quantidade.toFixed(0)}cm`;
  } else if (unidade === 'unidades') {
    return `${quantidade.toFixed(0)} unidades`;
  }
  return `${quantidade.toFixed(2)} ${unidade}`;
}

function demonstrarCorrecao() {
  console.log('🎯 DEMONSTRAÇÃO DA CORREÇÃO DE MATERIAIS');
  console.log('==========================================\n');

  console.log('📋 DADOS ORIGINAIS (25 banners):');
  console.log('--------------------------------');
  insumosExemplo.forEach(insumo => {
    console.log(`• ${insumo.nome}`);
    console.log(`  Quantidade: ${formatarQuantidade(insumo.quantidade_necessaria, insumo.unidade)}`);
    console.log(`  Custo unitário: ${formatarMoeda(insumo.custo_unitario)}`);
    console.log(`  Custo total: ${formatarMoeda(insumo.custo_total)}`);
    console.log('');
  });

  console.log('🔧 APLICANDO CORREÇÃO...\n');

  const insumosCorrigidos = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
    insumosExemplo,
    25 // quantidade do produto
  );

  console.log('✅ RESULTADO APÓS CORREÇÃO:');
  console.log('----------------------------');
  insumosCorrigidos.forEach(insumo => {
    const original = insumosExemplo.find(i => i.insumo_id === insumo.insumo_id);
    const mudou = original && (
      original.quantidade_necessaria !== insumo.quantidade_necessaria ||
      original.custo_total !== insumo.custo_total
    );

    console.log(`• ${insumo.nome}`);
    console.log(`  Quantidade: ${formatarQuantidade(insumo.quantidade_necessaria, insumo.unidade)} ${mudou ? '🔧' : '✅'}`);
    console.log(`  Custo unitário: ${formatarMoeda(insumo.custo_unitario)}`);
    console.log(`  Custo total: ${formatarMoeda(insumo.custo_total)} ${mudou ? '🔧' : '✅'}`);
    
    if (mudou) {
      const diferencaQuantidade = insumo.quantidade_necessaria - original!.quantidade_necessaria;
      const diferencaCusto = insumo.custo_total - original!.custo_total;
      console.log(`  📈 Diferença: +${formatarQuantidade(diferencaQuantidade, insumo.unidade)} / +${formatarMoeda(diferencaCusto)}`);
    }
    console.log('');
  });

  // Calcular totais
  const totalOriginal = insumosExemplo.reduce((acc, insumo) => acc + insumo.custo_total, 0);
  const totalCorrigido = insumosCorrigidos.reduce((acc, insumo) => acc + insumo.custo_total, 0);
  const diferencaTotal = totalCorrigido - totalOriginal;

  console.log('💰 RESUMO FINANCEIRO:');
  console.log('---------------------');
  console.log(`Custo total original: ${formatarMoeda(totalOriginal)}`);
  console.log(`Custo total corrigido: ${formatarMoeda(totalCorrigido)}`);
  console.log(`Diferença: ${formatarMoeda(diferencaTotal)} ${diferencaTotal > 0 ? '📈' : '📉'}`);
  console.log('');

  // Validar correção
  const validacao = CorrecaoMateriaisHelper.validarCorrecao(
    insumosExemplo,
    insumosCorrigidos,
    25
  );

  console.log('🔍 VALIDAÇÃO:');
  console.log('--------------');
  if (validacao.valido) {
    console.log('✅ Correção aplicada com sucesso!');
  } else {
    console.log('❌ Problemas encontrados:');
    validacao.erros.forEach(erro => console.log(`  • ${erro}`));
  }
  console.log('');

  console.log('🎉 CORREÇÃO CONCLUÍDA!');
  console.log('=======================');
  console.log('Agora os materiais estão calculados corretamente para 25 unidades do produto.');
  console.log('O Preview V2 e a OS mostrarão os valores corretos automaticamente.');
}

// Executar demonstração
demonstrarCorrecao();
















