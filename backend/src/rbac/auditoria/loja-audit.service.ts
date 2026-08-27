import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const CAMPOS_PROIBIDOS = [
  'senha',
  'password',
  'token',
  'secret',
  'codigo',
  'two_factor_secret',
  'codigo_verificacao_email',
];

function sanitizar(valor: unknown): Prisma.InputJsonValue | undefined {
  if (valor === undefined) {
    return undefined;
  }
  return JSON.parse(
    JSON.stringify(valor, (chave, atual) => {
      const nome = chave.toLowerCase();
      if (CAMPOS_PROIBIDOS.some((proibido) => nome.includes(proibido))) {
        return '[redacted]';
      }
      return atual;
    }),
  ) as Prisma.InputJsonValue;
}

@Injectable()
export class LojaAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(params: {
    lojaId: string;
    atorId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    previousState?: unknown;
    newState?: unknown;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    const db = (params.tx ?? this.prisma) as PrismaService & {
      loja_audit_log: {
        create: (args: { data: Record<string, unknown> }) => Promise<unknown>;
      };
    };
    await db.loja_audit_log.create({
      data: {
        loja_id: params.lojaId,
        ator_id: params.atorId,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        previous_state: sanitizar(params.previousState),
        new_state: sanitizar(params.newState),
      },
    });
  }
}
