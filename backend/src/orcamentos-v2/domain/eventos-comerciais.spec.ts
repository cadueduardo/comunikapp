import { EVENTOS_COMERCIAIS, isEventoComercial } from './eventos-comerciais';

describe('eventos-comerciais (M1.4)', () => {
  it('expõe a nomenclatura canônica do RP', () => {
    expect(EVENTOS_COMERCIAIS.PROPOSTA_ENVIADA).toBe('vendas.proposta.enviada');
    expect(EVENTOS_COMERCIAIS.PROPOSTA_ACEITA).toBe('vendas.proposta.aceita');
    expect(EVENTOS_COMERCIAIS.PEDIDO_CONFIRMADO).toBe(
      'vendas.pedido.confirmado',
    );
  });

  it('valida strings conhecidas', () => {
    expect(isEventoComercial('vendas.proposta.criada')).toBe(true);
    expect(isEventoComercial('qualquer.coisa')).toBe(false);
  });
});
