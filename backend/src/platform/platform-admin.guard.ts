import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

function getPlatformAdminEmails() {
  return (process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export { getPlatformAdminEmails };

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.PLATFORM_ADMIN_ENABLED === 'false') {
      throw new ForbiddenException('Administracao da plataforma desativada.');
    }

    const request = context.switchToHttp().getRequest();
    const userEmail = request.user?.email?.toString().trim().toLowerCase();
    const allowedEmails = getPlatformAdminEmails();

    if (!userEmail || !allowedEmails.includes(userEmail)) {
      throw new ForbiddenException(
        'Acesso restrito aos administradores da plataforma.',
      );
    }

    return true;
  }
}

export function isPlatformAdminEmail(email?: string | null) {
  if (process.env.PLATFORM_ADMIN_ENABLED === 'false') return false;
  const normalizedEmail = email?.trim().toLowerCase();
  return (
    !!normalizedEmail && getPlatformAdminEmails().includes(normalizedEmail)
  );
}
