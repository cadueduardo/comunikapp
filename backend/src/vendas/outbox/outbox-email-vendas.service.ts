import {
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OUTBOX_ESTADOS,
  OUTBOX_EVENTOS,
  OUTBOX_MAX_TENTATIVAS_DEFAULT,
  OUTBOX_MAX_TENTATIVAS_LIMITE,
  OUTBOX_TEMPLATES,
  OutboxEvento,
  OutboxPayloadSanitizado,
  emailPareceValido,
  hashEmailNormalizado,
} from './outbox-email.constants';

type Tx = Prisma.TransactionClient | PrismaClient;

export type EnqueueOutboxInput = {
  lojaId: string;
  evento: OutboxEvento;
  destinatarioUsuarioId: string;
  chaveDedup: string;
  assuntoSanitizado: string;
  payload: OutboxPayloadSanitizado;
  atorUsuarioId?: string;
  /** ATIVIDADE_VENCENDO ignora ator===destinatário */
  permitirMesmoAtor?: boolean;
};

@Injectable()
export class OutboxEmailVendasService {
  private readonly logger = new Logger(OutboxEmailVendasService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enfileira e-mail interno. Não envia SMTP.
   * Retorna null se regras de negócio impedirem o enqueue.
   */
  async enfileirar(
    input: EnqueueOutboxInput,
    tx?: Tx,
  ): Promise<{ id: string } | null> {
    const db = tx ?? this.prisma;

    if (
      !input.permitirMesmoAtor &&
      input.atorUsuarioId &&
      input.atorUsuarioId === input.destinatarioUsuarioId
    ) {
      return null;
    }

    const usuario = await db.usuario.findFirst({
      where: {
        id: input.destinatarioUsuarioId,
        loja_id: input.lojaId,
        ativo: true,
      },
      select: { id: true, email: true, status: true },
    });

    if (!usuario || usuario.status === 'INATIVO' || !emailPareceValido(usuario.email)) {
      this.logger.debug(
        `Outbox skip enqueue evento=${input.evento} motivo=destinatario_inelegivel`,
      );
      return null;
    }

    const maxTentativas = OUTBOX_MAX_TENTATIVAS_DEFAULT;
    if (maxTentativas < 1 || maxTentativas > OUTBOX_MAX_TENTATIVAS_LIMITE) {
      throw new Error('max_tentativas fora do limite de domínio');
    }

    const agora = new Date();
    const data = {
      loja_id: input.lojaId,
      chave_dedup: input.chaveDedup,
      evento: input.evento,
      canal: 'email',
      destinatario_usuario_id: usuario.id,
      destinatario_email_hash: hashEmailNormalizado(usuario.email),
      assunto_sanitizado: input.assuntoSanitizado.slice(0, 200),
      template_codigo: OUTBOX_TEMPLATES[input.evento],
      payload_sanitizado: input.payload as unknown as Prisma.InputJsonValue,
      estado: OUTBOX_ESTADOS.PENDENTE,
      tentativas: 0,
      max_tentativas: maxTentativas,
      proxima_tentativa_em: agora,
    };

    try {
      const row = await db.outbox_email_vendas.create({ data });
      return { id: row.id };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Dedup: já enfileirado — idempotente.
        return null;
      }
      throw err;
    }
  }

  async enfileirarAtribuida(params: {
    lojaId: string;
    atividadeId: string;
    responsavelId: string;
    atorId: string;
    tx?: Tx;
  }): Promise<{ id: string } | null> {
    return this.enfileirar(
      {
        lojaId: params.lojaId,
        evento: OUTBOX_EVENTOS.ATIVIDADE_ATRIBUIDA,
        destinatarioUsuarioId: params.responsavelId,
        atorUsuarioId: params.atorId,
        chaveDedup: `email:ATIVIDADE_ATRIBUIDA:${params.atividadeId}:${params.responsavelId}`,
        assuntoSanitizado: 'Nova atividade atribuída',
        payload: {
          atividade_id: params.atividadeId,
          url_destino: `/vendas/atividades?id=${params.atividadeId}`,
        },
      },
      params.tx,
    );
  }

  async enfileirarReprogramada(params: {
    lojaId: string;
    atividadeId: string;
    responsavelId: string;
    atorId: string;
    prazo: Date;
    tx?: Tx;
  }): Promise<{ id: string } | null> {
    const prazoIso = params.prazo.toISOString();
    return this.enfileirar(
      {
        lojaId: params.lojaId,
        evento: OUTBOX_EVENTOS.ATIVIDADE_REPROGRAMADA,
        destinatarioUsuarioId: params.responsavelId,
        atorUsuarioId: params.atorId,
        chaveDedup: `email:ATIVIDADE_REPROGRAMADA:${params.atividadeId}:${prazoIso}`,
        assuntoSanitizado: 'Atividade reprogramada',
        payload: {
          atividade_id: params.atividadeId,
          prazo_iso: prazoIso,
          url_destino: `/vendas/atividades?id=${params.atividadeId}`,
        },
      },
      params.tx,
    );
  }

  assertPayloadCompativel(
    existente: OutboxPayloadSanitizado,
    novo: OutboxPayloadSanitizado,
  ): void {
    if (JSON.stringify(existente) !== JSON.stringify(novo)) {
      throw new ConflictException(
        'Payload incompatível para a mesma chave de deduplicação do outbox.',
      );
    }
  }
}
