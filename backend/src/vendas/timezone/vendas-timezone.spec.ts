import {
  limitesDiaOperacional,
  VENDAS_TIMEZONE,
  assertVendasTimezoneBoot,
} from './vendas-timezone';

describe('VendasTimezone', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('constante canônica é America/Sao_Paulo', () => {
    expect(VENDAS_TIMEZONE).toBe('America/Sao_Paulo');
  });

  it('boot alinha TZ divergente para a constante', () => {
    process.env.TZ = 'UTC';
    assertVendasTimezoneBoot();
    expect(process.env.TZ).toBe(VENDAS_TIMEZONE);
  });

  it('limites do dia operacional seguem SP mesmo com TZ=UTC no processo', () => {
    process.env.TZ = 'UTC';
    const ref = new Date('2026-08-05T15:00:00.000Z'); // 12:00 em SP
    const { dataOperacional, inicioUtc, fimUtc } = limitesDiaOperacional(ref);
    expect(dataOperacional).toBe('2026-08-05');
    expect(inicioUtc.toISOString()).toBe('2026-08-05T03:00:00.000Z');
    expect(fimUtc.getTime()).toBeGreaterThan(inicioUtc.getTime());
  });
});
