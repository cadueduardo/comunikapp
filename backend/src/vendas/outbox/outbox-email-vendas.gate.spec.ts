import {
  OUTBOX_ESTADOS,
  OUTBOX_EVENTOS,
  OUTBOX_TEMPLATES,
  chaveDedupVencendo,
  hashEmailNormalizado,
} from './outbox-email.constants';
import { OutboxEmailVendasJob } from './outbox-email-vendas.job';
import { OutboxEmailVendasService } from './outbox-email-vendas.service';

function rowBase(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    loja_id: 'l1',
    estado: OUTBOX_ESTADOS.PENDENTE,
    bloqueado_em: null,
    bloqueado_por: null,
    proxima_tentativa_em: new Date(0),
    destinatario_usuario_id: 'u1',
    destinatario_email_hash: hashEmailNormalizado('u@x.com'),
    assunto_sanitizado: 't',
    template_codigo: OUTBOX_TEMPLATES.ATIVIDADE_ATRIBUIDA,
    payload_sanitizado: { atividade_id: 'a', url_destino: '/vendas/atividades' },
    tentativas: 0,
    max_tentativas: 5,
    evento: OUTBOX_EVENTOS.ATIVIDADE_ATRIBUIDA,
    criado_em: new Date(),
    ...overrides,
  };
}

describe('Outbox gate DV-08 — cenários adicionais', () => {
  it('lista canônica de eventos e templates', () => {
    expect(Object.keys(OUTBOX_EVENTOS).sort()).toEqual([
      'ATIVIDADE_ATRIBUIDA',
      'ATIVIDADE_REPROGRAMADA',
      'ATIVIDADE_VENCENDO',
    ]);
    expect(OUTBOX_TEMPLATES.ATIVIDADE_VENCENDO).toBe('vendas.atividade.vencendo');
    expect(chaveDedupVencendo('a1', '20260805')).toBe(
      'email:ATIVIDADE_VENCENDO:a1:20260805',
    );
  });

  it('usuário inativo → descartado sem retry SMTP', async () => {
    const finais: Array<{ estado?: string }> = [];
    const prisma = {
      outbox_email_vendas: {
        findMany: jest.fn().mockResolvedValue([rowBase()]),
        updateMany: jest.fn().mockImplementation(async (args: {
          where: { id?: string; bloqueado_por?: string };
          data: { estado?: string; bloqueado_por?: string };
        }) => {
          if (args.data?.bloqueado_por) return { count: 1 };
          finais.push(args.data);
          return { count: 1 };
        }),
      },
      usuario: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@x.com',
          ativo: false,
          status: 'INATIVO',
          loja_id: 'l1',
        }),
      },
      atividade_comercial: { findMany: jest.fn() },
      atendimento_idempotencia: { findMany: jest.fn(), deleteMany: jest.fn() },
    };
    const enviar = jest.fn();
    const job = new OutboxEmailVendasJob(
      prisma as never,
      { sendInternalVendasEmail: jest.fn() } as never,
      { enfileirar: jest.fn() } as never,
    );
    job.enviarFn = enviar;
    const r = await job.processarLote('w1');
    expect(r.descartados).toBe(1);
    expect(enviar).not.toHaveBeenCalled();
    expect(finais.some((f) => f.estado === OUTBOX_ESTADOS.DESCARTADO)).toBe(true);
  });

  it('usuário outra loja → descartado', async () => {
    const prisma = {
      outbox_email_vendas: {
        findMany: jest.fn().mockResolvedValue([rowBase()]),
        updateMany: jest.fn().mockImplementation(async (args: {
          data: { bloqueado_por?: string; estado?: string };
        }) => {
          if (args.data?.bloqueado_por) return { count: 1 };
          return { count: 1 };
        }),
      },
      usuario: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
      atividade_comercial: { findMany: jest.fn() },
      atendimento_idempotencia: { findMany: jest.fn(), deleteMany: jest.fn() },
    };
    const job = new OutboxEmailVendasJob(
      prisma as never,
      { sendInternalVendasEmail: jest.fn() } as never,
      { enfileirar: jest.fn() } as never,
    );
    job.enviarFn = jest.fn();
    const r = await job.processarLote('w1');
    expect(r.descartados).toBe(1);
  });

  it('e-mail alterado atualiza hash e envia para o atual sem logar endereço', async () => {
    const updateData: unknown[] = [];
    const prisma = {
      outbox_email_vendas: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            rowBase({
              destinatario_email_hash: hashEmailNormalizado('old@x.com'),
            }),
          ]),
        updateMany: jest.fn().mockImplementation(async (args: {
          where: { id?: string; bloqueado_por?: string };
          data: Record<string, unknown>;
        }) => {
          updateData.push(args.data);
          if (args.data.bloqueado_por) return { count: 1 };
          return { count: 1 };
        }),
      },
      usuario: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'new@x.com',
          ativo: true,
          status: 'ATIVO',
          loja_id: 'l1',
        }),
      },
      atividade_comercial: { findMany: jest.fn() },
      atendimento_idempotencia: { findMany: jest.fn(), deleteMany: jest.fn() },
    };
    const job = new OutboxEmailVendasJob(
      prisma as never,
      { sendInternalVendasEmail: jest.fn() } as never,
      { enfileirar: jest.fn() } as never,
    );
    const enviadoPara: string[] = [];
    job.enviarFn = async (para) => {
      enviadoPara.push(para);
    };
    const r = await job.processarLote('w1');
    expect(r.enviados).toBe(1);
    expect(enviadoPara).toEqual(['new@x.com']);
    expect(
      updateData.some(
        (d) =>
          (d as { destinatario_email_hash?: string }).destinatario_email_hash ===
          hashEmailNormalizado('new@x.com'),
      ),
    ).toBe(true);
    expect(JSON.stringify(updateData)).not.toMatch(/new@x\.com|old@x\.com/);
  });

  it('falha SMTP esgota tentativas → dead_letter', async () => {
    const estados: string[] = [];
    const prisma = {
      outbox_email_vendas: {
        findMany: jest.fn().mockResolvedValue([
          rowBase({ tentativas: 4, max_tentativas: 5 }),
        ]),
        updateMany: jest.fn().mockImplementation(async (args: {
          data: { bloqueado_por?: string; estado?: string };
        }) => {
          if (args.data.bloqueado_por) return { count: 1 };
          if (args.data.estado) estados.push(args.data.estado);
          return { count: 1 };
        }),
      },
      usuario: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@x.com',
          ativo: true,
          status: 'ATIVO',
          loja_id: 'l1',
        }),
      },
      atividade_comercial: { findMany: jest.fn() },
      atendimento_idempotencia: { findMany: jest.fn(), deleteMany: jest.fn() },
    };
    const job = new OutboxEmailVendasJob(
      prisma as never,
      { sendInternalVendasEmail: jest.fn() } as never,
      { enfileirar: jest.fn() } as never,
    );
    job.enviarFn = async () => {
      throw new Error('smtp_down');
    };
    const r = await job.processarLote('w1');
    expect(r.falhas).toBe(1);
    expect(estados).toContain(OUTBOX_ESTADOS.DEAD_LETTER);
  });

  it('lock expirado entra como candidato processando', async () => {
    const prisma = {
      outbox_email_vendas: {
        findMany: jest.fn().mockResolvedValue([
          rowBase({
            estado: OUTBOX_ESTADOS.PROCESSANDO,
            bloqueado_em: new Date(Date.now() - 10 * 60 * 1000),
            bloqueado_por: 'worker-morto',
          }),
        ]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      usuario: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@x.com',
          ativo: true,
          status: 'ATIVO',
          loja_id: 'l1',
        }),
      },
      atividade_comercial: { findMany: jest.fn() },
      atendimento_idempotencia: { findMany: jest.fn(), deleteMany: jest.fn() },
    };
    const job = new OutboxEmailVendasJob(
      prisma as never,
      { sendInternalVendasEmail: jest.fn() } as never,
      { enfileirar: jest.fn() } as never,
    );
    job.enviarFn = async () => undefined;
    const r = await job.processarLote('w-novo');
    expect(r.candidatos).toBe(1);
    expect(r.adquiridos).toBe(1);
  });
});

describe('OutboxEmailVendasService — enqueue regras', () => {
  it('não enfileira quando ator === destinatário (exceto vencendo)', async () => {
    const create = jest.fn();
    const prisma = {
      usuario: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@x.com',
          status: 'ATIVO',
        }),
      },
      outbox_email_vendas: {
        create,
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const svc = new OutboxEmailVendasService(prisma as never);
    const r = await svc.enfileirarAtribuida({
      lojaId: 'l1',
      atividadeId: 'a1',
      responsavelId: 'u1',
      atorId: 'u1',
    });
    expect(r).toBeNull();
    expect(create).not.toHaveBeenCalled();
  });

  it('permite mesmo ator em ATIVIDADE_VENCENDO', async () => {
    const create = jest.fn().mockResolvedValue({ id: 'o1' });
    const prisma = {
      usuario: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'u@x.com',
          status: 'ATIVO',
        }),
      },
      outbox_email_vendas: {
        create,
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const svc = new OutboxEmailVendasService(prisma as never);
    const r = await svc.enfileirar({
      lojaId: 'l1',
      evento: OUTBOX_EVENTOS.ATIVIDADE_VENCENDO,
      destinatarioUsuarioId: 'u1',
      atorUsuarioId: 'u1',
      permitirMesmoAtor: true,
      chaveDedup: chaveDedupVencendo('a1', '20260805'),
      assuntoSanitizado: 'vencendo',
      payload: {
        atividade_id: 'a1',
        data_operacional: '20260805',
        url_destino: '/vendas/atividades?id=a1',
      },
    });
    expect(r).toEqual({ id: 'o1' });
    expect(create).toHaveBeenCalled();
  });
});
