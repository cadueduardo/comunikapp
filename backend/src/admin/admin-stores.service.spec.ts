import {
  ForbiddenException,
} from '@nestjs/common';
import { AdminStoresService } from './admin-stores.service';
import { AdminStoreStatusCategory } from './dto/update-admin-store-status.dto';

describe('AdminStoresService', () => {
  const admin = {
    id: 'admin-1',
    sessionId: 'session-1',
    nome: 'Administrador',
    email: 'admin@comunikapp.com.br',
    role: 'OPERACAO' as const,
  };

  function setup() {
    const auditService = { record: jest.fn().mockResolvedValue({}) };
    const tx = {
      loja: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'loja-1',
          nome: 'Loja',
          status: 'ATIVO',
          assinatura_ativa: true,
          session_version: 0,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'loja-1',
          nome: 'Loja',
          status: 'INATIVO',
          assinatura_ativa: true,
          session_version: 1,
          atualizado_em: new Date(),
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn((callback) => callback(tx)),
    };
    const service = new AdminStoresService(
      prisma as any,
      auditService as any,
    );
    return { service, tx, auditService };
  }

  it('incrementa a versão de sessão ao inativar e audita na transação', async () => {
    const { service, tx, auditService } = setup();

    await service.updateStatus(
      'loja-1',
      {
        status: 'INATIVO',
        category: AdminStoreStatusCategory.COMMERCIAL,
        reason: 'Pausa solicitada formalmente pelo cliente.',
      },
      admin,
      { correlationId: 'req-1' },
    );

    expect(tx.loja.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'INATIVO',
          session_version: { increment: 1 },
        }),
      }),
    );
    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'STORE_STATUS_CHANGED',
        lojaId: 'loja-1',
      }),
      tx,
    );
  });

  it('impede OPERAÇÃO de bloquear uma loja', async () => {
    const { service } = setup();

    await expect(
      service.updateStatus(
        'loja-1',
        {
          status: 'BLOQUEADO',
          category: AdminStoreStatusCategory.SECURITY,
          reason: 'Bloqueio preventivo solicitado por segurança.',
        },
        admin,
        {},
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('monta timeline com orçamento excluído e ator da loja', async () => {
    const auditService = { record: jest.fn() };
    const prisma = {
      loja: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'loja-1',
          nome: 'Loja Demo',
        }),
      },
      orcamento: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'orc-1',
            numero: '2026-001',
            nome_servico: 'Fachada',
            status: 'EXCLUIDO',
            excluido_em: new Date('2026-07-29T12:00:00.000Z'),
            excluido_por: 'user-1',
            motivo_exclusao: 'Duplicado',
            criado_em: new Date('2026-07-20T12:00:00.000Z'),
          },
        ]),
      },
      admin_audit_log: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      usuario: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'user-1',
            nome_completo: 'Maria Silva',
            nome: 'Maria',
            email: 'maria@loja.com',
          },
        ]),
      },
      $transaction: jest.fn(),
    };
    const service = new AdminStoresService(prisma as any, auditService as any);

    const result = await service.timeline('loja-1', admin, 20);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].type).toBe('ORCAMENTO_EXCLUIDO');
    expect(result.data[0].actor?.nome).toBe('Maria Silva');
    expect(result.data[0].reason).toBe('Duplicado');
  });
});
