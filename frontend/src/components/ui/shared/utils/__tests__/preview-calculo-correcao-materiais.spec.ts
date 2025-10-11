/**
 * Teste para validar a correção de materiais no preview do orçamento
 */

import { calcularProdutosPreview } from '../preview-calculo.helpers';

// Mock dos dados de insumos
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

// Mock dos dados de máquinas, funções e serviços
const mockDatasets = {
  insumos: mockInsumos,
  maquinas: [],
  funcoes: [],
  servicos: [],
  custosIndiretos: [],
};

describe('Preview Cálculo - Correção de Materiais', () => {
  it('deve aplicar correção de materiais no preview do orçamento', () => {
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

    // Executar cálculo do preview
    const resultado = calcularProdutosPreview(
      itensProduto,
      mockDatasets,
      15, // custos indiretos %
      30, // margem %
      18, // impostos %
      5   // comissão %
    );

    // Verificar se há produtos calculados
    expect(resultado.produtos).toHaveLength(1);
    
    const produto = resultado.produtos[0];
    const materiais = produto.materiais;

    // Verificar se há materiais calculados
    expect(materiais).toHaveLength(4);

    // Verificar Bobina Lona (m² - não deve ser multiplicada)
    const lona = materiais.find(m => m.insumo_id === 'lona');
    expect(lona?.quantidade).toBe(27.00); // Não multiplicado
    expect(lona?.custo_total).toBeCloseTo(273.78, 2); // 27 * 10.14

    // Verificar Cabo de Madeira (cm - deve ser multiplicado)
    const cabo = materiais.find(m => m.insumo_id === 'cabo');
    expect(cabo?.quantidade).toBe(2250); // 90 * 25
    expect(cabo?.custo_total).toBeCloseTo(159547.50, 2); // 2250 * 70.91

    // Verificar Cordão (cm - deve ser multiplicado)
    const corda = materiais.find(m => m.insumo_id === 'corda');
    expect(corda?.quantidade).toBe(3000); // 120 * 25
    expect(corda?.custo_total).toBeCloseTo(30.00, 2); // 3000 * 0.01

    // Verificar Ponteira (unidades - deve ser multiplicado)
    const ponteira = materiais.find(m => m.insumo_id === 'ponteira');
    expect(ponteira?.quantidade).toBe(50); // 2 * 25
    expect(ponteira?.custo_total).toBeCloseTo(6.50, 2); // 50 * 0.13

    // Verificar total de materiais
    const totalMateriais = materiais.reduce((acc, m) => acc + m.custo_total, 0);
    expect(totalMateriais).toBeCloseTo(159857.78, 2); // Soma de todos os materiais
  });

  it('deve manter compatibilidade com quantidade padrão (1)', () => {
    // Dados com quantidade padrão
    const itensProduto = [
      {
        nome_servico: 'Banner Teste',
        quantidade_produto: 1,
        materiais: [
          {
            insumo_id: 'cabo',
            quantidade: 90,
          },
        ],
        maquinas: [],
        funcoes: [],
        servicos: [],
      },
    ];

    const resultado = calcularProdutosPreview(
      itensProduto,
      mockDatasets,
      15, 30, 18, 5
    );

    const produto = resultado.produtos[0];
    const cabo = produto.materiais.find(m => m.insumo_id === 'cabo');
    
    // Com quantidade 1, não deve haver multiplicação
    expect(cabo?.quantidade).toBe(90);
  });

  it('deve aplicar correção apenas para materiais não-m²', () => {
    const itensProduto = [
      {
        nome_servico: 'Produto Teste',
        quantidade_produto: 10,
        materiais: [
          {
            insumo_id: 'lona',
            quantidade: 5.0,
          },
          {
            insumo_id: 'cabo',
            quantidade: 100,
          },
        ],
        maquinas: [],
        funcoes: [],
        servicos: [],
      },
    ];

    const resultado = calcularProdutosPreview(
      itensProduto,
      mockDatasets,
      15, 30, 18, 5
    );

    const produto = resultado.produtos[0];
    const materiais = produto.materiais;

    // Lona (m²) não deve ser multiplicada
    const lona = materiais.find(m => m.insumo_id === 'lona');
    expect(lona?.quantidade).toBe(5.0);

    // Cabo (cm) deve ser multiplicado
    const cabo = materiais.find(m => m.insumo_id === 'cabo');
    expect(cabo?.quantidade).toBe(1000); // 100 * 10
  });
});
















