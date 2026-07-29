import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import { CreateAdminInvitationDto } from './dto/create-admin-invitation.dto';

@Injectable()
export class AdminInvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly auditService: AdminAuditService,
  ) {}

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private createToken() {
    const token = randomBytes(32).toString('base64url');
    return {
      token,
      tokenHash: createHash('sha256').update(token).digest('hex'),
    };
  }

  private getInvitationUrl(token: string) {
    const baseUrl = (
      process.env.GESTAO_FRONTEND_URL ||
      'https://gestao.comunikapp.com.br/gestao'
    ).replace(/\/$/, '');
    return `${baseUrl}/aceitar-convite?token=${encodeURIComponent(token)}`;
  }

  private async expireInvitations() {
    await this.prisma.admin_invitation.updateMany({
      where: {
        status: 'PENDING',
        expires_at: { lte: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
  }

  async list() {
    await this.expireInvitations();
    return this.prisma.admin_invitation.findMany({
      orderBy: { created_at: 'desc' },
      take: 200,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
        expires_at: true,
        accepted_at: true,
        cancelled_at: true,
        created_at: true,
        updated_at: true,
        invited_by: {
          select: {
            id: true,
            nome: true,
            email: true,
          },
        },
      },
    });
  }

  async create(
    dto: CreateAdminInvitationDto,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    await this.expireInvitations();
    const email = this.normalizeEmail(dto.email);
    const nome = this.normalizeName(dto.nome);

    const [existingUser, pendingInvitation] = await Promise.all([
      this.prisma.admin_user.findUnique({
        where: { email },
        select: { id: true },
      }),
      this.prisma.admin_invitation.findFirst({
        where: { email, status: 'PENDING' },
        select: { id: true },
      }),
    ]);
    if (existingUser || pendingInvitation) {
      throw new ConflictException(
        'Já existe uma conta ou convite pendente para este e-mail.',
      );
    }

    const { token, tokenHash } = this.createToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const invitation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.admin_invitation.create({
        data: {
          nome,
          email,
          role: dto.role,
          token_hash: tokenHash,
          expires_at: expiresAt,
          invited_by_id: admin.id,
        },
      });
      await this.auditService.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'ADMIN_INVITATION_CREATED',
          resourceType: 'admin_invitation',
          resourceId: created.id,
          newState: {
            nome,
            email,
            role: dto.role,
            expiresAt,
          },
        },
        tx,
      );
      return created;
    });

    let emailSent = true;
    try {
      await this.mailService.sendAdminInvitationEmail({
        to: email,
        nome,
        inviterName: admin.nome,
        role: dto.role,
        invitationUrl: this.getInvitationUrl(token),
        expiresAt,
        message: dto.mensagem?.trim(),
      });
    } catch {
      emailSent = false;
      await this.auditService.record({
        ...context,
        adminUserId: admin.id,
        adminRole: admin.role,
        action: 'ADMIN_INVITATION_EMAIL_FAILED',
        resourceType: 'admin_invitation',
        resourceId: invitation.id,
      });
    }

    return {
      id: invitation.id,
      nome,
      email,
      role: dto.role,
      status: invitation.status,
      expiresAt,
      emailSent,
    };
  }

  async resend(
    id: string,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    const invitation = await this.prisma.admin_invitation.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        status: true,
      },
    });
    if (!invitation) {
      throw new NotFoundException('Convite não encontrado.');
    }
    if (
      invitation.status === 'ACCEPTED' ||
      invitation.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Este convite não pode mais ser reenviado.',
      );
    }

    const { token, tokenHash } = this.createToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.prisma.$transaction(async (tx) => {
      await tx.admin_invitation.update({
        where: { id },
        data: {
          token_hash: tokenHash,
          status: 'PENDING',
          expires_at: expiresAt,
          cancelled_at: null,
        },
      });
      await this.auditService.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'ADMIN_INVITATION_RESENT',
          resourceType: 'admin_invitation',
          resourceId: id,
          newState: { expiresAt },
        },
        tx,
      );
    });

    let emailSent = true;
    try {
      await this.mailService.sendAdminInvitationEmail({
        to: invitation.email,
        nome: invitation.nome,
        inviterName: admin.nome,
        role: invitation.role,
        invitationUrl: this.getInvitationUrl(token),
        expiresAt,
      });
    } catch {
      emailSent = false;
      await this.auditService.record({
        ...context,
        adminUserId: admin.id,
        adminRole: admin.role,
        action: 'ADMIN_INVITATION_EMAIL_FAILED',
        resourceType: 'admin_invitation',
        resourceId: id,
      });
    }

    return { id, status: 'PENDING', expiresAt, emailSent };
  }

  async cancel(
    id: string,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.admin_invitation.findUnique({
        where: { id },
        select: { id: true, status: true },
      });
      if (!invitation) {
        throw new NotFoundException('Convite não encontrado.');
      }
      if (invitation.status !== 'PENDING') {
        throw new BadRequestException(
          'Somente convites pendentes podem ser cancelados.',
        );
      }

      const updated = await tx.admin_invitation.updateMany({
        where: { id, status: 'PENDING' },
        data: {
          status: 'CANCELLED',
          cancelled_at: new Date(),
          token_hash: createHash('sha256')
            .update(randomBytes(32))
            .digest('hex'),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'O convite foi alterado por outra operação.',
        );
      }

      await this.auditService.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'ADMIN_INVITATION_CANCELLED',
          resourceType: 'admin_invitation',
          resourceId: id,
          newState: { status: 'CANCELLED' },
        },
        tx,
      );
    });
    return { id, status: 'CANCELLED' };
  }
}

