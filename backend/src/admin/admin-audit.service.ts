import { Injectable } from '@nestjs/common';
import { admin_role, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminRequestContext } from './admin-request-context';

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
}

