import { validarAmbienteTesteMutavel } from '../../../scripts/validar-ambiente-teste-mutavel';

describe('validarAmbienteTesteMutavel', () => {
  const ambienteOriginal = process.env;

  beforeEach(() => {
    process.env = { ...ambienteOriginal };
  });

  afterAll(() => {
    process.env = ambienteOriginal;
  });

  it('aceita somente banco dedicado com confirmação explícita', () => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_RBAC_TEST_MUTATIONS = 'true';
    process.env.DATABASE_URL =
      'mysql://user:pass@localhost:3306/comunikapp_test';

    expect(validarAmbienteTesteMutavel()).toBe('comunikapp_test');
  });

  it.each([
    ['produção', 'production', 'true', 'comunikapp_test'],
    ['sem confirmação', 'test', undefined, 'comunikapp_test'],
    ['banco não dedicado', 'test', 'true', 'comunikapp'],
  ])('recusa %s', (_caso, nodeEnv, confirmacao, banco) => {
    process.env.NODE_ENV = nodeEnv;
    process.env.ALLOW_RBAC_TEST_MUTATIONS = confirmacao;
    process.env.DATABASE_URL = `mysql://user:pass@localhost:3306/${banco}`;

    expect(() => validarAmbienteTesteMutavel()).toThrow();
  });
});
