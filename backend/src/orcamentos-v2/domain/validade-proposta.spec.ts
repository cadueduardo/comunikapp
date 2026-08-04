import {
  calcularExpiraEm,
  montarCamposValidadeNoEnvio,
  parsearValidadeDias,
} from './validade-proposta';

describe('validade-proposta (DV-07)', () => {
  it('parseia padrões conhecidos e usa fallback', () => {
    expect(parsearValidadeDias('30 dias')).toBe(30);
    expect(parsearValidadeDias('15 dia')).toBe(15);
    expect(parsearValidadeDias('indefinido')).toBe(30);
    expect(parsearValidadeDias(null)).toBe(30);
  });

  it('calcula expira_em a partir do envio', () => {
    const enviado = new Date('2026-08-01T12:00:00.000Z');
    expect(calcularExpiraEm(enviado, 30).toISOString()).toBe(
      '2026-08-31T12:00:00.000Z',
    );
  });

  it('monta campos no envio preferindo validade_dias já estruturado', () => {
    const enviadoEm = new Date('2026-08-01T00:00:00.000Z');
    expect(
      montarCamposValidadeNoEnvio({
        validadeProposta: '30 dias',
        validadeDias: 10,
        enviadoEm,
      }),
    ).toEqual({
      validade_dias: 10,
      expira_em: new Date('2026-08-11T00:00:00.000Z'),
    });
  });
});
