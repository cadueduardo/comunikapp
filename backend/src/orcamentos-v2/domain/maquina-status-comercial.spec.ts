import {
  OrcamentoStatusComercial as S,
  resolverStatusComercial,
  TRANSICOES_STATUS_COMERCIAL,
  transicaoStatusComercialPermitida,
} from './status-comercial';

describe('Máquina de estados comercial — DV-14', () => {
  it('mantém exatamente as 23 transições aprovadas', () => {
    const total = Object.values(TRANSICOES_STATUS_COMERCIAL).reduce(
      (soma, destinos) => soma + destinos.length,
      0,
    );
    expect(total).toBe(23);
  });

  it('nega transições não declaradas e mantém terminais fechados', () => {
    expect(transicaoStatusComercialPermitida(S.RASCUNHO, S.ACEITA)).toBe(false);
    expect(
      transicaoStatusComercialPermitida(S.PEDIDO_CONFIRMADO, S.RASCUNHO),
    ).toBe(false);
    expect(transicaoStatusComercialPermitida(S.CANCELADA, S.RASCUNHO)).toBe(
      false,
    );
  });

  it('resolve aliases legados conhecidos sem aceitar valor arbitrário', () => {
    expect(resolverStatusComercial('enviado')).toBe(S.ENVIADA);
    expect(resolverStatusComercial('negociando')).toBe(S.EM_NEGOCIACAO);
    expect(resolverStatusComercial('rejeitado')).toBe(S.PERDIDA);
    expect(resolverStatusComercial('qualquer_coisa')).toBeNull();
  });

  it('permite reabertura somente de expirada e perdida', () => {
    expect(transicaoStatusComercialPermitida(S.EXPIRADA, S.RASCUNHO)).toBe(true);
    expect(transicaoStatusComercialPermitida(S.PERDIDA, S.RASCUNHO)).toBe(true);
    expect(transicaoStatusComercialPermitida(S.CANCELADA, S.RASCUNHO)).toBe(
      false,
    );
  });
});
