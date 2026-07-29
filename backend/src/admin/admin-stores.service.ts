import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { admin_role, loja_status, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import { ListAdminStoresDto } from './dto/list-admin-stores.dto';
import { UpdateAdminStoreStatusDto } from './dto/update-admin-store-status.dto';

const ALLOWED_TRANSITIONS: Record<loja_status, readonly loja_status[]> = {
  PENDENTE_VERIFICACAO: ['ATIVO', 'BLOQUEADO'],
  ATIVO: ['INATIVO', 'BLOQUEADO'],
  INATIVO: ['ATIVO'],
  BLOQUEADO: ['ATIVO'],
};

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskDocument(document?: string | null) {
  if (!document) return null;
  const digits = document.replace(/\D/g, '');
  if (digits.length <= 4) return '***';
  return `${'*'.repeat(Math.max(3, digits.length - 4))}${digits.slice(-4)}`;
}

@Injectable()
export class AdminStoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AdminAuditService,
  ) {}

  private exposeSensitiveFields(role: admin_role) {
    return role !== 'ANALISTA';
  }

  private serializeStore<
    T extends {
      email: string;
      cnpj?: string | null;
      cpf?: string | null;
    },
  >(store: T, role: admin_role) {
    if (this.exposeSensitiveFields(role)) return store;
    return {
      ...store,
      email: maskEmail(store.email),
      cnpj: maskDocument(store.cnpj),
      cpf: maskDocument(store.cpf),
    };
  }

  async list(dto: ListAdminStoresDto, admin: AuthenticatedAdmin) {
    const search = dto.search?.trim();
    const where: Prisma.lojaWhereInput = {
      status: dto.status,
      ...(search
        ? {
            OR: [
              { id: { contains: search } },
              { nome: { contains: search } },
              { email: { contains: search } },
              { cnpj: { contains: search } },
              { cpf: { contains: search } },
              { slug: { contains: search } },
            ],
          }
        : {}),
    };
    const skip = (dto.page - 1) * dto.limit;

    const [total, stores] = await this.prisma.$transaction([
      this.prisma.loja.count({ where }),
      this.prisma.loja.findMany({
        where,
        orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
        skip,
        take: dto.limit,
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cnpj: true,
          cpf: true,
          status: true,
          assinatura_ativa: true,
          data_inicio_trial: true,
          trial_restante_dias: true,
          slug: true,
          dominio_custom: true,
          dominio_custom_status: true,
          criado_em: true,
          atualizado_em: true,
          _count: {
            select: {
              usuario: {
                where: {
                  status: 'ATIVO',
                  ativo: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      data: stores.map((store) =>
        this.serializeStore(
          {
            ...store,
            activeUsers: store._count.usuario,
            _count: undefined,
          },
          admin.role,
        ),
      ),
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.ceil(total / dto.limit),
      },
    };
  }

  async detail(id: string, admin: AuthenticatedAdmin) {
    const store = await this.prisma.loja.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        razao_social: true,
        nome_fantasia: true,
        email: true,
        telefone: true,
        cnpj: true,
        cpf: true,
        status: true,
        assinatura_ativa: true,
        data_inicio_trial: true,
        trial_restante_dias: true,
        slug: true,
        dominio_custom: true,
        dominio_custom_status: true,
        dominio_custom_verificado_em: true,
        criado_em: true,
        atualizado_em: true,
        _count: {
          select: {
          usuario: {
            where: {
              status: 'ATIVO',
              ativo: true,
            },
          },
            cliente: true,
            orcamento: true,
            ordens_servico: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Loja não encontrada.');
    }

    return this.serializeStore(
      {
        ...store,
        counts: {
          users: store._count.usuario,
          clients: store._count.cliente,
          budgets: store._count.orcamento,
          serviceOrders: store._count.ordens_servico,
        },
        _count: undefined,
      },
      admin.role,
    );
  }

  async timeline(id: string, admin: AuthenticatedAdmin, limit = 50) {
    const store = await this.prisma.loja.findUnique({
      where: { id },
      select: { id: true, nome: true },
    });
    if (!store) {
      throw new NotFoundException('Loja não encontrada.');
    }

    const [deletedBudgets, adminEvents] = await Promise.all([
      this.prisma.orcamento.findMany({
        where: {
          loja_id: id,
          excluido_em: { not: null },
        },
        orderBy: { excluido_em: 'desc' },
        take: limit,
        select: {
          id: true,
          numero: true,
          nome_servico: true,
          status: true,
          excluido_em: true,
          excluido_por: true,
          motivo_exclusao: true,
          criado_em: true,
        },
      }),
      this.prisma.admin_audit_log.findMany({
        where: { loja_id: id },
        orderBy: { occurred_at: 'desc' },
        take: limit,
        select: {
          id: true,
          occurred_at: true,
          action: true,
          resource_type: true,
          resource_id: true,
          reason: true,
          category: true,
          admin_role: true,
          admin_user: {
            select: {
              id: true,
              nome: true,
              email: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const deleterIds = [
      ...new Set(
        deletedBudgets
          .map((budget) => budget.excluido_por)
          .filter((value): value is string => Boolean(value)),
      ),
    ];
    const deleters =
      deleterIds.length === 0
        ? []
        : await this.prisma.usuario.findMany({
            where: {
              id: { in: deleterIds },
              loja_id: id,
            },
            select: {
              id: true,
              nome_completo: true,
              nome: true,
              email: true,
            },
          });
    const deleterById = new Map(deleters.map((user) => [user.id, user]));
    const exposeSensitive = admin.role !== 'ANALISTA';

    const budgetEvents = deletedBudgets.map((budget) => {
      const actor = budget.excluido_por
        ? deleterById.get(budget.excluido_por)
        : undefined;
      return {
        id: `orcamento-excluido:${budget.id}`,
        at: budget.excluido_em!.toISOString(),
        source: 'STORE_OPERATION' as const,
        type: 'ORCAMENTO_EXCLUIDO' as const,
        title: `Orçamento ${budget.numero} excluído`,
        summary: budget.nome_servico,
        reason: budget.motivo_exclusao,
        actor: actor
          ? {
              id: actor.id,
              nome: actor.nome_completo || actor.nome || 'Usuário da loja',
              email: exposeSensitive ? actor.email : undefined,
              kind: 'STORE_USER' as const,
            }
          : budget.excluido_por
            ? {
                id: budget.excluido_por,
                nome: 'Usuário não encontrado',
                kind: 'STORE_USER' as const,
              }
            : null,
        resource: {
          type: 'orcamento',
          id: budget.id,
          label: budget.numero,
        },
      };
    });

    const adminTimeline = adminEvents.map((event) => ({
      id: `admin-audit:${event.id}`,
      at: event.occurred_at.toISOString(),
      source: 'ADMIN_AUDIT' as const,
      type: event.action,
      title: event.action,
      summary: event.resource_type,
      reason: event.reason,
      category: event.category,
      actor: event.admin_user
        ? {
            id: event.admin_user.id,
            nome: event.admin_user.nome,
            email: exposeSensitive ? event.admin_user.email : undefined,
            role: event.admin_user.role,
            kind: 'ADMIN_USER' as const,
          }
        : null,
      resource: {
        type: event.resource_type,
        id: event.resource_id,
        label: event.resource_id,
      },
    }));

    const data = [...budgetEvents, ...adminTimeline]
      .sort(
        (left, right) =>
          new Date(right.at).getTime() - new Date(left.at).getTime(),
      )
      .slice(0, limit);

    return {
      store: {
        id: store.id,
        nome: store.nome,
      },
      data,
      definitions: {
        scope:
          'Eventos da loja para suporte: exclusões de orçamento e ações administrativas vinculadas.',
        orcamentoExcluido:
          'Soft delete com excluido_por, excluido_em e motivo_exclusao.',
      },
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateAdminStoreStatusDto,
    admin: AuthenticatedAdmin,
    context: AdminRequestContext,
  ) {
    if (dto.status === 'BLOQUEADO' && admin.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Somente SUPER_ADMIN pode bloquear uma loja.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.loja.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          status: true,
          assinatura_ativa: true,
          session_version: true,
        },
      });
      if (!current) {
        throw new NotFoundException('Loja não encontrada.');
      }

      if (current.status === dto.status) {
        throw new BadRequestException(
          `A loja já está com o status ${dto.status}.`,
        );
      }

      if (!ALLOWED_TRANSITIONS[current.status].includes(dto.status)) {
        throw new BadRequestException(
          `Transição de ${current.status} para ${dto.status} não permitida.`,
        );
      }

      if (
        (current.status === 'BLOQUEADO' || dto.status === 'BLOQUEADO') &&
        admin.role !== 'SUPER_ADMIN'
      ) {
        throw new ForbiddenException(
          'Somente SUPER_ADMIN pode bloquear ou reativar uma loja bloqueada.',
        );
      }

      const revokesSessions =
        dto.status === 'INATIVO' || dto.status === 'BLOQUEADO';
      const updated = await tx.loja.updateMany({
        where: {
          id,
          status: current.status,
        },
        data: {
          status: dto.status,
          atualizado_em: new Date(),
          ...(revokesSessions
            ? { session_version: { increment: 1 } }
            : {}),
        },
      });
      if (updated.count !== 1) {
        throw new ConflictException(
          'O status da loja foi alterado por outra operação. Atualize a página e tente novamente.',
        );
      }

      const result = await tx.loja.findUniqueOrThrow({
        where: { id },
        select: {
          id: true,
          nome: true,
          status: true,
          assinatura_ativa: true,
          session_version: true,
          atualizado_em: true,
        },
      });

      await this.auditService.record(
        {
          ...context,
          adminUserId: admin.id,
          adminRole: admin.role,
          action: 'STORE_STATUS_CHANGED',
          resourceType: 'loja',
          resourceId: id,
          lojaId: id,
          previousState: {
            status: current.status,
            assinaturaAtiva: current.assinatura_ativa,
            sessionVersion: current.session_version,
          },
          newState: {
            status: result.status,
            assinaturaAtiva: result.assinatura_ativa,
            sessionVersion: result.session_version,
          },
          reason: dto.reason.trim(),
          category: dto.category,
        },
        tx,
      );

      return result;
    });
  }
}
