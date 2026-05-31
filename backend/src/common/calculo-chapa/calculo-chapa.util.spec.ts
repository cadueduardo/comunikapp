import { calcularChapa } from './calculo-chapa.util';
import { MetodoCobrancaChapa } from './calculo-chapa.types';

describe('calcularChapa', () => {
  it('simula chapa sem estoque cobrando area liquida', () => {
    const resultado = calcularChapa({
      larguraPeca: 500,
      alturaPeca: 500,
      quantidade: 2,
      larguraChapa: 1000,
      alturaChapa: 1000,
      unidadeDimensao: 'mm',
      metodoCobranca: MetodoCobrancaChapa.AREA_LIQUIDA,
      custoM2: 100,
    });

    expect(resultado.peca_cabe_na_chapa).toBe(true);
    expect(resultado.area_chapa_m2).toBe(1);
    expect(resultado.area_pecas_m2).toBe(0.5);
    expect(resultado.chapas_necessarias).toBe(1);
    expect(resultado.custo_material).toBe(50);
  });

  it('simula cobranca por chapa inteira', () => {
    const resultado = calcularChapa({
      larguraPeca: 0.5,
      alturaPeca: 0.5,
      quantidade: 2,
      larguraChapa: 1,
      alturaChapa: 1,
      metodoCobranca: MetodoCobrancaChapa.CHAPA_INTEIRA,
      custoM2: 100,
    });

    expect(resultado.area_considerada_custo_m2).toBe(1);
    expect(resultado.custo_material).toBe(100);
  });

  it('simula cobranca por area com perda', () => {
    const resultado = calcularChapa({
      larguraPeca: 1,
      alturaPeca: 1,
      quantidade: 1,
      larguraChapa: 2,
      alturaChapa: 1,
      perdaPercent: 10,
      metodoCobranca: MetodoCobrancaChapa.AREA_COM_PERDA,
      custoM2: 50,
    });

    expect(resultado.area_com_perda_m2).toBe(1.1);
    expect(resultado.area_considerada_custo_m2).toBe(1.1);
    expect(resultado.custo_material).toBe(55);
  });

  it('converte peça em cm e mídia em metros separadamente', () => {
    const resultado = calcularChapa({
      larguraPeca: 90,
      alturaPeca: 120,
      quantidade: 1,
      larguraChapa: 1.4,
      alturaChapa: 50,
      perdaPercent: 5,
      unidadeDimensaoPeca: 'cm',
      unidadeDimensaoChapa: 'm',
      metodoCobranca: MetodoCobrancaChapa.AREA_LIQUIDA,
      custoM2: 10.14,
    });

    expect(resultado.peca_cabe_na_chapa).toBe(true);
    expect(resultado.area_pecas_m2).toBe(1.08);
    expect(resultado.chapas_necessarias).toBe(1);
    expect(resultado.custo_material).toBeCloseTo(10.95, 1);
  });

  it('indica quando a peca nao cabe na chapa', () => {
    const resultado = calcularChapa({
      larguraPeca: 2,
      alturaPeca: 1,
      quantidade: 1,
      larguraChapa: 1,
      alturaChapa: 1,
      metodoCobranca: MetodoCobrancaChapa.AREA_LIQUIDA,
      custoM2: 10,
    });

    expect(resultado.peca_cabe_na_chapa).toBe(false);
    expect(resultado.mensagens).toContain(
      'A peça não cabe na chapa selecionada.',
    );
  });
});
