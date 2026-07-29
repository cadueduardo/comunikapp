import { AdminAuditService } from './admin-audit.service';

describe('AdminAuditService.list', () => {
  it('mascara IP e user-agent para ANALISTA', async () => {
    const prisma = {
      $transaction: jest.fn(),
      admin_audit_log: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    const row = {
      id: 'audit-1',
      occurred_at: new Date('2026-07-29T12:00:00.000Z'),
      admin_user_id: 'admin-1',
      admin_role: 'SUPER_ADMIN',
      action: 'STORE_STATUS_CHANGED',
      resource_type: 'loja',
      resource_id: 'loja-1',
      loja_id: 'loja-1',
      previous_state: { status: 'ATIVO' },
      new_state: { status: 'INATIVO' },
      reason: 'Solicitação do cliente',
      category: 'OPERACIONAL',
      ip_address: '203.0.113.10',
      user_agent: 'Mozilla/5.0',
      correlation_id: 'corr-1',
      metadata: null,
      admin_user: {
        id: 'admin-1',
        nome: 'Admin',
        email: 'admin@comunikapp.com.br',
        role: 'SUPER_ADMIN',
      },
      loja: {
        id: 'loja-1',
        nome: 'Loja Demo',
        slug: 'demo',
      },
    };
    prisma.$transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops),
    );
    prisma.admin_audit_log.count.mockResolvedValue(1);
    prisma.admin_audit_log.findMany.mockResolvedValue([row]);

    const service = new AdminAuditService(prisma as any);
    const result = await service.list(
      { page: 1, limit: 25 },
      {
        id: 'analyst-1',
        sessionId: 'session-1',
        nome: 'Analista',
        email: 'analista@comunikapp.com.br',
        role: 'ANALISTA',
      },
    );

    expect(result.pagination.total).toBe(1);
    expect(result.data[0].ip_address).toBeNull();
    expect(result.data[0].user_agent).toBeNull();
    expect(result.data[0].action).toBe('STORE_STATUS_CHANGED');
  });
});
