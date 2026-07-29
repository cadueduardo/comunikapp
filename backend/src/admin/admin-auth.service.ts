import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { admin_role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { getRequiredAdminJwtSecret } from './admin-jwt-secret';
import { AdminRequestContext } from './admin-request-context';
import { AdminTwoFactorService } from './admin-two-factor.service';
import { AdminJwtPayload, AuthenticatedAdmin } from './admin.types';
import { AcceptAdminInvitationDto } from './dto/accept-admin-invitation.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ConfirmAdminTwoFactorDto } from './dto/confirm-admin-two-factor.dto';

const DUMMY_PASSWORD_HASH =
  '$2b$12$qwJt4SXZ7btiPztAGF2VSu1JsGSglQy7VxGxJvY.s7FeFe1dbaD1a';
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export interface SessionResult {
  token: string;
  expiresAt: Date;
  admin: AuthenticatedAdmin;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AdminAuditService,
    private readonly twoFactorService: AdminTwoFactorService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private hashInvitationToken(token: string) {
    return createHash('sha256').update(token.trim()).digest('hex');
  }

  private getSessionTtlMinutes() {
    const configured = Number(
      this.configService.get<string>('ADMIN_SESSION_TTL_MINUTES') || 480,
    );
    if (!Number.isFinite(configured)) return 480;
    return Math.min(Math.max(Math.trunc(configured), 15), 720);
  }

  private signSession(payload: AdminJwtPayload, expiresAt: Date) {
    const expiresInSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );
    return this.jwtService.sign(payload, {
      secret: getRequiredAdminJwtSecret(this.configService),
      expiresIn: expiresInSeconds,
    });
  }

  private async createSession(
    user: {
      id: string;
      nome: string;
      email: string;
      role: admin_role;
    },
    context: AdminRequestContext,
  ): Promise<SessionResult> {
    const expiresAt = new Date(
      Date.now() + this.getSessionTtlMinutes() * 60 * 1000,
    );

    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.admin_session.create({
        data: {
          admin_user_id: user.id,
          expires_at: expiresAt,
          last_seen_at: new Date(),
          ip_address: context.ipAddress,
          user_agent: context.userAgent,
        },
      });
      await this.auditService.record(
        {
          ...context,
          adminUserId: user.id,
          adminRole: user.role,
          action: 'ADMIN_LOGIN_SUCCEEDED',
          resourceType: 'admin_session',
          resourceId: created.id,
        },
        tx,
      );
      return created;
    });

    const admin: AuthenticatedAdmin = {
      id: user.id,
      sessionId: session.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
    };

    return {
      token: this.signSession(
        {
          sub: user.id,
          sid: session.id,
          email: user.email,
          role: user.role,
          typ: 'admin',
        },
        expiresAt,
      ),
      expiresAt,
      admin,
    };
  }

  private invalidCredentials(): never {
    throw new UnauthorizedException('E-mail, senha ou código inválido.');
  }

  private async registerFailedLogin(
    user:
      | {
          id: string;
          role: admin_role;
          failed_login_attempts: number;
        }
      | null,
    context: AdminRequestContext,
  ) {
    if (user) {
      const attempts = user.failed_login_attempts + 1;
      await this.prisma.admin_user.updateMany({
        where: { id: user.id },
        data: {
          failed_login_attempts: attempts,
          locked_until:
            attempts >= MAX_FAILED_ATTEMPTS
              ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
              : undefined,
        },
      });
    }

    await this.auditService.record({
      ...context,
      adminUserId: user?.id,
      adminRole: user?.role,
      action: 'ADMIN_LOGIN_FAILED',
      resourceType: 'admin_auth',
      metadata: { reason: 'invalid_credentials' },
    });
  }

  async login(
    dto: AdminLoginDto,
    context: AdminRequestContext,
  ): Promise<SessionResult> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.admin_user.findUnique({
      where: { email },
      select: {
        id: true,
        nome: true,
        email: true,
        password_hash: true,
        role: true,
        status: true,
        two_factor_enabled: true,
        two_factor_secret: true,
        failed_login_attempts: true,
        locked_until: true,
      },
    });

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user?.password_hash || DUMMY_PASSWORD_HASH,
    );
    const isLocked = !!user?.locked_until && user.locked_until > new Date();
    const isActive = user?.status === 'ACTIVE';

    if (!user || !passwordMatches || isLocked || !isActive) {
      await this.registerFailedLogin(user, context);
      return this.invalidCredentials();
    }

    if (user.role === 'SUPER_ADMIN' && !user.two_factor_enabled) {
      await this.registerFailedLogin(user, context);
      throw new UnauthorizedException(
        'Conclua a configuração do segundo fator para acessar a Gestão.',
      );
    }

    if (user.two_factor_enabled) {
      if (
        !user.two_factor_secret ||
        !dto.twoFactorCode ||
        !this.twoFactorService.verify(
          user.two_factor_secret,
          dto.twoFactorCode,
        )
      ) {
        await this.registerFailedLogin(user, context);
        return this.invalidCredentials();
      }
    }

    await this.prisma.admin_user.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      },
    });

    return this.createSession(user, context);
  }

  async logout(
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.admin_session.updateMany({
        where: {
          id: admin.sessionId,
          admin_user_id: admin.id,
          revoked_at: null,
        },
        data: {
          revoked_at: new Date(),
          revoke_reason: 'Logout realizado pelo administrador.',
        },
      });
      await this.auditService.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'ADMIN_LOGOUT',
          resourceType: 'admin_session',
          resourceId: admin.sessionId,
        },
        tx,
      );
    });
  }

  async validateInvitation(token: string) {
    const tokenHash = this.hashInvitationToken(token);
    const invitation = await this.prisma.admin_invitation.findUnique({
      where: { token_hash: tokenHash },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        expires_at: true,
      },
    });

    if (
      !invitation ||
      invitation.status !== 'PENDING' ||
      invitation.expires_at <= new Date()
    ) {
      if (
        invitation?.status === 'PENDING' &&
        invitation.expires_at <= new Date()
      ) {
        await this.prisma.admin_invitation.updateMany({
          where: { id: invitation.id, status: 'PENDING' },
          data: { status: 'EXPIRED' },
        });
      }
      throw new BadRequestException(
        'Este convite é inválido, expirou ou já foi utilizado.',
      );
    }

    return {
      nome: invitation.nome,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expires_at,
    };
  }

  async acceptInvitation(
    dto: AcceptAdminInvitationDto,
    context: AdminRequestContext,
  ) {
    const tokenHash = this.hashInvitationToken(dto.token);
    const invitation = await this.prisma.admin_invitation.findUnique({
      where: { token_hash: tokenHash },
    });

    if (
      !invitation ||
      invitation.status !== 'PENDING' ||
      invitation.expires_at <= new Date()
    ) {
      throw new BadRequestException(
        'Este convite é inválido, expirou ou já foi utilizado.',
      );
    }

    const email = this.normalizeEmail(invitation.email);
    const existing = await this.prisma.admin_user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        'Não foi possível concluir o convite. Entre em contato com o suporte.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const enrollment =
      invitation.role === 'SUPER_ADMIN'
        ? await this.twoFactorService.createEnrollment(email)
        : null;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.admin_user.create({
        data: {
          nome: invitation.nome.trim().replace(/\s+/g, ' '),
          email,
          password_hash: passwordHash,
          role: invitation.role,
          two_factor_secret: enrollment?.encryptedSecret,
        },
      });

      const claimed = await tx.admin_invitation.updateMany({
        where: {
          id: invitation.id,
          status: 'PENDING',
          accepted_at: null,
          expires_at: { gt: new Date() },
        },
        data: {
          status: 'ACCEPTED',
          accepted_at: new Date(),
          accepted_admin_user_id: created.id,
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException(
          'Este convite já foi utilizado em outra solicitação.',
        );
      }

      await this.auditService.record(
        {
          ...context,
          adminUserId: created.id,
          adminRole: created.role,
          action: 'ADMIN_INVITATION_ACCEPTED',
          resourceType: 'admin_invitation',
          resourceId: invitation.id,
          newState: {
            adminUserId: created.id,
            role: created.role,
          },
        },
        tx,
      );
      return created;
    });

    if (enrollment) {
      const setupToken = this.jwtService.sign(
        {
          sub: user.id,
          purpose: 'admin-2fa-setup',
          typ: 'admin-setup',
        },
        {
          secret: getRequiredAdminJwtSecret(this.configService),
          expiresIn: '10m',
        },
      );
      return {
        requiresTwoFactorSetup: true,
        setupToken,
        otpauthUrl: enrollment.otpauthUrl,
        qrCodeDataUrl: enrollment.qrCodeDataUrl,
        manualKey: enrollment.manualKey,
      };
    }

    return {
      requiresTwoFactorSetup: false,
      session: await this.createSession(user, context),
    };
  }

  async confirmTwoFactor(
    dto: ConfirmAdminTwoFactorDto,
    context: AdminRequestContext,
  ): Promise<SessionResult> {
    let payload: {
      sub?: string;
      purpose?: string;
      typ?: string;
    };
    try {
      payload = this.jwtService.verify(dto.setupToken, {
        secret: getRequiredAdminJwtSecret(this.configService),
      });
    } catch {
      throw new UnauthorizedException(
        'A configuração expirou. Solicite um novo convite.',
      );
    }

    if (
      payload.purpose !== 'admin-2fa-setup' ||
      payload.typ !== 'admin-setup' ||
      !payload.sub
    ) {
      throw new UnauthorizedException('Token de configuração inválido.');
    }

    const user = await this.prisma.admin_user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        two_factor_enabled: true,
        two_factor_secret: true,
      },
    });
    if (
      !user ||
      user.status !== 'ACTIVE' ||
      user.two_factor_enabled ||
      !user.two_factor_secret ||
      !this.twoFactorService.verify(user.two_factor_secret, dto.code)
    ) {
      throw new UnauthorizedException('Código 2FA inválido.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.admin_user.update({
        where: { id: user.id },
        data: {
          two_factor_enabled: true,
          two_factor_confirmed_at: new Date(),
          last_login_at: new Date(),
        },
      });
      await this.auditService.record(
        {
          ...context,
          adminUserId: user.id,
          adminRole: user.role,
          action: 'ADMIN_TWO_FACTOR_ENABLED',
          resourceType: 'admin_user',
          resourceId: user.id,
        },
        tx,
      );
    });

    return this.createSession(user, context);
  }
}
