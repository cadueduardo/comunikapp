/**
 * Demo da correção de materiais no preview do orçamento
 * Execute com: npx ts-node src/components/ui/shared/utils/__tests__/demo-correcao-preview.ts
 */

import { calcularProdutosPreview } from '../preview-calculo.helpers';

// Mock dos dados de insumos (baseado nos dados reais do sistema)
const mockInsumos = [
  {
    id: 'lona',
    nome: 'Bobina Lona Impressão Digital',
    unidade_uso: 'm²',
    custo_compra: 507,
    quantidade_compra: 50,
    quantidade_uso: 1,
  },
  {
    id: 'cabo',
    nome: 'Cabo De Madeira Para Banner',
    unidade_uso: 'cm',
    custo_compra: 3545.5,
    quantidade_compra: 50,
    quantidade_uso: 1,
  },
  {
    id: 'corda',
    nome: 'Cordão Para Banner',
    unidade_uso: 'cm',
    custo_compra: 2.05,
    quantidade_compra: 205,
    quantidade_uso: 1,
  },
  {
    id: 'ponteira',
    nome: 'Ponteira Para Banner',
    unidade_uso: 'unidades',
    custo_compra: 130,
    quantidade_compra: 1000,
    quantidade_uso: 1,
  },
];

// Mock dos datasets
const mockDatasets = {
  insumos: mockInsumos,
  maquinas: [],
  funcoes: [],
  servicos: [],
  custosIndiretos: [],
};

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

function demonstrarCorrecaoPreview() {
  console.log('🎯 DEMONSTRAÇÃO DA CORREÇÃO NO PREVIEW DO ORÇAMENTO');
  console.log('==================================================\n');

  // Dados do exemplo do usuário (25 banners)
  const itensProduto = [
    {
      nome_servico: 'Banner 90x120cm',
      quantidade_produto: 25,
      area_produto: 1.08, // 0.9m * 1.2m
      materiais: [
        {
          insumo_id: 'lona',
          quantidade: 27.00, // 1.08m² * 25 unidades
        },
        {
          insumo_id: 'cabo',
          quantidade: 90, // 90cm por banner
        },
        {
          insumo_id: 'corda',
          quantidade: 120, // 120cm por banner
        },
        {
          insumo_id: 'ponteira',
          quantidade: 2, // 2 unidades por banner
        },
      ],
      maquinas: [],
      funcoes: [],
      servicos: [],
    },
  ];

  console.log('📋 DADOS DE ENTRADA:');
  console.log('--------------------');
  console.log(`Produto: ${itensProduto[0].nome_servico}`);
  console.log(`Quantidade: ${itensProduto[0].quantidade_produto} unidades`);
  console.log(`Área por unidade: ${itensProduto[0].area_produto}m²`);
  console.log('');

  console.log('📦 MATERIAIS NO FORMULÁRIO:');
  console.log('---------------------------');
  itensProduto[0].materiais.forEach(material => {
    const insumo = mockInsumos.find(i => i.id === material.insumo_id);
    console.log(`• ${insumo?.nome}: ${formatarQuantidade(material.quantidade, insumo?.unidade_uso || '')}`);
  });
  console.log('');

  console.log('🔧 EXECUTANDO CÁLCULO DO PREVIEW...\n');

  // Executar cálculo do preview
  const resultado = calcularProdutosPreview(
    itensProduto,
    mockDatasets,
    15, // custos indiretos %
    30, // margem %
    18, // impostos %
    5   // comissão %
  );

  console.log('✅ RESULTADO APÓS CORREÇÃO:');
  console.log('----------------------------');
  
  const produto = resultado.produtos[0];
  const materiais = produto.materiais;

  materiais.forEach(material => {
    const insumoOriginal = itensProduto[0].materiais.find(m => m.insumo_id === material.insumo_id);
    const mudou = insumoOriginal && material.quantidade !== insumoOriginal.quantidade;

    console.log(`• ${material.nome}`);
    console.log(`  Quantidade: ${formatarQuantidade(material.quantidade, material.unidade_consumo || '')} ${mudou ? '🔧' : '✅'}`);
    console.log(`  Custo unitário: ${formatarMoeda(material.custo_unitario)}`);
    console.log(`  Custo total: ${formatarMoeda(material.custo_total)} ${mudou ? '🔧' : '✅'}`);
    
    if (mudou) {
      const diferencaQuantidade = material.quantidade - insumoOriginal!.quantidade;
      const diferencaCusto = material.custo_total - (insumoOriginal!.quantidade * material.custo_unitario);
      console.log(`  📈 Diferença: +${formatarQuantidade(diferencaQuantidade, material.unidade_consumo || '')} / +${formatarMoeda(diferencaCusto)}`);
    }
    console.log('');
  });

  // Calcular totais
  const totalMateriais = materiais.reduce((acc, material) => acc + material.custo_total, 0);
  const custoTotalProducao = produto.custo_total_producao;
  const precoTotal = produto.preco_total;

  console.log('💰 RESUMO FINANCEIRO:');
  console.log('---------------------');
  console.log(`Total materiais: ${formatarMoeda(totalMateriais)}`);
  console.log(`Custo total produção: ${formatarMoeda(custoTotalProducao)}`);
  console.log(`Preço total (25 unidades): ${formatarMoeda(precoTotal)}`);
  console.log(`Preço unitário: ${formatarMoeda(precoTotal / 25)}`);
  console.log('');

  console.log('🎉 CORREÇÃO NO PREVIEW CONCLUÍDA!');
  console.log('==================================');
  console.log('Agora o preview do orçamento mostra os valores corretos em tempo real.');
  console.log('Os materiais não-m² são multiplicados automaticamente pela quantidade do produto.');
}

// Executar demonstração
demonstrarCorrecaoPreview();
















