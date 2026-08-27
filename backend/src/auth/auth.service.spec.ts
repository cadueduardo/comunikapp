import { AuthService } from './auth.service';

describe('AuthService.generateToken', () => {
  function setup() {
    const jwtService = { sign: jest.fn().mockReturnValue('jwt-assinado') };
    const service = new AuthService(jwtService as any, {} as any);
    return { service, jwtService };
  }

  const usuario = {
    id: 'user-1',
    email: 'ana@loja.com',
    loja_id: 'loja-1',
    funcao: 'VENDAS',
    nome_completo: 'Ana',
  };

  it('grava a session_version real do usuário no JWT', () => {
    const { service, jwtService } = setup();

    service.generateToken({
      ...usuario,
      session_version: 4,
      loja: { session_version: 2 } as any,
    });

    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: 'user-1',
        usuario_session_version: 4,
        loja_session_version: 2,
      }),
    );
  });

  it('recusa emitir token sem session_version numérica', () => {
    const { service } = setup();
    expect(() =>
      service.generateToken({
        ...usuario,
        session_version: undefined as unknown as number,
      }),
    ).toThrow(/session_version/);
  });
});
