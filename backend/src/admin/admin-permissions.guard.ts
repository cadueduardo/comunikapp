import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ADMIN_PERMISSIONS_KEY,
} from './admin.decorators';
import { AdminPermission } from './admin.constants';
import { adminRoleHasPermissions } from './admin-permissions';
import { AuthenticatedAdmin } from './admin.types';

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<AdminPermission[]>(
        ADMIN_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      ) || [];

    if (required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const admin = (request.admin || request.user) as
      | AuthenticatedAdmin
      | undefined;
    if (!admin || !adminRoleHasPermissions(admin.role, required)) {
      throw new ForbiddenException(
        'Você não possui permissão para realizar esta operação.',
      );
    }

    return true;
  }
}
