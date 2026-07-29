import { ConfigService } from '@nestjs/config';
import { getRequiredAdminJwtSecret } from './admin-jwt-secret';

function config(values: Record<string, string | undefined>) {
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

describe('getRequiredAdminJwtSecret', () => {
  it('exige chave administrativa explícita em produção', () => {
    expect(() =>
      getRequiredAdminJwtSecret(
        config({
          NODE_ENV: 'production',
          JWT_SECRET: 'loja-secret-com-mais-de-32-caracteres',
        }),
      ),
    ).toThrow('ADMIN_JWT_SECRET');
  });

  it('recusa reutilizar a chave JWT das lojas', () => {
    const secret = 'uma-chave-forte-e-exclusiva-com-32-caracteres';
    expect(() =>
      getRequiredAdminJwtSecret(
        config({
          NODE_ENV: 'production',
          JWT_SECRET: secret,
          ADMIN_JWT_SECRET: secret,
        }),
      ),
    ).toThrow('diferente');
  });

  it('deriva chave separada apenas fora de produção', () => {
    const lojaSecret = 'loja-secret-com-mais-de-32-caracteres';
    const result = getRequiredAdminJwtSecret(
      config({
        NODE_ENV: 'test',
        JWT_SECRET: lojaSecret,
      }),
    );
    expect(result).toHaveLength(64);
    expect(result).not.toBe(lojaSecret);
  });
});

