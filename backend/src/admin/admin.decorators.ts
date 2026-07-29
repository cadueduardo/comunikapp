import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import {
  ADMIN_PUBLIC_KEY,
  AdminPermission,
} from './admin.constants';
import { AuthenticatedAdmin } from './admin.types';

export const ADMIN_PERMISSIONS_KEY = 'admin_permissions';

export const RequireAdminPermissions = (
  ...permissions: AdminPermission[]
) => SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);

export const AdminPublic = () => SetMetadata(ADMIN_PUBLIC_KEY, true);

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedAdmin =>
    context.switchToHttp().getRequest().admin ||
    context.switchToHttp().getRequest().user,
);
