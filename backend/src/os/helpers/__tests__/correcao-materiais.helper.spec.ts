import { CorrecaoMateriaisHelper, InsumoCalculado } from '../correcao-materiais.helper';

describe('CorrecaoMateriaisHelper', () => {
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

  describe('corrigirInsumosCalculados', () => {
    it('deve manter materiais m² inalterados', () => {
      const quantidadeProduto = 25;
      const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        quantidadeProduto
      );

      const lona = resultado.find(i => i.insumo_id === 'lona');
      expect(lona?.quantidade_necessaria).toBe(27.00);
      expect(lona?.custo_total).toBe(273.78);
    });

    it('deve multiplicar materiais cm pela quantidade do produto', () => {
      const quantidadeProduto = 25;
      const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        quantidadeProduto
      );

      const cabo = resultado.find(i => i.insumo_id === 'cabo');
      expect(cabo?.quantidade_necessaria).toBe(2250); // 90 * 25
      expect(cabo?.custo_total).toBe(159547.50); // 2250 * 70.91

      const corda = resultado.find(i => i.insumo_id === 'corda');
      expect(corda?.quantidade_necessaria).toBe(3000); // 120 * 25
      expect(corda?.custo_total).toBe(30.00); // 3000 * 0.01
    });

    it('deve multiplicar materiais unidades pela quantidade do produto', () => {
      const quantidadeProduto = 25;
      const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        quantidadeProduto
      );

      const ponteira = resultado.find(i => i.insumo_id === 'ponteira');
      expect(ponteira?.quantidade_necessaria).toBe(50); // 2 * 25
      expect(ponteira?.custo_total).toBe(6.50); // 50 * 0.13
    });

    it('deve retornar array vazio para entrada vazia', () => {
      const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados([], 25);
      expect(resultado).toEqual([]);
    });

    it('deve retornar insumos originais para quantidade zero', () => {
      const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        0
      );
      expect(resultado).toEqual(insumosExemplo);
    });

    it('deve retornar insumos originais para quantidade negativa', () => {
      const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        -5
      );
      expect(resultado).toEqual(insumosExemplo);
    });
  });

  describe('validarCorrecao', () => {
    it('deve validar correção bem-sucedida', () => {
      const quantidadeProduto = 25;
      const insumosCorrigidos = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        quantidadeProduto
      );

      const validacao = CorrecaoMateriaisHelper.validarCorrecao(
        insumosExemplo,
        insumosCorrigidos,
        quantidadeProduto
      );

      expect(validacao.valido).toBe(true);
      expect(validacao.erros).toHaveLength(0);
    });

    it('deve detectar quantidade incorreta', () => {
      const quantidadeProduto = 25;
      const insumosCorrigidos = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        quantidadeProduto
      );

      // Simular erro alterando um valor
      insumosCorrigidos[1].quantidade_necessaria = 1000; // Deveria ser 2250

      const validacao = CorrecaoMateriaisHelper.validarCorrecao(
        insumosExemplo,
        insumosCorrigidos,
        quantidadeProduto
      );

      expect(validacao.valido).toBe(false);
      expect(validacao.erros.length).toBeGreaterThan(0);
      expect(validacao.erros[0]).toContain('Quantidade incorreta');
    });

    it('deve detectar custo total incorreto', () => {
      const quantidadeProduto = 25;
      const insumosCorrigidos = CorrecaoMateriaisHelper.corrigirInsumosCalculados(
        insumosExemplo,
        quantidadeProduto
      );

      // Simular erro alterando um custo
      insumosCorrigidos[1].custo_total = 100000; // Deveria ser 159547.50

      const validacao = CorrecaoMateriaisHelper.validarCorrecao(
        insumosExemplo,
        insumosCorrigidos,
        quantidadeProduto
      );

      expect(validacao.valido).toBe(false);
      expect(validacao.erros.length).toBeGreaterThan(0);
      expect(validacao.erros[0]).toContain('Custo total incorreto');
    });
  });

  describe('deveAplicarMultiplicacao', () => {
    it('deve identificar unidades que precisam de multiplicação', () => {
      const unidadesParaMultiplicar = ['cm', 'm', 'unidades', 'kg', 'litros'];
      
      unidadesParaMultiplicar.forEach(unidade => {
        // Teste indireto através da correção
        const insumo = {
          insumo_id: 'test',
          nome: 'Teste',
          quantidade_necessaria: 10,
          unidade,
          custo_unitario: 1,
          custo_total: 10,
          disponivel_estoque: true,
        };

        const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados([insumo], 5);
        expect(resultado[0].quantidade_necessaria).toBe(50); // 10 * 5
      });
    });

    it('deve identificar unidades que NÃO precisam de multiplicação', () => {
      const unidadesSemMultiplicacao = ['m²', 'm2', 'metro quadrado'];
      
      unidadesSemMultiplicacao.forEach(unidade => {
        // Teste indireto através da correção
        const insumo = {
          insumo_id: 'test',
          nome: 'Teste',
          quantidade_necessaria: 10,
          unidade,
          custo_unitario: 1,
          custo_total: 10,
          disponivel_estoque: true,
        };

        const resultado = CorrecaoMateriaisHelper.corrigirInsumosCalculados([insumo], 5);
        expect(resultado[0].quantidade_necessaria).toBe(10); // Não multiplicado
      });
    });
  });
});






