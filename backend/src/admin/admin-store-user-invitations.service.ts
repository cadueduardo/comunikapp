import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { loja_status } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import {
  AcceptStoreUserInvitationDto,
  CreateStoreUserInvitationDto,
  UpdateStoreUserInvitationDto,
} from './dto/store-user-invitation.dto';

@Injectable()
export class AdminStoreUserInvitationsService {
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
      process.env.APP_FRONTEND_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
    return `${baseUrl}/convite-loja?token=${encodeURIComponent(token)}`;
  }

  private async expireInvitations(lojaId?: string) {
    await this.prisma.store_user_invitation.updateMany({
      where: {
        status: 'PENDING',
        expires_at: { lte: new Date() },
        ...(lojaId ? { loja_id: lojaId } : {}),
      },
      data: { status: 'EXPIRED' },
    });
  }

  private assertStoreAcceptsInvites(
    store: { id: string; status: loja_status; nome: string },
    admin: AuthenticatedAdmin,
    exceptionReason?: string,
  ) {
    if (store.status === 'ATIVO') return;
    if (admin.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Lojas inativas ou bloqueadas não recebem novos convites.',
      );
    }
    const reason = exceptionReason?.trim();
    if (!reason || reason.length < 8) {
      throw new BadRequestException(
        'Informe uma justificativa com ao menos 8 caracteres para convidar em loja não ativa.',
      );
    }
  }

  private serializeInvitation(
    invitation: {
      id: string;
      loja_id: string;
      usuario_id: string;
      nome: string;
      email: string;
      funcao: string;
      telefone: string | null;
      mensagem: string | null;
      status: string;
      expires_at: Date;
      accepted_at: Date | null;
      cancelled_at: Date | null;
      created_at: Date;
      updated_at: Date;
      invited_by?: {
        id: string;
        nome: string;
        email: string;
      } | null;
      usuario?: {
        id: string;
        status: string;
        email_verificado: boolean;
      } | null;
      loja?: {
        id: string;
        nome: string;
        slug: string;
        status: string;
      } | null;
    },
  ) {
    return {
      id: invitation.id,
      lojaId: invitation.loja_id,
      usuarioId: invitation.usuario_id,
      nome: invitation.nome,
      email: invitation.email,
      funcao: invitation.funcao,
      telefone: invitation.telefone,
      mensagem: invitation.mensagem,
      status: invitation.status,
      expiresAt: invitation.expires_at,
      acceptedAt: invitation.accepted_at,
      cancelledAt: invitation.cancelled_at,
      createdAt: invitation.created_at,
      updatedAt: invitation.updated_at,
      invitedBy: invitation.invited_by || null,
      usuario: invitation.usuario || null,
      loja: invitation.loja || null,
    };
  }

  async list(lojaId: string) {
    await this.expireInvitations(lojaId);
    const invitations = await this.prisma.store_user_invitation.findMany({
      where: { loja_id: lojaId },
      orderBy: { created_at: 'desc' },
      take: 200,
      select: {
        id: true,
        loja_id: true,
        usuario_id: true,
        nome: true,
        email: true,
        funcao: true,
        telefone: true,
        mensagem: true,
        status: true,
        expires_at: true,
        accepted_at: true,
        cancelled_at: true,
        created_at: true,
        updated_at: true,
        invited_by: {
          select: { id: true, nome: true, email: true },
        },
        usuario: {
          select: {
            id: true,
            status: true,
            email_verificado: true,
          },
        },
      },
    });
    return invitations.map((item) => this.serializeInvitation(item));
  }

  async create(
    lojaId: string,
    dto: CreateStoreUserInvitationDto,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    await this.expireInvitations(lojaId);
    const email = this.normalizeEmail(dto.email);
    const nome = this.normalizeName(dto.nome);
    const telefone = dto.telefone?.trim() || null;
    const mensagem = dto.mensagem?.trim() || null;

    const store = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: { id: true, status: true, nome: true, slug: true },
    });
    if (!store) {
      throw new NotFoundException('Loja não encontrada.');
    }
    this.assertStoreAcceptsInvites(store, admin, dto.exceptionReason);

    const [existingUser, pendingInvitation] = await Promise.all([
      this.prisma.usuario.findUnique({
        where: { email },
        select: { id: true, loja_id: true, status: true },
      }),
      this.prisma.store_user_invitation.findFirst({
        where: { email, status: 'PENDING' },
        select: { id: true, loja_id: true },
      }),
    ]);
    if (existingUser) {
      throw new ConflictException(
        existingUser.loja_id === lojaId
          ? 'Já existe um usuário com este e-mail nesta loja.'
          : 'Este e-mail já está vinculado a outra loja.',
      );
    }
    if (pendingInvitation) {
      throw new ConflictException(
        pendingInvitation.loja_id === lojaId
          ? 'Já existe um convite pendente para este e-mail nesta loja.'
          : 'Já existe um convite pendente para este e-mail em outra loja.',
      );
    }

    const { token, tokenHash } = this.createToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    const invitation = await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          loja_id: lojaId,
          email,
          nome_completo: nome,
          funcao: dto.funcao,
          telefone,
          status: 'PENDENTE_VERIFICACAO',
          email_verificado: false,
          senha: null,
          ativo: true,
        },
        select: { id: true },
      });

      const created = await tx.store_user_invitation.create({
        data: {
          loja_id: lojaId,
          usuario_id: usuario.id,
          nome,
          email,
          funcao: dto.funcao,
          telefone,
          mensagem,
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
          action: 'STORE_USER_INVITATION_CREATED',
          resourceType: 'store_user_invitation',
          resourceId: created.id,
          lojaId,
          newState: {
            nome,
            email,
            funcao: dto.funcao,
            expiresAt,
            exceptionReason: dto.exceptionReason?.trim() || null,
          },
          reason: dto.exceptionReason?.trim() || null,
          category: 'STORE_USER_INVITE',
        },
        tx,
      );

      return created;
    });

    let emailSent = true;
    try {
      await this.mailService.sendStoreUserInvitationEmail({
        to: email,
        nome,
        inviterName: admin.nome,
        lojaNome: store.nome,
        funcao: dto.funcao,
        invitationUrl: this.getInvitationUrl(token),
        expiresAt,
        message: mensagem || undefined,
      });
    } catch {
      emailSent = false;
      await this.auditService.record({
        ...context,
        adminUserId: admin.id,
        adminRole: admin.role,
        action: 'STORE_USER_INVITATION_EMAIL_FAILED',
        resourceType: 'store_user_invitation',
        resourceId: invitation.id,
        lojaId,
        category: 'STORE_USER_INVITE',
      });
    }

    return {
      id: invitation.id,
      lojaId,
      nome,
      email,
      funcao: dto.funcao,
      status: invitation.status,
      expiresAt,
      emailSent,
    };
  }

  async update(
    lojaId: string,
    invitationId: string,
    dto: UpdateStoreUserInvitationDto,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    if (
      dto.nome === undefined &&
      dto.funcao === undefined &&
      dto.telefone === undefined &&
      dto.mensagem === undefined
    ) {
      throw new BadRequestException('Informe ao menos um campo para atualizar.');
    }

    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.store_user_invitation.findFirst({
        where: { id: invitationId, loja_id: lojaId },
        select: {
          id: true,
          status: true,
          usuario_id: true,
          nome: true,
          funcao: true,
          telefone: true,
          mensagem: true,
        },
      });
      if (!invitation) {
        throw new NotFoundException('Convite não encontrado.');
      }
      if (invitation.status !== 'PENDING') {
        throw new BadRequestException(
          'Somente convites pendentes podem ser editados.',
        );
      }

      const nome =
        dto.nome !== undefined
          ? this.normalizeName(dto.nome)
          : invitation.nome;
      const funcao = dto.funcao ?? invitation.funcao;
      const telefone =
        dto.telefone !== undefined
          ? dto.telefone.trim() || null
          : invitation.telefone;
      const mensagem =
        dto.mensagem !== undefined
          ? dto.mensagem.trim() || null
          : invitation.mensagem;

      const updated = await tx.store_user_invitation.update({
        where: { id: invitationId },
        data: { nome, funcao, telefone, mensagem },
      });

      await tx.usuario.update({
        where: { id: invitation.usuario_id },
        data: {
          nome_completo: nome,
          funcao,
          telefone,
        },
      });

      await this.auditService.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'STORE_USER_INVITATION_UPDATED',
          resourceType: 'store_user_invitation',
          resourceId: invitationId,
          lojaId,
          previousState: {
            nome: invitation.nome,
            funcao: invitation.funcao,
            telefone: invitation.telefone,
          },
          newState: { nome, funcao, telefone },
          category: 'STORE_USER_INVITE',
        },
        tx,
      );

      return this.serializeInvitation(updated);
    });
  }

  async resend(
    lojaId: string,
    invitationId: string,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    const invitation = await this.prisma.store_user_invitation.findFirst({
      where: { id: invitationId, loja_id: lojaId },
      select: {
        id: true,
        nome: true,
        email: true,
        funcao: true,
        status: true,
        mensagem: true,
        loja: { select: { nome: true, status: true } },
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
    if (invitation.loja.status !== 'ATIVO' && admin.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Não é possível reenviar convite para loja inativa ou bloqueada.',
      );
    }

    const { token, tokenHash } = this.createToken();
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.prisma.$transaction(async (tx) => {
      await tx.store_user_invitation.update({
        where: { id: invitationId },
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
          action: 'STORE_USER_INVITATION_RESENT',
          resourceType: 'store_user_invitation',
          resourceId: invitationId,
          lojaId,
          newState: { expiresAt },
          category: 'STORE_USER_INVITE',
        },
        tx,
      );
    });

    let emailSent = true;
    try {
      await this.mailService.sendStoreUserInvitationEmail({
        to: invitation.email,
        nome: invitation.nome,
        inviterName: admin.nome,
        lojaNome: invitation.loja.nome,
        funcao: invitation.funcao,
        invitationUrl: this.getInvitationUrl(token),
        expiresAt,
        message: invitation.mensagem || undefined,
      });
    } catch {
      emailSent = false;
      await this.auditService.record({
        ...context,
        adminUserId: admin.id,
        adminRole: admin.role,
        action: 'STORE_USER_INVITATION_EMAIL_FAILED',
        resourceType: 'store_user_invitation',
        resourceId: invitationId,
        lojaId,
        category: 'STORE_USER_INVITE',
      });
    }

    return { id: invitationId, status: 'PENDING', expiresAt, emailSent };
  }

  async cancel(
    lojaId: string,
    invitationId: string,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const invitation = await tx.store_user_invitation.findFirst({
        where: { id: invitationId, loja_id: lojaId },
        select: { id: true, status: true, usuario_id: true },
      });
      if (!invitation) {
        throw new NotFoundException('Convite não encontrado.');
      }
      if (invitation.status !== 'PENDING') {
        throw new BadRequestException(
          'Somente convites pendentes podem ser cancelados.',
        );
      }

      const updated = await tx.store_user_invitation.updateMany({
        where: { id: invitationId, loja_id: lojaId, status: 'PENDING' },
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
          'O convite foi alterado por outra operação. Tente novamente.',
        );
      }

      await tx.usuario.updateMany({
        where: {
          id: invitation.usuario_id,
          loja_id: lojaId,
          status: 'PENDENTE_VERIFICACAO',
          email_verificado: false,
        },
        data: {
          status: 'INATIVO',
          ativo: false,
        },
      });

      await this.auditService.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'STORE_USER_INVITATION_CANCELLED',
          resourceType: 'store_user_invitation',
          resourceId: invitationId,
          lojaId,
          category: 'STORE_USER_INVITE',
        },
        tx,
      );
    });

    return { id: invitationId, status: 'CANCELLED' };
  }

  async validateToken(token: string) {
    await this.expireInvitations();
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const invitation = await this.prisma.store_user_invitation.findUnique({
      where: { token_hash: tokenHash },
      select: {
        id: true,
        nome: true,
        email: true,
        funcao: true,
        status: true,
        expires_at: true,
        loja: {
          select: { id: true, nome: true, slug: true, status: true },
        },
      },
    });
    if (!invitation || invitation.status !== 'PENDING') {
      throw new NotFoundException('Convite inválido ou já utilizado.');
    }
    if (invitation.expires_at <= new Date()) {
      await this.prisma.store_user_invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Este convite expirou.');
    }
    return {
      nome: invitation.nome,
      email: invitation.email,
      funcao: invitation.funcao,
      expiresAt: invitation.expires_at,
      loja: {
        nome: invitation.loja.nome,
        slug: invitation.loja.slug,
        status: invitation.loja.status,
      },
    };
  }

  async accept(
    dto: AcceptStoreUserInvitationDto,
    context: AdminRequestContext,
  ) {
    await this.expireInvitations();
    const tokenHash = createHash('sha256').update(dto.token).digest('hex');
    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.store_user_invitation.findUnique({
        where: { token_hash: tokenHash },
        select: {
          id: true,
          status: true,
          expires_at: true,
          loja_id: true,
          usuario_id: true,
          nome: true,
          email: true,
          funcao: true,
          loja: { select: { id: true, status: true, nome: true, slug: true } },
        },
      });
      if (!invitation || invitation.status !== 'PENDING') {
        throw new NotFoundException('Convite inválido ou já utilizado.');
      }
      if (invitation.expires_at <= new Date()) {
        await tx.store_user_invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
        throw new BadRequestException('Este convite expirou.');
      }

      const nextUserStatus =
        invitation.loja.status === 'ATIVO' ? 'ATIVO' : 'PENDENTE_VERIFICACAO';

      await tx.usuario.update({
        where: { id: invitation.usuario_id },
        data: {
          senha: passwordHash,
          email_verificado: true,
          status: nextUserStatus,
          ativo: nextUserStatus === 'ATIVO',
          codigo_verificacao_email: null,
          codigo_verificacao_email_expiracao: null,
          nome_completo: invitation.nome,
          funcao: invitation.funcao,
        },
      });

      await tx.store_user_invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          accepted_at: new Date(),
          token_hash: createHash('sha256')
            .update(randomBytes(32))
            .digest('hex'),
        },
      });

      await this.auditService.record(
        {
          ...context,
          action: 'STORE_USER_INVITATION_ACCEPTED',
          resourceType: 'store_user_invitation',
          resourceId: invitation.id,
          lojaId: invitation.loja_id,
          newState: {
            usuarioId: invitation.usuario_id,
            status: nextUserStatus,
          },
          category: 'STORE_USER_INVITE',
        },
        tx,
      );

      return {
        accepted: true,
        userStatus: nextUserStatus,
        loja: {
          nome: invitation.loja.nome,
          slug: invitation.loja.slug,
          status: invitation.loja.status,
        },
      };
    });
  }

  async listUsers(lojaId: string, admin: AuthenticatedAdmin) {
    const store = await this.prisma.loja.findUnique({
      where: { id: lojaId },
      select: { id: true },
    });
    if (!store) {
      throw new NotFoundException('Loja não encontrada.');
    }

    const users = await this.prisma.usuario.findMany({
      where: { loja_id: lojaId },
      orderBy: [{ status: 'asc' }, { nome_completo: 'asc' }],
      take: 500,
      select: {
        id: true,
        nome_completo: true,
        email: true,
        funcao: true,
        status: true,
        telefone: true,
        email_verificado: true,
        two_factor_enabled: true,
        criado_em: true,
        atualizado_em: true,
      },
    });

    const maskEmail = (email: string) => {
      const [local, domain] = email.split('@');
      if (!domain) return '***';
      const visible = local.slice(0, Math.min(2, local.length));
      return `${visible}***@${domain}`;
    };

    return users.map((user) => ({
      id: user.id,
      nome: user.nome_completo,
      email:
        admin.role === 'ANALISTA' ? maskEmail(user.email) : user.email,
      funcao: user.funcao,
      status: user.status,
      telefone:
        admin.role === 'ANALISTA' ? null : user.telefone,
      emailVerificado: user.email_verificado,
      twoFactorEnabled: user.two_factor_enabled,
      criadoEm: user.criado_em,
      atualizadoEm: user.atualizado_em,
    }));
  }
}
