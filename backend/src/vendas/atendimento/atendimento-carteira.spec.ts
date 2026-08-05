import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AtendimentoService } from './atendimento.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';

describe('AtendimentoService — cliente existente, RBAC e carteira', () => {
  const identidade = { usuarioId: 'u1', lojaId: 'l1' };

  function dto(overrides: Record<string, unknown> = {}) {
    return {
      chave_operacao: 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
      necessidade: 'Adesivo frota',
      origem: 'whatsapp_manual',
      prazo: new Date('2026-08-12T15:00:00.000Z').toISOString(),
      criar_orcamento: true,
      ...overrides,
    };
  }

  function prismaTxBase() {
    const prisma: Record<string, unknown> = {};
    Object.assign(prisma, {
      atendimento_idempotencia: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      cliente: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      cliente_contato: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ct1' }),
      },
      atividade_comercial: {
        create: jest.fn().mockResolvedValue({
          id: 'a1',
          loja_id: 'l1',
          responsavel_id: 'u1',
        }),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(prisma)),
    });
    return prisma;
  }

  it('cliente existente da carteira: exige ATIVIDADE_GERENCIAR e NÃO CLIENTE_CRIAR', async () => {
    const prisma = prismaTxBase();
    const perms = {
      assertPode: jest.fn().mockResolvedValue(undefined),
    };
    const carteiraEscopo = {
      assertClienteAcessivel: jest.fn().mockResolvedValue(undefined),
    };
    const svc = new AtendimentoService(
      prisma as never,
      perms as never,
      { enfileirarAtribuida: jest.fn().mockResolvedValue(null) } as never,
      carteiraEscopo as never,
    );

    const r = await svc.criar(
      identidade as never,
      dto({ cliente_id: 'c1', contato_id: 'ct1', prospect: undefined }) as never,
    );

    expect(carteiraEscopo.assertClienteAcessivel).toHaveBeenCalledWith(
      identidade,
      'c1',
    );
    expect(perms.assertPode).toHaveBeenCalledWith(
      'u1',
      'l1',
      VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
    );
    expect(perms.assertPode).not.toHaveBeenCalledWith(
      'u1',
      'l1',
      VENDAS_PERMISSOES.CLIENTE_CRIAR,
    );
    expect(r.deep_link).toBe(
      '/orcamentos-v2/novo?clienteId=c1&contatoId=ct1',
    );
    expect(
      (prisma.cliente as { create: jest.Mock }).create,
    ).not.toHaveBeenCalled();
  });

  it('prospect exige CLIENTE_CRIAR além de ATIVIDADE_GERENCIAR', async () => {
    const prisma = prismaTxBase();
    (prisma.cliente as { create: jest.Mock }).create.mockResolvedValue({
      id: 'c-novo',
    });
    const perms = {
      assertPode: jest.fn().mockResolvedValue(undefined),
    };
    const svc = new AtendimentoService(
      prisma as never,
      perms as never,
      { enfileirarAtribuida: jest.fn().mockResolvedValue(null) } as never,
      { assertClienteAcessivel: jest.fn() } as never,
    );

    await svc.criar(
      identidade as never,
      dto({ prospect: { nome: 'Prospect X' } }) as never,
    );

    expect(perms.assertPode).toHaveBeenCalledWith(
      'u1',
      'l1',
      VENDAS_PERMISSOES.ATIVIDADE_GERENCIAR,
    );
    expect(perms.assertPode).toHaveBeenCalledWith(
      'u1',
      'l1',
      VENDAS_PERMISSOES.CLIENTE_CRIAR,
    );
  });

  it('usuário sem ATIVIDADE_GERENCIAR é negado', async () => {
    const perms = {
      assertPode: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('Sem permissão.')),
    };
    const svc = new AtendimentoService(
      { atendimento_idempotencia: { findUnique: jest.fn() } } as never,
      perms as never,
      { enfileirarAtribuida: jest.fn() } as never,
      { assertClienteAcessivel: jest.fn() } as never,
    );

    await expect(
      svc.criar(
        identidade as never,
        dto({ cliente_id: 'c1', prospect: undefined }) as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('cliente fora da carteira/loja é negado pelo escopo', async () => {
    const prisma = prismaTxBase();
    const carteiraEscopo = {
      assertClienteAcessivel: jest
        .fn()
        .mockRejectedValue(new NotFoundException('Cliente não encontrado.')),
    };
    const svc = new AtendimentoService(
      prisma as never,
      { assertPode: jest.fn().mockResolvedValue(undefined) } as never,
      { enfileirarAtribuida: jest.fn() } as never,
      carteiraEscopo as never,
    );

    await expect(
      svc.criar(
        identidade as never,
        dto({ cliente_id: 'c-outra-loja', prospect: undefined }) as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('contato que não pertence ao cliente é negado', async () => {
    const prisma = prismaTxBase();
    (prisma.cliente_contato as { findFirst: jest.Mock }).findFirst.mockResolvedValue(
      null,
    );
    const svc = new AtendimentoService(
      prisma as never,
      { assertPode: jest.fn().mockResolvedValue(undefined) } as never,
      { enfileirarAtribuida: jest.fn().mockResolvedValue(null) } as never,
      { assertClienteAcessivel: jest.fn().mockResolvedValue(undefined) } as never,
    );

    await expect(
      svc.criar(
        identidade as never,
        dto({
          cliente_id: 'c1',
          contato_id: 'ct-alheio',
          prospect: undefined,
        }) as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
