import { usuario_status } from '@prisma/client';
import { LojasService } from './lojas.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
}));

describe('LojasService.login session_version', () => {
  it('repassa a session_version atual do usuário ao emitir o JWT', async () => {
    const generateToken = jest.fn().mockReturnValue('jwt-novo');
    const usuario = {
      id: 'user-1',
      email: 'ana@loja.com',
      senha: 'hash',
      loja_id: 'loja-1',
      funcao: 'VENDAS',
      nome_completo: 'Ana',
      status: usuario_status.ATIVO,
      email_verificado: true,
      two_factor_enabled: false,
      two_factor_secret: null,
      session_version: 4,
      loja: {
        id: 'loja-1',
        nome: 'Loja',
        slug: 'loja-teste',
        status: 'ATIVO',
        session_version: 2,
      },
    };
    const prisma = {
      usuario: { findUnique: jest.fn().mockResolvedValue(usuario) },
    };
    const service = new LojasService(
      prisma as any,
      { sendVerificationEmail: jest.fn() } as any,
      { generateToken } as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const previous = process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
    try {
      await service.login(
        { email: 'ana@loja.com', password: 'secret' } as any,
        '127.0.0.1',
        'jest',
      );
    } finally {
      if (previous === undefined) {
        delete process.env.TURNSTILE_SECRET_KEY;
      } else {
        process.env.TURNSTILE_SECRET_KEY = previous;
      }
    }

    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-1',
        session_version: 4,
        loja: expect.objectContaining({ session_version: 2 }),
      }),
    );
  });
});
