import {
  estaDentroDaJanelaUtc,
  obterLimiarHorasAtrasUtc,
} from './utc-time.util';

describe('utc-time.util', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-25T15:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('calcula limiar 24h atrás em UTC', () => {
    const limiar = obterLimiarHorasAtrasUtc(24);
    expect(limiar.toISOString()).toBe('2026-06-24T15:00:00.000Z');
  });

  it('compara instantes via getTime (UTC)', () => {
    const limiar = obterLimiarHorasAtrasUtc(24);
    expect(
      estaDentroDaJanelaUtc(new Date('2026-06-24T16:00:00.000Z'), limiar),
    ).toBe(true);
    expect(
      estaDentroDaJanelaUtc(new Date('2026-06-24T14:00:00.000Z'), limiar),
    ).toBe(false);
    expect(estaDentroDaJanelaUtc(null, limiar)).toBe(false);
  });
});
