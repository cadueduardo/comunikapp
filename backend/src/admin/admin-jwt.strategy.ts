import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import {
  ADMIN_JWT_STRATEGY,
} from './admin.constants';
import { getRequiredAdminJwtSecret } from './admin-jwt-secret';
import { extractAdminJwtFromRequest } from './admin-session-cookie';
import {
  AdminJwtPayload,
  AuthenticatedAdmin,
} from './admin.types';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  ADMIN_JWT_STRATEGY,
) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => extractAdminJwtFromRequest(request),
      ]),
      ignoreExpiration: false,
      secretOrKey: getRequiredAdminJwtSecret(configService),
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AuthenticatedAdmin> {
    if (
      payload?.typ !== 'admin' ||
      !payload.sub ||
      !payload.sid ||
      !payload.role
    ) {
      throw new UnauthorizedException('Sessão administrativa inválida.');
    }

    const now = new Date();
    const session = await this.prisma.admin_session.findFirst({
      where: {
        id: payload.sid,
        admin_user_id: payload.sub,
        revoked_at: null,
        expires_at: { gt: now },
        admin_user: {
          status: 'ACTIVE',
        },
      },
      select: {
        id: true,
        last_seen_at: true,
        admin_user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!session || session.admin_user.role !== payload.role) {
      throw new UnauthorizedException(
        'Sessão administrativa expirada ou revogada.',
      );
    }

    const lastSeenThreshold = new Date(now.getTime() - 5 * 60 * 1000);
    if (
      !session.last_seen_at ||
      session.last_seen_at < lastSeenThreshold
    ) {
      await this.prisma.admin_session.updateMany({
        where: {
          id: session.id,
          revoked_at: null,
        },
        data: { last_seen_at: now },
      });
    }

    return {
      id: session.admin_user.id,
      sessionId: session.id,
      nome: session.admin_user.nome,
      email: session.admin_user.email,
      role: session.admin_user.role,
    };
  }
}

