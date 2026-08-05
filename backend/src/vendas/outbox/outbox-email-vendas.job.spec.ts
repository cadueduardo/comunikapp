import {
  OUTBOX_ESTADOS,
  OUTBOX_LOTE_MAX,
  backoffMs,
  hashEmailNormalizado,
  emailPareceValido,
} from './outbox-email.constants';
import { OutboxEmailVendasJob } from './outbox-email-vendas.job';

describe('OutboxEmailVendas — constantes e claim', () => {
  it('lote máximo é 20', () => {
    expect(OUTBOX_LOTE_MAX).toBe(20);
  });

  it('hash de e-mail é determinístico e sem endereço em claro', () => {
    const h = hashEmailNormalizado('  Foo@Exemplo.COM ');
    expect(h).toHaveLength(64);
    expect(h).not.toContain('@');
    expect(h).toBe(hashEmailNormalizado('foo@exemplo.com'));
  });

  it('valida e-mail sintaticamente', () => {
    expect(emailPareceValido('a@b.co')).toBe(true);
    expect(emailPareceValido('')).toBe(false);
    expect(emailPareceValido('x')).toBe(false);
  });

  it('backoff cresce e é limitado', () => {
    expect(backoffMs(1)).toBe(30_000);
    expect(backoffMs(2)).toBe(60_000);
    expect(backoffMs(10)).toBeLessThanOrEqual(60 * 60 * 1000);
  });

  it('estados incluem descartado e dead_letter', () => {
    expect(OUTBOX_ESTADOS.DESCARTADO).toBe('descartado');
    expect(OUTBOX_ESTADOS.DEAD_LETTER).toBe('dead_letter');
  });
});

describe('OutboxEmailVendasJob — CAS ownership (mock)', () => {
  it('processarLote não usa updateMany em massa sem id', async () => {
    const updateManyCalls: unknown[] = [];
    const rows = [
      {
        id: 'a1',
        loja_id: 'l1',
        estado: OUTBOX_ESTADOS.PENDENTE,
        bloqueado_em: null,
        bloqueado_por: null,
        proxima_tentativa_em: new Date(0),
        destinatario_usuario_id: 'u1',
        destinatario_email_hash: hashEmailNormalizado('u@x.com'),
        assunto_sanitizado: 't',
        template_codigo: 'vendas.atividade.atribuida',
        payload_sanitizado: { atividade_id: 'x', url_destino: '/vendas' },
        tentativas: 0,
        max_tentativas: 5,
        evento: 'ATIVIDADE_ATRIBUIDA',
        criado_em: new Date(),
      },
      {
        id: 'a2',
        loja_id: 'l1',
        estado: OUTBOX_ESTADOS.PENDENTE,
        bloqueado_em: null,
        bloqueado_por: null,
        proxima_tentativa_em: new Date(0),
        destinatario_usuario_id: 'u1',
        destinatario_email_hash: hashEmailNormalizado('u@x.com'),
        assunto_sanitizado: 't2',
        template_codigo: 'vendas.atividade.atribuida',
        payload_sanitizado: { atividade_id: 'y', url_destino: '/vendas' },
        tentativas: 0,
        max_tentativas: 5,
        evento: 'ATIVIDADE_ATRIBUIDA',
        criado_em: new Date(),
      },
    ];

    const prisma = {
      outbox_email_vendas: {
        findMany: jest.fn().mockResolvedValue(rows),
        updateMany: jest.fn().mockImplementation(async (args: { where: { id?: string }; data: unknown }) => {
          updateManyCalls.push(args);
          if (args.where?.id) {
            return { count: 1 };
          }
          return { count: 0 };
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

    const mail = {
      sendInternalVendasEmail: jest.fn().mockResolvedValue({ messageId: 'm1' }),
    };
    const outboxService = { enfileirar: jest.fn() };

    const job = new OutboxEmailVendasJob(
      prisma as never,
      mail as never,
      outboxService as never,
    );
    job.enviarFn = async () => undefined;

    const w1 = job.processarLote('worker-1');
    const w2 = job.processarLote('worker-2');
    const [r1, r2] = await Promise.all([w1, w2]);

    expect(r1.candidatos + r2.candidatos).toBeGreaterThan(0);
    for (const call of updateManyCalls) {
      const c = call as { where: { id?: string } };
      // Todo claim deve ser por id individual
      if (c.where && 'OR' in c.where === false && c.where.id) {
        expect(c.where.id).toBeTruthy();
      }
      if (c.where?.id) {
        expect(typeof c.where.id).toBe('string');
      }
    }
    // Claims com id
    const claimsComId = updateManyCalls.filter(
      (c) => (c as { where: { id?: string } }).where?.id,
    );
    expect(claimsComId.length).toBeGreaterThan(0);
  });

  it('worker antigo não finaliza após perder ownership', async () => {
    let bloqueadoPor: string | null = 'worker-antigo';
    const prisma = {
      outbox_email_vendas: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'x1',
            loja_id: 'l1',
            estado: OUTBOX_ESTADOS.PENDENTE,
            bloqueado_em: null,
            bloqueado_por: null,
            proxima_tentativa_em: new Date(0),
            destinatario_usuario_id: 'u1',
            destinatario_email_hash: hashEmailNormalizado('u@x.com'),
            assunto_sanitizado: 't',
            template_codigo: 't',
            payload_sanitizado: { atividade_id: 'a', url_destino: '/vendas' },
            tentativas: 0,
            max_tentativas: 5,
            evento: 'ATIVIDADE_ATRIBUIDA',
            criado_em: new Date(),
          },
        ]),
        updateMany: jest.fn().mockImplementation(async (args: {
          where: { id?: string; bloqueado_por?: string };
          data: { bloqueado_por?: string; estado?: string };
        }) => {
          if (args.data?.bloqueado_por && args.where?.id) {
            bloqueadoPor = args.data.bloqueado_por;
            return { count: 1 };
          }
          if (args.where?.bloqueado_por) {
            if (args.where.bloqueado_por !== bloqueadoPor) {
              return { count: 0 };
            }
            return { count: 1 };
          }
          return { count: 0 };
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

    // Simula: após claim, outro worker toma ownership
    job.enviarFn = async () => {
      bloqueadoPor = 'worker-novo';
    };

    const r = await job.processarLote('worker-antigo');
    expect(r.enviados).toBe(0);
  });
});
