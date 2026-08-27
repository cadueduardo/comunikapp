import { BadRequestException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService.criar (convite legado desativado)', () => {
  function setup() {
    const tx = {
      usuario: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'maria@exemplo.com',
          funcao: 'VENDAS',
        }),
      },
      perfil_acesso: { findMany: jest.fn().mockResolvedValue([]) },
      usuario_perfil: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };
    const mail = { sendVerificationEmail: jest.fn() };
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new UsuariosService(prisma as any, mail as any, audit as any);
    return { service, prisma, mail, audit, tx };
  }

  it('rejeita criação sem senha (convite legado)', async () => {
    const { service, mail } = setup();

    await expect(
      service.criar(
        'loja-1',
        {
          nome_completo: 'Maria',
          email: 'maria@exemplo.com',
          funcao: 'VENDAS',
        } as any,
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('cria usuário ativo quando a senha é informada', async () => {
    const { service, mail, tx, audit } = setup();

    const result = await service.criar(
      'loja-1',
      {
        nome_completo: 'Maria Souza',
        email: 'maria@exemplo.com',
        funcao: 'VENDAS',
        senha: 'senha-segura',
      },
      'admin-1',
    );

    expect(result).toEqual({ id: 'user-1' });
    expect(tx.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja_id: 'loja-1',
          email: 'maria@exemplo.com',
          status: 'ATIVO',
          email_verificado: true,
        }),
      }),
    );
    expect(audit.registrar).toHaveBeenCalled();
    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
