import { Injectable } from '@nestjs/common';
import { admin_role, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRequestContext } from './admin-request-context';
import { AuthenticatedAdmin } from './admin.types';
import { ListAdminAuditDto } from './dto/list-admin-audit.dto';

const SENSITIVE_KEY_PATTERN =
  /password|senha|token|secret|segredo|authorization|cookie|codigo|code/i;

type AuditClient = PrismaService | Prisma.TransactionClient;

export interface AdminAuditInput extends AdminRequestContext {
  adminUserId?: string;
  adminRole?: admin_role;
  action: string;
  resourceType: string;
  resourceId?: string;
  lojaId?: string;
  previousState?: unknown;
  newState?: unknown;
  reason?: string;
  category?: string;
  metadata?: unknown;
}

function sanitizeJson(
  value: unknown,
  depth = 0,
): Prisma.InputJsonValue | undefined {
  if (value === undefined || depth > 8) return undefined;
  if (value === null) return null;
  if (
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    typeof value === 'number'
  ) {
    return value;
  }
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeJson(item, depth + 1))
      .filter(
        (item): item is Prisma.InputJsonValue => item !== undefined,
      );
  }
  if (typeof value === 'object') {
    const output: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEY_PATTERN.test(key)) continue;
      const sanitized = sanitizeJson(item, depth + 1);
      if (sanitized !== undefined) output[key] = sanitized;
    }
    return output;
  }
  return String(value);
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    input: AdminAuditInput,
    client: AuditClient = this.prisma,
  ) {
    const previousState = sanitizeJson(input.previousState);
    const newState = sanitizeJson(input.newState);
    const metadata = sanitizeJson(input.metadata);

    return client.admin_audit_log.create({
      data: {
        admin_user_id: input.adminUserId,
        admin_role: input.adminRole,
        action: input.action.slice(0, 96),
        resource_type: input.resourceType.slice(0, 64),
        resource_id: input.resourceId?.slice(0, 191),
        loja_id: input.lojaId,
        previous_state: previousState,
        new_state: newState,
        reason: input.reason?.slice(0, 1000),
        category: input.category?.slice(0, 64),
        ip_address: input.ipAddress?.slice(0, 45),
        user_agent: input.userAgent?.slice(0, 512),
        correlation_id: input.correlationId?.slice(0, 128),
        metadata,
      },
    });
  }

  async list(dto: ListAdminAuditDto, admin: AuthenticatedAdmin) {
    const search = dto.search?.trim();
    const where: Prisma.admin_audit_logWhereInput = {
      action: dto.action || undefined,
      resource_type: dto.resourceType || undefined,
      loja_id: dto.lojaId || undefined,
      admin_user_id: dto.adminUserId || undefined,
      occurred_at: {
        gte: dto.from ? new Date(dto.from) : undefined,
        lte: dto.to ? new Date(dto.to) : undefined,
      },
      ...(search
        ? {
            OR: [
              { action: { contains: search } },
              { resource_type: { contains: search } },
              { resource_id: { contains: search } },
              { loja_id: { contains: search } },
              { reason: { contains: search } },
              { category: { contains: search } },
              { correlation_id: { contains: search } },
              {
                admin_user: {
                  OR: [
                    { nome: { contains: search } },
                    { email: { contains: search } },
                  ],
                },
              },
              {
                loja: {
                  OR: [
                    { nome: { contains: search } },
                    { slug: { contains: search } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const skip = (dto.page - 1) * dto.limit;
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.admin_audit_log.count({ where }),
      this.prisma.admin_audit_log.findMany({
        where,
        orderBy: [{ occurred_at: 'desc' }, { id: 'desc' }],
        skip,
        take: dto.limit,
        select: {
          id: true,
          occurred_at: true,
          admin_user_id: true,
          admin_role: true,
          action: true,
          resource_type: true,
          resource_id: true,
          loja_id: true,
          previous_state: true,
          new_state: true,
          reason: true,
          category: true,
          ip_address: true,
          user_agent: true,
          correlation_id: true,
          metadata: true,
          admin_user: {
            select: {
              id: true,
              nome: true,
              email: true,
              role: true,
            },
          },
          loja: {
            select: {
              id: true,
              nome: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    const exposeNetwork = admin.role !== 'ANALISTA';

    return {
      data: rows.map((row) => ({
        ...row,
        ip_address: exposeNetwork ? row.ip_address : null,
        user_agent: exposeNetwork ? row.user_agent : null,
      })),
      pagination: {
        page: dto.page,
        limit: dto.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / dto.limit)),
      },
    };
  }
}
