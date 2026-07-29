import { ADMIN_PERMISSIONS } from './admin.constants';
import { adminRoleHasPermissions } from './admin-permissions';

describe('adminRoleHasPermissions', () => {
  it('concede todas as permissões ao SUPER_ADMIN', () => {
    expect(
      adminRoleHasPermissions(
        'SUPER_ADMIN',
        Object.values(ADMIN_PERMISSIONS),
      ),
    ).toBe(true);
  });

  it('permite mudança de status para OPERAÇÃO', () => {
    expect(
      adminRoleHasPermissions('OPERACAO', [
        ADMIN_PERMISSIONS.STORE_READ,
        ADMIN_PERMISSIONS.STORE_STATUS_CHANGE,
      ]),
    ).toBe(true);
  });

  it.each(['SUPORTE', 'FINANCEIRO_SAAS', 'ANALISTA'] as const)(
    'nega mudança de status para %s',
    (role) => {
      expect(
        adminRoleHasPermissions(role, [
          ADMIN_PERMISSIONS.STORE_STATUS_CHANGE,
        ]),
      ).toBe(false);
    },
  );

  it('permite edição para OPERAÇÃO, mas reserva publicação ao SUPER_ADMIN', () => {
    expect(
      adminRoleHasPermissions('OPERACAO', [
        ADMIN_PERMISSIONS.PRODUCT_UPDATE_WRITE,
      ]),
    ).toBe(true);
    expect(
      adminRoleHasPermissions('OPERACAO', [
        ADMIN_PERMISSIONS.PRODUCT_UPDATE_PUBLISH,
      ]),
    ).toBe(false);
  });

  it('permite convite de usuário de loja para OPERAÇÃO e SUPORTE', () => {
    expect(
      adminRoleHasPermissions('OPERACAO', [
        ADMIN_PERMISSIONS.STORE_USER_INVITE,
      ]),
    ).toBe(true);
    expect(
      adminRoleHasPermissions('SUPORTE', [
        ADMIN_PERMISSIONS.STORE_USER_INVITE,
      ]),
    ).toBe(true);
    expect(
      adminRoleHasPermissions('ANALISTA', [
        ADMIN_PERMISSIONS.STORE_USER_INVITE,
      ]),
    ).toBe(false);
  });

  it('permite leitura de auditoria para OPERAÇÃO e ANALISTA', () => {
    expect(
      adminRoleHasPermissions('OPERACAO', [ADMIN_PERMISSIONS.AUDIT_READ]),
    ).toBe(true);
    expect(
      adminRoleHasPermissions('ANALISTA', [ADMIN_PERMISSIONS.AUDIT_READ]),
    ).toBe(true);
  });
});
