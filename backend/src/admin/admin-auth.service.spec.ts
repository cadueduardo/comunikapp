import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminAuthService } from './admin-auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AdminAuthService', () => {
  function setup(user: unknown) {
    const prisma = {
      admin_user: {
        findUnique: jest.fn().mockResolvedValue(user),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const auditService = {
      record: jest.fn().mockResolvedValue({}),
    };
    const service = new AdminAuthService(
      prisma as any,
      {} as any,
      {} as any,
      auditService as any,
      { verify: jest.fn() } as any,
    );
    return { service, prisma, auditService };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('usa resposta genérica para e-mail administrativo inexistente', async () => {
    const { service, auditService } = setup(null);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login(
        {
          email: 'naoexiste@comunikapp.com.br',
          password: 'senha-incorreta',
        },
        { ipAddress: '127.0.0.1' },
      ),
    ).rejects.toEqual(
      new UnauthorizedException('E-mail, senha ou código inválido.'),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ADMIN_LOGIN_FAILED',
        adminUserId: undefined,
      }),
    );
  });

  it('não permite SUPER_ADMIN ativo sem concluir o 2FA', async () => {
    const user = {
      id: 'admin-1',
      nome: 'Administrador',
      email: 'admin@comunikapp.com.br',
      password_hash: 'hash',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      two_factor_enabled: false,
      two_factor_secret: 'encrypted',
      failed_login_attempts: 0,
      locked_until: null,
    };
    const { service, auditService } = setup(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    await expect(
      service.login(
        {
          email: user.email,
          password: 'senha-correta',
        },
        {},
      ),
    ).rejects.toThrow('segundo fator');
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ADMIN_LOGIN_FAILED',
        adminUserId: user.id,
      }),
    );
  });
});

