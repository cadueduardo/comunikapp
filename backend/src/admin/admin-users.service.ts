import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { admin_role, admin_user_status, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import {
  ListAdminUsersDto,
  UpdateAdminUserDto,
} from './dto/admin-users.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  async list(dto: ListAdminUsersDto) {
    const search = dto.search?.trim();
    const where: Prisma.admin_userWhereInput = {
      status: dto.status,
      role: dto.role,
      ...(search
        ? {
            OR: [
              { nome: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : {}),
    };
    const skip = (dto.page - 1) * dto.limit;
    const [total, users] = await this.prisma.$transaction([
      this.prisma.admin_user.count({ where }),
      this.prisma.admin_user.findMany({
        where,
        orderBy: [{ status: 'asc' }, { nome: 'asc' }],
        skip,
        take: dto.limit,
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          status: true,
          two_factor_enabled: true,
          last_login_at: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              sessions: {
                where: {
                  revoked_at: null,
                  expires_at: { gt: new Date() },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: users.map((user) => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        status: user.status,
        twoFactorEnabled: user.two_factor_enabled,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        activeSessions: user._count.sessions,
      })),
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / dto.limit)),
      },
    };
  }

  async update(
    id: string,
    dto: UpdateAdminUserDto,
    actor: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    if (dto.role === undefined && dto.status === undefined) {
      throw new BadRequestException(
        'Informe o novo perfil e/ou o novo status.',
      );
    }
    if (
      dto.status &&
      dto.status !== 'ACTIVE' &&
      dto.status !== 'INACTIVE'
    ) {
      throw new BadRequestException(
        'Somente ACTIVE ou INACTIVE são permitidos nesta operação.',
      );
    }

    const reason = dto.reason.trim();
    if (reason.length < 8) {
      throw new BadRequestException(
        'Informe uma justificativa com ao menos 8 caracteres.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.admin_user.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          status: true,
          password_hash: true,
        },
      });
      if (!current) {
        throw new NotFoundException('Administrador não encontrado.');
      }

      const nextRole = dto.role ?? current.role;
      const nextStatus = dto.status ?? current.status;

      if (nextRole === current.role && nextStatus === current.status) {
        throw new BadRequestException(
          'Nenhuma alteração de perfil ou status foi solicitada.',
        );
      }

      if (id === actor.id && nextStatus !== 'ACTIVE') {
        throw new BadRequestException(
          'Você não pode inativar a própria conta.',
        );
      }

      const promotingToSuperAdmin =
        current.role !== 'SUPER_ADMIN' && nextRole === 'SUPER_ADMIN';
      if (promotingToSuperAdmin) {
        await this.assertCurrentPassword(actor.id, dto.currentPassword, tx);
      }

      const demotingOrInactivatingLastSuperAdmin =
        current.role === 'SUPER_ADMIN' &&
        current.status === 'ACTIVE' &&
        (nextRole !== 'SUPER_ADMIN' || nextStatus !== 'ACTIVE');
      if (demotingOrInactivatingLastSuperAdmin) {
        const activeSuperAdmins = await tx.admin_user.count({
          where: {
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
          },
        });
        if (activeSuperAdmins <= 1) {
          throw new ConflictException(
            'Não é permitido inativar ou rebaixar o último SUPER_ADMIN ativo.',
          );
        }
      }

      const updated = await tx.admin_user.update({
        where: { id },
        data: {
          role: nextRole,
          status: nextStatus,
          ...(nextStatus !== 'ACTIVE'
            ? {
                failed_login_attempts: 0,
                locked_until: null,
              }
            : {}),
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          status: true,
          two_factor_enabled: true,
          last_login_at: true,
          created_at: true,
          updated_at: true,
        },
      });

      const revokeSessions =
        nextStatus !== 'ACTIVE' || nextRole !== current.role;
      if (revokeSessions) {
        await tx.admin_session.updateMany({
          where: {
            admin_user_id: id,
            revoked_at: null,
          },
          data: {
            revoked_at: new Date(),
            revoke_reason:
              nextStatus !== 'ACTIVE'
                ? 'ADMIN_INACTIVATED'
                : 'ADMIN_ROLE_CHANGED',
          },
        });
      }

      await this.auditService.record(
        {
          ...context,
          adminUserId: actor.id,
          adminRole: actor.role,
          action:
            nextStatus !== current.status
              ? nextStatus === 'ACTIVE'
                ? 'ADMIN_REACTIVATED'
                : 'ADMIN_INACTIVATED'
              : 'ADMIN_ROLE_CHANGED',
          resourceType: 'admin_user',
          resourceId: id,
          previousState: {
            role: current.role,
            status: current.status,
          },
          newState: {
            role: updated.role,
            status: updated.status,
          },
          reason,
          category: 'ADMIN_MANAGE',
        },
        tx,
      );

      return {
        id: updated.id,
        nome: updated.nome,
        email: updated.email,
        role: updated.role,
        status: updated.status,
        twoFactorEnabled: updated.two_factor_enabled,
        lastLoginAt: updated.last_login_at,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
        sessionsRevoked: revokeSessions,
      };
    });
  }

  private async assertCurrentPassword(
    actorId: string,
    currentPassword: string | undefined,
    tx: Prisma.TransactionClient,
  ) {
    if (!currentPassword) {
      throw new ForbiddenException(
        'Informe sua senha atual para promover alguém a SUPER_ADMIN.',
      );
    }
    const actor = await tx.admin_user.findUnique({
      where: { id: actorId },
      select: { password_hash: true, status: true },
    });
    if (!actor || actor.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sessão administrativa inválida.');
    }
    const valid = await bcrypt.compare(
      currentPassword,
      actor.password_hash,
    );
    if (!valid) {
      throw new UnauthorizedException('Senha atual inválida.');
    }
  }
}
