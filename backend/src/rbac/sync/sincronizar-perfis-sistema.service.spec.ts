import { usuario_funcao } from '@prisma/client';
import { NOMES_PERFIL_SISTEMA } from '../../vendas/permissions/vendas-permissoes';
import {
  funcaoDoPerfilSistema,
  SincronizarPerfisSistemaService,
} from './sincronizar-perfis-sistema.service';

describe('SincronizarPerfisSistemaService', () => {
  it('não altera grants de perfil customizado', async () => {
    const prisma = mockPrisma({
      customizados: [{ id: 'c1', _count: { permissoes: 3 } }],
      sistemas: [],
    });
    const service = new SincronizarPerfisSistemaService(prisma as any);
    const resultado = await service.preservarCustomizados('loja-1');

    expect(resultado).toEqual({
      customizados: 1,
      grantsCustomizados: 3,
      perfisSistemaAtivos: 0,
      grantsCriados: 0,
      grantsPreservados: 0,
    });
    expect(prisma.perfil_permissao.create).not.toHaveBeenCalled();
    expect(prisma.perfil_permissao.deleteMany).not.toHaveBeenCalled();
    expect(prisma.perfil_acesso.updateMany).not.toHaveBeenCalled();
  });

  it('cria apenas grants ausentes em perfil de sistema e é idempotente', async () => {
    const perfilSistema = {
      id: 'admin-sis',
      nome: NOMES_PERFIL_SISTEMA.ADMIN,
      sistema: true,
      ativo: true,
      permissoes: [
        { modulo: 'dashboard', acao: 'acessar', permitido: true },
        { modulo: 'usuarios', acao: 'acessar', permitido: false },
      ],
    };
    const prisma = mockPrisma({
      customizados: [],
      sistemas: [perfilSistema],
    });
    const service = new SincronizarPerfisSistemaService(prisma as any);

    const primeiro = await service.sincronizarLoja('loja-1');
    expect(primeiro.grantsCriados).toBeGreaterThan(0);
    expect(prisma.perfil_permissao.create).toHaveBeenCalled();
    expect(
      prisma.perfil_permissao.create.mock.calls.some(
        (call: [{ data: { modulo: string; acao: string } }]) =>
          call[0].data.modulo === 'usuarios' && call[0].data.acao === 'acessar',
      ),
    ).toBe(false);

    const existentes = new Set(
      perfilSistema.permissoes.map((p) => `${p.modulo}.${p.acao}`),
    );
    for (const call of prisma.perfil_permissao.create.mock.calls) {
      const data = call[0].data;
      existentes.add(`${data.modulo}.${data.acao}`);
    }
    prisma.perfil_permissao.create.mockClear();
    prisma.perfil_acesso.findMany.mockImplementation(
      async (args: { where: { sistema?: boolean } }) => {
        if (args.where.sistema === false) {
          return [];
        }
        return [
          {
            ...perfilSistema,
            permissoes: [...existentes].map((chave) => {
              const [modulo, ...rest] = chave.split('.');
              return {
                modulo,
                acao: rest.join('.'),
                permitido: chave === 'usuarios.acessar' ? false : true,
              };
            }),
          },
        ];
      },
    );

    const segundo = await service.sincronizarLoja('loja-1');
    expect(segundo.grantsCriados).toBe(0);
    expect(prisma.perfil_permissao.create).not.toHaveBeenCalled();
  });

  it('mapeia nomes de perfil de sistema para função', () => {
    expect(funcaoDoPerfilSistema(NOMES_PERFIL_SISTEMA.ADMIN)).toBe(
      usuario_funcao.ADMINISTRADOR,
    );
    expect(funcaoDoPerfilSistema(NOMES_PERFIL_SISTEMA.VENDEDOR)).toBe(
      usuario_funcao.VENDAS,
    );
    expect(funcaoDoPerfilSistema('Customizado')).toBeNull();
  });
});

function mockPrisma(opts: { customizados: unknown[]; sistemas: unknown[] }) {
  const prisma = {
    perfil_acesso: {
      findMany: jest.fn(async (args: { where: { sistema?: boolean } }) => {
        if (args.where.sistema === false) {
          return opts.customizados;
        }
        return opts.sistemas;
      }),
      updateMany: jest.fn(),
    },
    perfil_permissao: {
      create: jest.fn().mockResolvedValue({}),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (fn: (tx: typeof prisma) => unknown) => fn(prisma),
  );
  return prisma;
}
