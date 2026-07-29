import { BadRequestException } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService.criar (convite legado desativado)', () => {
  function setup() {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
    };
    const mail = { sendVerificationEmail: jest.fn() };
    const service = new UsuariosService(prisma as any, mail as any);
    return { service, prisma, mail };
  }

  it('rejeita criação sem senha (convite legado)', async () => {
    const { service, mail } = setup();

    await expect(
      service.criar('loja-1', {
        nome_completo: 'Maria',
        email: 'maria@exemplo.com',
        funcao: 'VENDAS',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('cria usuário ativo quando a senha é informada', async () => {
    const { service, prisma, mail } = setup();

    const result = await service.criar('loja-1', {
      nome_completo: 'Maria Souza',
      email: 'maria@exemplo.com',
      funcao: 'VENDAS',
      senha: 'senha-segura',
    });

    expect(result).toEqual({ id: 'user-1' });
    expect(prisma.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja_id: 'loja-1',
          email: 'maria@exemplo.com',
          status: 'ATIVO',
          email_verificado: true,
        }),
      }),
    );
    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
