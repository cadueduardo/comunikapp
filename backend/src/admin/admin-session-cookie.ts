import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { ADMIN_SESSION_COOKIE_NAME } from './admin.constants';

export function extractAdminJwtFromRequest(req: Request): string | null {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    const bearer = authorization.slice(7).trim();
    if (bearer && bearer !== 'null' && bearer !== 'undefined') {
      return bearer;
    }
  }

  const cookie = req.cookies?.[ADMIN_SESSION_COOKIE_NAME];
  return typeof cookie === 'string' && cookie.trim() ? cookie.trim() : null;
}

export function setAdminSessionCookie(
  response: Response,
  token: string,
  expiresAt: Date,
  configService: ConfigService,
) {
  response.cookie(ADMIN_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: configService.get<string>('NODE_ENV') === 'production',
    sameSite: 'strict',
    path: '/',
    expires: expiresAt,
  });
}

export function clearAdminSessionCookie(
  response: Response,
  configService: ConfigService,
) {
  response.clearCookie(ADMIN_SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: configService.get<string>('NODE_ENV') === 'production',
    sameSite: 'strict',
    path: '/',
  });
}

