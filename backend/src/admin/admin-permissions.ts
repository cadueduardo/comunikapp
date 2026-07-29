import { admin_role } from '@prisma/client';
import { ADMIN_PERMISSIONS, AdminPermission } from './admin.constants';

const ROLE_PERMISSIONS: Record<admin_role, ReadonlySet<AdminPermission>> = {
  SUPER_ADMIN: new Set(Object.values(ADMIN_PERMISSIONS)),
  OPERACAO: new Set([
    ADMIN_PERMISSIONS.AUDIT_READ,
    ADMIN_PERMISSIONS.STORE_READ,
    ADMIN_PERMISSIONS.STORE_STATUS_CHANGE,
    ADMIN_PERMISSIONS.PRODUCT_UPDATE_READ,
    ADMIN_PERMISSIONS.PRODUCT_UPDATE_WRITE,
  ]),
  SUPORTE: new Set([
    ADMIN_PERMISSIONS.AUDIT_READ,
    ADMIN_PERMISSIONS.STORE_READ,
    ADMIN_PERMISSIONS.PRODUCT_UPDATE_READ,
  ]),
  FINANCEIRO_SAAS: new Set([
    ADMIN_PERMISSIONS.AUDIT_READ,
    ADMIN_PERMISSIONS.STORE_READ,
    ADMIN_PERMISSIONS.PRODUCT_UPDATE_READ,
  ]),
  ANALISTA: new Set([
    ADMIN_PERMISSIONS.AUDIT_READ,
    ADMIN_PERMISSIONS.STORE_READ,
    ADMIN_PERMISSIONS.PRODUCT_UPDATE_READ,
  ]),
};

export function adminRoleHasPermissions(
  role: admin_role,
  required: readonly AdminPermission[],
): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return required.every((permission) => granted.has(permission));
}
