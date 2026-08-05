import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';

describe('AtividadesService — conclusão idempotente', () => {
  const identidade = { usuarioId: 'u1', lojaId: 'l1' };

  function build(partial: {
    updateManyCount: number;
    findFirst?: unknown;
    pode?: (p: string) => boolean;
  }) {
    const prisma = {
      atividade_comercial: {
        updateMany: jest.fn().mockResolvedValue({ count: partial.updateManyCount }),
        findFirst: jest.fn().mockResolvedValue(partial.findFirst ?? null),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) =>
        typeof fn === 'function' ? fn(prisma) : Promise.all(fn as never),
      ),
      usuario: { findFirst: jest.fn() },
      cliente: { findFirst: jest.fn() },
      cliente_contato: { findFirst: jest.fn() },
      orcamento: { findFirst: jest.fn() },
    };
    const vendasPermissions = {
      assertPode: jest.fn().mockResolvedValue(undefined),
      pode: jest.fn().mockImplementation(async (_u: string, _l: string, p: string) =>
        partial.pode ? partial.pode(p) : p === VENDAS_PERMISSOES.ATIVIDADE_VER_PROPRIA,
      ),
    };
    const notificacoes = {
      criarNotificacaoEndereçada: jest.fn().mockResolvedValue({}),
    };
    const outbox = {
      enfileirarAtribuida: jest.fn(),
      enfileirarReprogramada: jest.fn(),
    };
    const carteiraEscopo = {
      assertClienteAcessivel: jest.fn().mockResolvedValue(undefined),
    };
    return {
      service: new AtividadesService(
        prisma as never,
        vendasPermissions as never,
        notificacoes as never,
        outbox as never,
        carteiraEscopo as never,
      ),
      prisma,
      notificacoes,
      outbox,
    };
  }

  it('count=1 conclui e notifica criador diferente sem outbox', async () => {
    const row = {
      id: 'a1',
      loja_id: 'l1',
      cliente_id: null,
      orcamento_id: null,
      contato_id: null,
      responsavel_id: 'u1',
      criado_por: 'u2',
      concluida_por: 'u1',
      tipo: 'retorno',
      titulo: 't',
      descricao: null,
      origem: null,
      prazo: new Date(),
      prazo_desejado: null,
      concluida_em: new Date(),
      criado_em: new Date(),
      atualizado_em: new Date(),
    };
    const { service, notificacoes, outbox, prisma } = build({
      updateManyCount: 1,
      findFirst: row,
    });
    const r = await service.concluir(identidade as never, 'a1');
    expect(r.id).toBe('a1');
    expect(notificacoes.criarNotificacaoEndereçada).toHaveBeenCalledTimes(1);
    expect(outbox.enfileirarAtribuida).not.toHaveBeenCalled();
    expect(prisma.atividade_comercial.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ concluida_em: null }),
      }),
    );
  });

  it('retry quando já concluída devolve estado sem nova notificação', async () => {
    const row = {
      id: 'a1',
      loja_id: 'l1',
      cliente_id: null,
      orcamento_id: null,
      contato_id: null,
      responsavel_id: 'u1',
      criado_por: 'u1',
      concluida_por: 'u1',
      tipo: 'retorno',
      titulo: 't',
      descricao: null,
      origem: null,
      prazo: new Date(),
      prazo_desejado: null,
      concluida_em: new Date('2026-01-01'),
      criado_em: new Date(),
      atualizado_em: new Date(),
    };
    const { service, notificacoes } = build({
      updateManyCount: 0,
      findFirst: row,
    });
    const r = await service.concluir(identidade as never, 'a1');
    expect(r.concluida_em).toBeTruthy();
    expect(notificacoes.criarNotificacaoEndereçada).not.toHaveBeenCalled();
  });

  it('404 se não existir no tenant', async () => {
    const { service } = build({ updateManyCount: 0, findFirst: null });
    await expect(service.concluir(identidade as never, 'x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('AtividadesService — escopo equipe', () => {
  it('vendedor sem VER_EQUIPE não lista de outro responsável', async () => {
    const prisma = {
      atividade_comercial: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const vendasPermissions = {
      assertPode: jest.fn().mockResolvedValue(undefined),
      pode: jest.fn().mockResolvedValue(false),
    };
    const service = new AtividadesService(
      prisma as never,
      vendasPermissions as never,
      { criarNotificacaoEndereçada: jest.fn() } as never,
      { enfileirarAtribuida: jest.fn() } as never,
      { assertClienteAcessivel: jest.fn() } as never,
    );
    await expect(
      service.listar(
        { usuarioId: 'u1', lojaId: 'l1' } as never,
        { responsavel_id: 'u2' },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// silencia imports não usados em lint de teste
void BadRequestException;
void ConflictException;
