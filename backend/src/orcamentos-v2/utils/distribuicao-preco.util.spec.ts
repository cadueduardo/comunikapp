import { distribuirPrecoFinal } from './distribuicao-preco.util';

describe('distribuirPrecoFinal', () => {
  it('aplica todo o valor final ao produto unico', () => {
    expect(
      distribuirPrecoFinal([{ quantidade: 1, preco_total: 45.45 }], 120),
    ).toEqual([{ preco_unitario: 120, preco_total: 120 }]);
  });

  it('distribui o valor proporcionalmente aos precos originais', () => {
    const resultado = distribuirPrecoFinal(
      [
        { quantidade: 2, preco_total: 60 },
        { quantidade: 1, preco_total: 40 },
      ],
      120,
    );

    expect(resultado).toEqual([
      { preco_unitario: 36, preco_total: 72 },
      { preco_unitario: 48, preco_total: 48 },
    ]);
  });

  it('preserva exatamente o total final apos arredondamento de centavos', () => {
    const resultado = distribuirPrecoFinal(
      [
        { quantidade: 1, preco_total: 1 },
        { quantidade: 1, preco_total: 1 },
        { quantidade: 1, preco_total: 1 },
      ],
      10,
    );

    expect(resultado.map((item) => item.preco_total)).toEqual([3.34, 3.33, 3.33]);
    expect(
      resultado.reduce((soma, item) => soma + item.preco_total, 0),
    ).toBe(10);
  });

  it('divide igualmente quando os itens nao possuem precos validos', () => {
    expect(
      distribuirPrecoFinal(
        [
          { quantidade: 1, preco_total: 0 },
          { quantidade: 1, preco_total: null },
        ],
        15,
      ),
    ).toEqual([
      { preco_unitario: 7.5, preco_total: 7.5 },
      { preco_unitario: 7.5, preco_total: 7.5 },
    ]);
  });
});
