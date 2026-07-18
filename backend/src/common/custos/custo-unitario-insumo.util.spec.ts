import { calcularCustoUnitarioUso } from './custo-unitario-insumo.util';

describe('calcularCustoUnitarioUso', () => {
  it('normaliza custo pelo volume de compra e fator', () => {
    expect(
      calcularCustoUnitarioUso(
        {
          custo_unitario: 100,
          quantidade_compra: 10,
          fator_conversao: 2,
          unidade_uso: 'UN',
        },
        120,
      ),
    ).toBe(6);
  });

  it('normaliza chapa pelo custo por metro quadrado', () => {
    expect(
      calcularCustoUnitarioUso(
        {
          custo_unitario: 400,
          quantidade_compra: 1,
          fator_conversao: 1,
          unidade_uso: 'M2',
          logica_consumo: 'area',
          largura: 200,
          altura: 100,
          unidade_dimensao: 'CM',
          tipo_calculo: 'AREA',
        },
        360,
      ),
    ).toBe(180);
  });
});
