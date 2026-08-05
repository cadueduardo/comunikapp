import { ConflictException } from '@nestjs/common';
import { AtendimentoService } from './atendimento.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';

describe('AtendimentoService — idempotência e deep-link (37)', () => {
  const identidade = { usuarioId: 'u1', lojaId: 'l1' };

  function dto(overrides: Record<string, unknown> = {}) {
    return {
      chave_operacao: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      necessidade: 'Banner loja',
      origem: 'telefone',
      prazo: new Date('2026-08-10T15:00:00.000Z').toISOString(),
      criar_orcamento: true,
      prospect: { nome: 'Cliente Prospect', telefone: '11999999999' },
      ...overrides,
    };
  }

  it('retry mesma chave+hash devolve resultado sem recriar', async () => {
    let stored: {
      payload_hash: string;
      resultado: {
        cliente_id: string;
        atividade_id: string;
        deep_link: string | null;
      };
    } | null = null;

    const prisma: Record<string, unknown> = {};
    Object.assign(prisma, {
      atendimento_idempotencia: {
        findUnique: jest.fn().mockImplementation(async () => stored),
        create: jest.fn().mockImplementation(
          async ({
            data,
          }: {
            data: {
              payload_hash: string;
              resultado: {
                cliente_id: string;
                atividade_id: string;
                deep_link: string | null;
              };
            };
          }) => {
            stored = {
              payload_hash: data.payload_hash,
              resultado: data.resultado,
            };
            return data;
          },
        ),
      },
      cliente: {
        create: jest.fn().mockResolvedValue({ id: 'c1' }),
        findFirst: jest.fn(),
      },
      cliente_contato: { findFirst: jest.fn() },
      atividade_comercial: {
        create: jest.fn().mockResolvedValue({
          id: 'a1',
          loja_id: 'l1',
          responsavel_id: 'u1',
        }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    });

    const perms = {
      assertPode: jest.fn().mockResolvedValue(undefined),
    };
    const outbox = { enfileirarAtribuida: jest.fn().mockResolvedValue(null) };
    const carteiraEscopo = {
      assertClienteAcessivel: jest.fn().mockResolvedValue(undefined),
    };
    const svc = new AtendimentoService(
      prisma as never,
      perms as never,
      outbox as never,
      carteiraEscopo as never,
    );

    const r1 = await svc.criar(identidade as never, dto() as never);
    expect(r1.deep_link).toContain('clienteId=c1');
    expect(r1.deep_link).toContain('/orcamentos-v2/novo');
    expect(perms.assertPode).toHaveBeenCalledWith(
      'u1',
      'l1',
      VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
    );

    const r2 = await svc.criar(identidade as never, dto() as never);
    expect(r2).toEqual(r1);
    expect(
      (prisma.cliente as { create: jest.Mock }).create,
    ).toHaveBeenCalledTimes(1);
  });

  it('mesma chave com payload diferente → 409', async () => {
    const prisma = {
      atendimento_idempotencia: {
        findUnique: jest.fn().mockResolvedValue({
          payload_hash: 'hash-diferente',
          resultado: {},
        }),
      },
    };
    const svc = new AtendimentoService(
      prisma as never,
      { assertPode: jest.fn().mockResolvedValue(undefined) } as never,
      { enfileirarAtribuida: jest.fn() } as never,
      { assertClienteAcessivel: jest.fn() } as never,
    );
    await expect(
      svc.criar(identidade as never, dto() as never),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deep-link inclui contatoId quando informado (critério 37)', async () => {
    const prisma: Record<string, unknown> = {};
    Object.assign(prisma, {
      atendimento_idempotencia: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      cliente: {
        findFirst: jest.fn().mockResolvedValue({ id: 'c1' }),
      },
      cliente_contato: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ct1' }),
      },
      atividade_comercial: {
        create: jest.fn().mockResolvedValue({ id: 'a1' }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    });
    const svc = new AtendimentoService(
      prisma as never,
      { assertPode: jest.fn().mockResolvedValue(undefined) } as never,
      { enfileirarAtribuida: jest.fn().mockResolvedValue(null) } as never,
      { assertClienteAcessivel: jest.fn().mockResolvedValue(undefined) } as never,
    );
    const r = await svc.criar(
      identidade as never,
      dto({
        prospect: undefined,
        cliente_id: 'c1',
        contato_id: 'ct1',
      }) as never,
    );
    expect(r.deep_link).toBe(
      '/orcamentos-v2/novo?clienteId=c1&contatoId=ct1',
    );
  });
});
