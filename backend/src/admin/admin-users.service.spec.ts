import {
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  const actor = {
    id: 'admin-actor',
    sessionId: 'session-1',
    nome: 'Super',
    email: 'super@comunikapp.com.br',
    role: 'SUPER_ADMIN' as const,
  };

  function setup(overrides?: {
    current?: Record<string, unknown>;
    activeSuperAdmins?: number;
  }) {
    const current = {
      id: 'admin-2',
      nome: 'Operador',
      email: 'op@comunikapp.com.br',
      role: 'OPERACAO',
      status: 'ACTIVE',
      password_hash: 'hash',
      ...overrides?.current,
    };
    const tx = {
      admin_user: {
        findUnique: jest.fn().mockResolvedValue(current),
        count: jest
          .fn()
          .mockResolvedValue(overrides?.activeSuperAdmins ?? 2),
        update: jest.fn().mockImplementation(async ({ data }) => ({
          id: current.id,
          nome: current.nome,
          email: current.email,
          role: data.role,
          status: data.status,
          two_factor_enabled: true,
          last_login_at: null,
          created_at: new Date(),
          updated_at: new Date(),
        })),
      },
      admin_session: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback) => callback(tx)),
      admin_user: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const auditService = { record: jest.fn().mockResolvedValue({}) };
    const service = new AdminUsersService(
      prisma as any,
      auditService as any,
    );
    return { service, tx, auditService };
  }

  it('impede rebaixar o último SUPER_ADMIN ativo', async () => {
    const { service } = setup({
      current: {
        id: 'admin-2',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
      },
      activeSuperAdmins: 1,
    });

    await expect(
      service.update(
        'admin-2',
        {
          role: 'OPERACAO',
          reason: 'Reorganização da equipe interna.',
        },
        actor,
        {},
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('exige senha atual para promover a SUPER_ADMIN', async () => {
    const { service } = setup();

    await expect(
      service.update(
        'admin-2',
        {
          role: 'SUPER_ADMIN',
          reason: 'Promoção autorizada pela diretoria.',
        },
        actor,
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('inativa administrador e revoga sessões', async () => {
    const { service, tx, auditService } = setup();

    const result = await service.update(
      'admin-2',
      {
        status: 'INACTIVE',
        reason: 'Saída da equipe operacional.',
      },
      actor,
      { correlationId: 'corr-1' },
    );

    expect(result.status).toBe('INACTIVE');
    expect(result.sessionsRevoked).toBe(true);
    expect(tx.admin_session.updateMany).toHaveBeenCalled();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'ADMIN_INACTIVATED' }),
      tx,
    );
  });
});
