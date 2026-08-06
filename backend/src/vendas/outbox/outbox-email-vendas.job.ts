import { Injectable, Logger } from '@nestjs/common';
import { Cron, Interval } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import {
  OUTBOX_CONCURRENCY,
  OUTBOX_ESTADOS,
  OUTBOX_LOCK_TTL_MS,
  OUTBOX_LOTE_MAX,
  OUTBOX_RETENCAO_DIAS,
  backoffMs,
  emailPareceValido,
  hashEmailNormalizado,
} from './outbox-email.constants';
import {
  dataOperacionalMaisDias,
  limitesDiaOperacional,
} from '../timezone/vendas-timezone';
import { OutboxEmailVendasService } from './outbox-email-vendas.service';
import { OUTBOX_EVENTOS } from './outbox-email.constants';

type Candidato = {
  id: string;
  loja_id: string;
  estado: string;
  bloqueado_em: Date | null;
  bloqueado_por: string | null;
  proxima_tentativa_em: Date;
  destinatario_usuario_id: string | null;
  destinatario_email_hash: string;
  assunto_sanitizado: string;
  template_codigo: string;
  payload_sanitizado: Prisma.JsonValue;
  tentativas: number;
  max_tentativas: number;
  evento: string;
};

/**
 * Worker DV-08: select limitado + CAS por id + ownership em finalização.
 */
@Injectable()
export class OutboxEmailVendasJob {
  private readonly logger = new Logger(OutboxEmailVendasJob.name);
  private readonly workerId = `outbox-${process.pid}-${randomUUID().slice(0, 8)}`;
  private rodando = false;

  /** Injetável em testes para simular falha SMTP. */
  enviarFn: (
    para: string,
    assunto: string,
    html: string,
  ) => Promise<void>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly outboxService: OutboxEmailVendasService,
  ) {
    this.enviarFn = async (para, assunto, html) => {
      await this.mail.sendInternalVendasEmail({
        to: para,
        subject: assunto,
        html,
      });
    };
  }

  @Interval(20_000)
  async tick(): Promise<void> {
    if (this.rodando) return;
    this.rodando = true;
    try {
      await this.processarLote(this.workerId);
    } catch {
      // Ignora silenciosamente em dev se a tabela de outbox ainda não existir
    } finally {
      this.rodando = false;
    }
  }

  /** Job diário: lembretes ATIVIDADE_VENCENDO (D e D+1). */
  @Cron('0 30 8 * * *', { name: 'vendas.outbox.atividade_vencendo' })
  async enfileirarVencendo(): Promise<void> {
    const { inicioUtc, fimUtc, dataOperacional } = limitesDiaOperacional();
    const amanha = dataOperacionalMaisDias(dataOperacional, 1);
    const { inicioUtc: iniAmanha, fimUtc: fimAmanha } = (() => {
      const i = new Date(`${amanha}T00:00:00.000-03:00`);
      const f = new Date(`${amanha}T23:59:59.999-03:00`);
      return { inicioUtc: i, fimUtc: f };
    })();

    const abertas = await this.prisma.atividade_comercial.findMany({
      where: {
        concluida_em: null,
        OR: [
          { prazo: { gte: inicioUtc, lte: fimUtc } },
          { prazo: { gte: iniAmanha, lte: fimAmanha } },
        ],
      },
      select: {
        id: true,
        loja_id: true,
        responsavel_id: true,
        prazo: true,
      },
      take: 500,
    });

    for (const a of abertas) {
      const dia =
        a.prazo >= inicioUtc && a.prazo <= fimUtc
          ? dataOperacional
          : amanha;
      await this.outboxService.enfileirar({
        lojaId: a.loja_id,
        evento: OUTBOX_EVENTOS.ATIVIDADE_VENCENDO,
        destinatarioUsuarioId: a.responsavel_id,
        chaveDedup: `email:ATIVIDADE_VENCENDO:${a.id}:${dia}`,
        assuntoSanitizado: 'Atividade vencendo',
        permitirMesmoAtor: true,
        payload: {
          atividade_id: a.id,
          data_operacional: dia,
          url_destino: `/vendas/atividades?id=${a.id}`,
        },
      });
    }
  }

  @Cron('0 40 3 * * *', { name: 'vendas.outbox.retencao' })
  async limparRetencao(): Promise<void> {
    await this.purgarEstado(OUTBOX_ESTADOS.ENVIADO, OUTBOX_RETENCAO_DIAS.enviado);
    await this.purgarEstado(
      OUTBOX_ESTADOS.DESCARTADO,
      OUTBOX_RETENCAO_DIAS.descartado,
    );
    await this.purgarEstado(
      OUTBOX_ESTADOS.DEAD_LETTER,
      OUTBOX_RETENCAO_DIAS.dead_letter,
    );
  }

  @Cron('0 45 3 * * *', { name: 'vendas.atendimento.retencao_idempotencia' })
  async limparIdempotencia(): Promise<void> {
    const corte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let total = 0;
    for (;;) {
      const lote = await this.prisma.atendimento_idempotencia.findMany({
        where: { criado_em: { lt: corte } },
        select: { id: true },
        take: 200,
      });
      if (lote.length === 0) break;
      await this.prisma.atendimento_idempotencia.deleteMany({
        where: { id: { in: lote.map((r) => r.id) } },
      });
      total += lote.length;
      if (lote.length < 200) break;
    }
    if (total > 0) {
      this.logger.log(`Retenção atendimento_idempotencia: ${total} removidos`);
    }
  }

  private async purgarEstado(estado: string, dias: number): Promise<void> {
    const corte = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
    for (;;) {
      const lote = await this.prisma.outbox_email_vendas.findMany({
        where: {
          estado,
          processado_em: { lt: corte },
        },
        select: { id: true },
        take: 200,
      });
      if (lote.length === 0) break;
      await this.prisma.outbox_email_vendas.deleteMany({
        where: { id: { in: lote.map((r) => r.id) } },
      });
      if (lote.length < 200) break;
    }
  }

  /** API pública para testes / execução manual. */
  async processarLote(workerId: string = this.workerId): Promise<{
    candidatos: number;
    adquiridos: number;
    enviados: number;
    descartados: number;
    falhas: number;
  }> {
    const agora = new Date();
    const lockExpiradoAntes = new Date(agora.getTime() - OUTBOX_LOCK_TTL_MS);

    const candidatos = (await this.prisma.outbox_email_vendas.findMany({
      where: {
        OR: [
          {
            estado: OUTBOX_ESTADOS.PENDENTE,
            proxima_tentativa_em: { lte: agora },
          },
          {
            estado: OUTBOX_ESTADOS.PROCESSANDO,
            bloqueado_em: { lt: lockExpiradoAntes },
          },
        ],
      },
      orderBy: [
        { proxima_tentativa_em: 'asc' },
        { criado_em: 'asc' },
        { id: 'asc' },
      ],
      take: OUTBOX_LOTE_MAX,
    })) as Candidato[];

    let adquiridos = 0;
    let enviados = 0;
    let descartados = 0;
    let falhas = 0;

    const fila = [...candidatos];
    const workers: Promise<void>[] = [];

    const processarUm = async (c: Candidato) => {
      const claimWhere: Prisma.outbox_email_vendasWhereInput = {
        id: c.id,
        OR: [
          {
            estado: OUTBOX_ESTADOS.PENDENTE,
            proxima_tentativa_em: { lte: agora },
          },
          {
            estado: OUTBOX_ESTADOS.PROCESSANDO,
            bloqueado_em: { lt: lockExpiradoAntes },
          },
        ],
      };

      const claim = await this.prisma.outbox_email_vendas.updateMany({
        where: claimWhere,
        data: {
          estado: OUTBOX_ESTADOS.PROCESSANDO,
          bloqueado_em: new Date(),
          bloqueado_por: workerId,
        },
      });

      if (claim.count !== 1) return;
      adquiridos += 1;

      try {
        const resultado = await this.enviarComOwnership(c, workerId);
        if (resultado === 'enviado') enviados += 1;
        else if (resultado === 'descartado') descartados += 1;
        else falhas += 1;
      } catch {
        falhas += 1;
      }
    };

    while (fila.length > 0 || workers.length > 0) {
      while (fila.length > 0 && workers.length < OUTBOX_CONCURRENCY) {
        const c = fila.shift()!;
        const p = processarUm(c).finally(() => {
          const i = workers.indexOf(p);
          if (i >= 0) workers.splice(i, 1);
        });
        workers.push(p);
      }
      if (workers.length > 0) {
        await Promise.race(workers);
      }
    }

    return {
      candidatos: candidatos.length,
      adquiridos,
      enviados,
      descartados,
      falhas,
    };
  }

  private async enviarComOwnership(
    c: Candidato,
    workerId: string,
  ): Promise<'enviado' | 'descartado' | 'falha' | 'perdido'> {
    if (!c.destinatario_usuario_id) {
      await this.finalizarComo(
        c.id,
        workerId,
        OUTBOX_ESTADOS.DESCARTADO,
        'destinatario_ausente',
      );
      return 'descartado';
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: c.destinatario_usuario_id,
        loja_id: c.loja_id,
      },
      select: { id: true, email: true, ativo: true, status: true, loja_id: true },
    });

    if (
      !usuario ||
      !usuario.ativo ||
      usuario.status === 'INATIVO' ||
      usuario.loja_id !== c.loja_id
    ) {
      await this.finalizarComo(
        c.id,
        workerId,
        OUTBOX_ESTADOS.DESCARTADO,
        !usuario
          ? 'usuario_removido'
          : usuario.loja_id !== c.loja_id
            ? 'usuario_outra_loja'
            : 'usuario_inativo',
      );
      return 'descartado';
    }

    if (!emailPareceValido(usuario.email)) {
      await this.finalizarComo(
        c.id,
        workerId,
        OUTBOX_ESTADOS.DESCARTADO,
        'email_invalido',
      );
      return 'descartado';
    }

    const hashAtual = hashEmailNormalizado(usuario.email);
    if (hashAtual !== c.destinatario_email_hash) {
      // Usa endereço atual; atualiza evidência hash sob ownership.
      await this.prisma.outbox_email_vendas.updateMany({
        where: {
          id: c.id,
          bloqueado_por: workerId,
          estado: OUTBOX_ESTADOS.PROCESSANDO,
        },
        data: { destinatario_email_hash: hashAtual },
      });
    }

    const payload = c.payload_sanitizado as { url_destino?: string };
    const url = payload?.url_destino ?? '/vendas/atividades';
    const html = `<p>${c.assunto_sanitizado}</p><p><a href="${url}">Abrir no ComunikApp</a></p>`;

    try {
      await this.enviarFn(usuario.email, c.assunto_sanitizado, html);
      const ok = await this.prisma.outbox_email_vendas.updateMany({
        where: {
          id: c.id,
          bloqueado_por: workerId,
          estado: OUTBOX_ESTADOS.PROCESSANDO,
        },
        data: {
          estado: OUTBOX_ESTADOS.ENVIADO,
          processado_em: new Date(),
          bloqueado_em: null,
          bloqueado_por: null,
          ultimo_erro_sanitizado: null,
        },
      });
      return ok.count === 1 ? 'enviado' : 'perdido';
    } catch {
      const tentativas = c.tentativas + 1;
      const terminal = tentativas >= c.max_tentativas;
      const estado = terminal
        ? OUTBOX_ESTADOS.DEAD_LETTER
        : OUTBOX_ESTADOS.PENDENTE;
      const proxima = terminal
        ? new Date()
        : new Date(Date.now() + backoffMs(tentativas));

      const upd = await this.prisma.outbox_email_vendas.updateMany({
        where: {
          id: c.id,
          bloqueado_por: workerId,
          estado: OUTBOX_ESTADOS.PROCESSANDO,
        },
        data: {
          estado,
          tentativas,
          proxima_tentativa_em: proxima,
          processado_em: terminal ? new Date() : null,
          bloqueado_em: null,
          bloqueado_por: null,
          ultimo_erro_sanitizado: 'falha_entrega_smtp',
        },
      });
      return upd.count === 1 ? 'falha' : 'perdido';
    }
  }

  private async finalizarComo(
    id: string,
    workerId: string,
    estado: string,
    motivo: string,
  ): Promise<void> {
    await this.prisma.outbox_email_vendas.updateMany({
      where: {
        id,
        bloqueado_por: workerId,
        estado: OUTBOX_ESTADOS.PROCESSANDO,
      },
      data: {
        estado,
        processado_em: new Date(),
        bloqueado_em: null,
        bloqueado_por: null,
        ultimo_erro_sanitizado: motivo.slice(0, 500),
      },
    });
  }
}
