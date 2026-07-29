import { Request } from 'express';

export interface AdminRequestContext {
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

function safeHeader(value: string | string[] | undefined, max: number) {
  const normalized = Array.isArray(value) ? value[0] : value;
  return normalized?.trim().slice(0, max) || undefined;
}

export function getAdminRequestContext(
  request: Request,
): AdminRequestContext {
  const forwarded = safeHeader(request.headers['x-forwarded-for'], 256)
    ?.split(',')[0]
    ?.trim();
  const correlationId = safeHeader(
    request.headers['x-correlation-id'],
    128,
  );

  return {
    ipAddress: (forwarded || request.ip || '').slice(0, 45) || undefined,
    userAgent: safeHeader(request.headers['user-agent'], 512),
    correlationId:
      correlationId && /^[a-zA-Z0-9._:-]+$/.test(correlationId)
        ? correlationId
        : undefined,
  };
}

