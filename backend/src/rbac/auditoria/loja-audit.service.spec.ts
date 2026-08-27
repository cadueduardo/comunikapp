import { LojaAuditService } from './loja-audit.service';

describe('LojaAuditService', () => {
  it('redige senha, token, secret e código', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'log-1' });
    const prisma = { loja_audit_log: { create } };
    const service = new LojaAuditService(prisma as any);

    await service.registrar({
      lojaId: 'loja-1',
      atorId: 'admin-1',
      action: 'usuario.criar',
      resourceType: 'usuario',
      resourceId: 'u1',
      newState: {
        senha: 'segredo-super',
        token: 'abc',
        two_factor_secret: 'otp',
        codigo_verificacao_email: '123456',
        email: 'ana@loja.com',
      },
    });

    const payload = JSON.stringify(create.mock.calls[0][0]);
    expect(payload).not.toContain('segredo-super');
    expect(payload).not.toContain('abc');
    expect(payload).not.toContain('otp');
    expect(payload).not.toContain('123456');
    expect(payload).toContain('[redacted]');
    expect(payload).toContain('ana@loja.com');
  });
});
