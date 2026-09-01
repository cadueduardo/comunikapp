import { NotFoundException } from '@nestjs/common';
import { VendasCarteiraEscopoService } from './vendas-carteira-escopo.service';
import { VENDAS_PERMISSOES } from '../permissions/vendas-permissoes';

describe('VendasCarteiraEscopoService — participante e gestor/equipe', () => {
  const identidade = { usuarioId: 'vend-1', lojaId: 'loja-1' };

  it('participante autorizado encontra o cliente no escopo própria', async () => {
    const permissoes = {
      pode: jest.fn(async (_u: string, _l: string, p: string) => {
        if (p === VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA) return true;
        return false;
      }),
    };
    const prisma = {
      usuario: { findMany: jest.fn() },
      cliente: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cli-part' }),
      },
    };
    const svc = new VendasCarteiraEscopoService(
      prisma as never,
      permissoes as never,
    );

    await expect(
      svc.assertClienteAcessivel(identidade as never, 'cli-part'),
    ).resolves.toBeUndefined();

    const where = (prisma.cliente.findFirst as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.AND[0].OR).toEqual(
      expect.arrayContaining([
        { responsavel_comercial_id: 'vend-1' },
        { participantes: { some: { usuario_id: 'vend-1' } } },
      ]),
    );
  });

  it('gestor com VER_EQUIPE consulta equipe de vendas da loja', async () => {
    const permissoes = {
      pode: jest.fn(async (_u: string, _l: string, p: string) => {
        if (p === VENDAS_PERMISSOES.CARTEIRA_VER_EQUIPE) return true;
        return false;
      }),
    };
    const prisma = {
      usuario: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'vend-1' }, { id: 'vend-2' }]),
      },
      cliente: {
        findFirst: jest.fn().mockResolvedValue({ id: 'cli-eq' }),
      },
    };
    const svc = new VendasCarteiraEscopoService(
      prisma as never,
      permissoes as never,
    );

    await svc.assertClienteAcessivel(identidade as never, 'cli-eq');
    expect(prisma.usuario.findMany).toHaveBeenCalled();
    const where = (prisma.cliente.findFirst as jest.Mock).mock.calls[0][0]
      .where;
    expect(where.AND[0].OR).toEqual(
      expect.arrayContaining([
        { responsavel_comercial_id: { in: ['vend-1', 'vend-2'] } },
        {
          participantes: {
            some: { usuario_id: { in: ['vend-1', 'vend-2'] } },
          },
        },
      ]),
    );
  });

  it('orçamento: VER_TODOS não exige cliente relacionado', async () => {
    const permissoes = {
      pode: jest.fn(async (_u: string, _l: string, p: string) => {
        if (p === VENDAS_PERMISSOES.CARTEIRA_VER_TODOS) return true;
        return false;
      }),
    };
    const prisma = { usuario: { findMany: jest.fn() }, cliente: { findFirst: jest.fn() } };
    const svc = new VendasCarteiraEscopoService(
      prisma as never,
      permissoes as never,
    );
    await expect(svc.whereOrcamento(identidade as never)).resolves.toEqual({
      loja_id: 'loja-1',
    });
  });

  it('orçamento: VER_PROPRIA inclui responsável e carteira do cliente', async () => {
    const permissoes = {
      pode: jest.fn(async (_u: string, _l: string, p: string) => {
        if (p === VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA) return true;
        return false;
      }),
    };
    const prisma = { usuario: { findMany: jest.fn() }, cliente: { findFirst: jest.fn() } };
    const svc = new VendasCarteiraEscopoService(
      prisma as never,
      permissoes as never,
    );
    const where = await svc.whereOrcamento(identidade as never);
    expect(where.loja_id).toBe('loja-1');
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { responsavel_id: 'vend-1' },
        expect.objectContaining({ cliente: { is: expect.any(Object) } }),
      ]),
    );
  });

  it('cliente fora do escopo retorna NotFound', async () => {
    const permissoes = {
      pode: jest.fn(async (_u: string, _l: string, p: string) => {
        if (p === VENDAS_PERMISSOES.CARTEIRA_VER_PROPRIA) return true;
        return false;
      }),
    };
    const prisma = {
      usuario: { findMany: jest.fn() },
      cliente: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const svc = new VendasCarteiraEscopoService(
      prisma as never,
      permissoes as never,
    );

    await expect(
      svc.assertClienteAcessivel(identidade as never, 'cli-outra'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
