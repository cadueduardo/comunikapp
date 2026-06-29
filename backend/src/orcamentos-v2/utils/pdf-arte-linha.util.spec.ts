import { resolverPrecosPdfComArte } from './pdf-arte-linha.util';

describe('resolverPrecosPdfComArte', () => {
  it('mantém preço único quando arte não deve aparecer no PDF', () => {
    const resultado = resolverPrecosPdfComArte(
      {
        quantidade: 5,
        servicos_manuais: [
          {
            origem: 'ARTE_AUTOMATICA',
            exibir_no_pdf: false,
            custo_total: 150,
            custo_hora: 50,
            tempo_horas: 3,
          },
        ],
      },
      520.9,
    );

    expect(resultado.linha_arte).toBeNull();
    expect(resultado.preco_total).toBe(520.9);
    expect(resultado.preco_unitario).toBeCloseTo(104.18, 2);
  });

  it('usa horas × custo/hora listados no sistema, não rateio proporcional', () => {
    const resultado = resolverPrecosPdfComArte(
      {
        quantidade: 5,
        servicos_manuais: [
          {
            origem: 'ARTE_AUTOMATICA',
            exibir_no_pdf: true,
            custo_total: 150,
            custo_hora: 50,
            tempo_horas: 3,
          },
        ],
      },
      520.9,
    );

    expect(resultado.linha_arte).toEqual({
      descricao: 'Criação de arte',
      horas: 3,
      custo_hora: 50,
      preco_unitario: 150,
      preco_total: 150,
    });
    expect(resultado.preco_total).toBe(370.9);
    expect(resultado.preco_unitario).toBeCloseTo(74.18, 2);
    expect(resultado.preco_total + (resultado.linha_arte?.preco_total ?? 0)).toBe(
      520.9,
    );
  });

  it('usa arte_custo_calculado quando não há serviço persistido', () => {
    const resultado = resolverPrecosPdfComArte(
      {
        quantidade: 1,
        politica_cobranca_arte: 'COBRADA_A_PARTE',
        arte_custo_calculado: 150,
        arte_horas_calculadas: 3,
      },
      520.9,
    );

    expect(resultado.linha_arte?.preco_total).toBe(150);
    expect(resultado.preco_total).toBe(370.9);
  });
});
