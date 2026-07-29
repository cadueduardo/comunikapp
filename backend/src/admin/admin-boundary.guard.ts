import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAuthGuard } from './admin-auth.guard';
import { ADMIN_PUBLIC_KEY } from './admin.constants';

@Injectable()
export class AdminBoundaryGuard extends AdminAuthGuard {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const path = String(request.path || request.url || '').split('?')[0];
    const isAdminRoute =
      path === '/admin/v1' ||
      path.startsWith('/admin/v1/') ||
      path === '/api/admin/v1' ||
      path.startsWith('/api/admin/v1/');

    if (!isAdminRoute) return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(
      ADMIN_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isPublic) return true;

    return super.canActivate(context);
  }
}
