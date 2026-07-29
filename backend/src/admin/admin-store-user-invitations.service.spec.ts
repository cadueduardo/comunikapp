import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { AdminStoreUserInvitationsService } from './admin-store-user-invitations.service';

describe('AdminStoreUserInvitationsService', () => {
  const actor = {
    id: 'admin-1',
    sessionId: 'session-1',
    nome: 'Operação',
    email: 'op@comunikapp.com.br',
    role: 'OPERACAO' as const,
  };
  const context = {
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    correlationId: 'corr-1',
  };

  function setup(overrides?: {
    storeStatus?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
    existingUser?: { id: string; loja_id: string; status: string } | null;
    pendingInvitation?: { id: string; loja_id: string } | null;
  }) {
    const tx = {
      usuario: {
        create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      store_user_invitation: {
        create: jest.fn().mockResolvedValue({
          id: 'inv-1',
          status: 'PENDING',
        }),
        update: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'inv-1',
          status: 'PENDING',
          usuario_id: 'user-1',
          nome: 'Convidado',
          funcao: 'VENDAS',
          telefone: null,
          mensagem: null,
        }),
      },
    };
    const prisma = {
      store_user_invitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findFirst: jest
          .fn()
          .mockResolvedValue(overrides?.pendingInvitation ?? null),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      loja: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'loja-1',
          status: overrides?.storeStatus ?? 'ATIVO',
          nome: 'Loja Teste',
          slug: 'loja-teste',
        }),
      },
      usuario: {
        findUnique: jest
          .fn()
          .mockResolvedValue(overrides?.existingUser ?? null),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (callback) => callback(tx)),
    };
    const mailService = {
      sendStoreUserInvitationEmail: jest.fn().mockResolvedValue({}),
    };
    const auditService = { record: jest.fn().mockResolvedValue({}) };
    const service = new AdminStoreUserInvitationsService(
      prisma as any,
      mailService as any,
      auditService as any,
    );
    return { service, prisma, tx, mailService, auditService };
  }

  it('cria usuário pendente e convite para loja ativa', async () => {
    const { service, tx, mailService, auditService } = setup();

    const result = await service.create(
      'loja-1',
      {
        nome: 'Novo Usuário',
        email: 'novo@exemplo.com',
        funcao: 'VENDAS',
      },
      actor,
      context,
    );

    expect(tx.usuario.create).toHaveBeenCalled();
    expect(tx.store_user_invitation.create).toHaveBeenCalled();
    expect(mailService.sendStoreUserInvitationEmail).toHaveBeenCalled();
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STORE_USER_INVITATION_CREATED',
        lojaId: 'loja-1',
      }),
      tx,
    );
    expect(result.emailSent).toBe(true);
  });

  it('bloqueia convite em loja inativa para OPERAÇÃO', async () => {
    const { service } = setup({ storeStatus: 'INATIVO' });

    await expect(
      service.create(
        'loja-1',
        {
          nome: 'Novo Usuário',
          email: 'novo@exemplo.com',
          funcao: 'VENDAS',
        },
        actor,
        context,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('exige justificativa para SUPER_ADMIN em loja bloqueada', async () => {
    const { service } = setup({ storeStatus: 'BLOQUEADO' });

    await expect(
      service.create(
        'loja-1',
        {
          nome: 'Novo Usuário',
          email: 'novo@exemplo.com',
          funcao: 'VENDAS',
        },
        { ...actor, role: 'SUPER_ADMIN' },
        context,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('impede e-mail já existente em outra loja', async () => {
    const { service } = setup({
      existingUser: {
        id: 'user-x',
        loja_id: 'outra-loja',
        status: 'ATIVO',
      },
    });

    await expect(
      service.create(
        'loja-1',
        {
          nome: 'Novo Usuário',
          email: 'novo@exemplo.com',
          funcao: 'VENDAS',
        },
        actor,
        context,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
