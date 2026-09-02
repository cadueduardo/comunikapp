import { ForbiddenException } from '@nestjs/common';
import { usuario_funcao } from '@prisma/client';
import { VendasAcessoController } from './vendas-acesso.controller';
import { VendasPermissionsService } from './permissions/vendas-permissions.service';
import { VENDAS_PERMISSOES } from './permissions/vendas-permissoes';
import { PrismaService } from '../prisma/prisma.service';

function criarPrismaFake(
  usuarios: Array<{
    id: string;
    loja_id: string;
    status: string;
    ativo: boolean;
    funcao: usuario_funcao;
  }>,
  osAditiva = false,
): PrismaService {
  return {
    usuario: {
      findFirst: (args: any) => {
        const f = args.where;
        const u = usuarios.find(
          (c) =>
            c.id === f.id &&
            c.loja_id === f.loja_id &&
            c.status === f.status &&
            c.ativo === f.ativo,
        );
        if (!u) return Promise.resolve(null);
        return Promise.resolve({
          funcao: u.funcao,
          perfis: [],
        });
      },
    },
    configuracaoInstalacaoLoja: {
      findUnique: () =>
        Promise.resolve({ os_aditiva_habilitada: osAditiva }),
    },
  } as unknown as PrismaService;
}

describe('VendasAcessoController', () => {
  const LOJA = 'loja-a';

  it('concede módulo a VENDAS com piso proposta.ver', async () => {
    const prisma = criarPrismaFake([
        {
          id: 'v',
          loja_id: LOJA,
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.VENDAS,
        },
      ]);
    const svc = new VendasPermissionsService(prisma);
    const controller = new VendasAcessoController(svc, prisma);
    const resp = await controller.obterAcesso({
      user: { id: 'v', loja_id: LOJA, funcao: usuario_funcao.VENDAS },
    });
    expect(resp.pode_acessar_modulo).toBe(true);
    expect(resp.permissoes.proposta_ver).toBe(true);
    expect(resp.permissoes.proposta_excluir).toBe(false);
    expect(resp.permissoes.carteira_ver_propria).toBe(true);
    expect(resp.permissoes.cliente_criar).toBe(true);
    expect(resp.permissoes.carteira_transferir).toBe(false);
    expect(resp.os_aditiva_habilitada).toBe(false);
  });

  it('concede módulo a ADMINISTRADOR (gestor) com piso completo', async () => {
    const prisma = criarPrismaFake([
        {
          id: 'g',
          loja_id: LOJA,
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.ADMINISTRADOR,
        },
      ]);
    const svc = new VendasPermissionsService(prisma);
    const controller = new VendasAcessoController(svc, prisma);
    const resp = await controller.obterAcesso({
      user: {
        id: 'g',
        loja_id: LOJA,
        funcao: usuario_funcao.ADMINISTRADOR,
      },
    });
    expect(resp.pode_acessar_modulo).toBe(true);
    expect(resp.permissoes.proposta_ver).toBe(true);
    expect(resp.permissoes.proposta_criar).toBe(true);
    expect(resp.permissoes.proposta_editar).toBe(true);
    expect(resp.permissoes.proposta_enviar).toBe(true);
    expect(resp.permissoes.proposta_excluir).toBe(true);
  });

  it('nega módulo a PRODUCAO sem perfil', async () => {
    const prisma = criarPrismaFake([
        {
          id: 'p',
          loja_id: LOJA,
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.PRODUCAO,
        },
      ]);
    const svc = new VendasPermissionsService(prisma);
    const controller = new VendasAcessoController(svc, prisma);
    const resp = await controller.obterAcesso({
      user: { id: 'p', loja_id: LOJA, funcao: usuario_funcao.PRODUCAO },
    });
    expect(resp.pode_acessar_modulo).toBe(false);
  });

  it('isola tenant: admin de outra loja não acessa', async () => {
    const prisma = criarPrismaFake([
        {
          id: 'a',
          loja_id: 'loja-b',
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.ADMINISTRADOR,
        },
      ]);
    const svc = new VendasPermissionsService(prisma);
    const controller = new VendasAcessoController(svc, prisma);
    const resp = await controller.obterAcesso({
      user: {
        id: 'a',
        loja_id: LOJA,
        funcao: usuario_funcao.ADMINISTRADOR,
      },
    });
    expect(resp.pode_acessar_modulo).toBe(false);
  });

  it('assertPode ainda é a fonte de verdade (não só o DTO de acesso)', async () => {
    const svc = new VendasPermissionsService(
      criarPrismaFake([
        {
          id: 'p',
          loja_id: LOJA,
          status: 'ATIVO',
          ativo: true,
          funcao: usuario_funcao.PRODUCAO,
        },
      ]),
    );
    await expect(
      svc.assertPode('p', LOJA, VENDAS_PERMISSOES.PROPOSTA_VER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
