import { SincronizarPerfisSistemaService } from './sincronizar-perfis-sistema.service';

describe('SincronizarPerfisSistemaService', () => {
  it('não altera grants de perfil customizado', async () => {
    const prisma = {
      perfil_acesso: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'c1', _count: { permissoes: 3 } },
        ]),
        updateMany: jest.fn(),
      },
      perfil_permissao: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };
    const service = new SincronizarPerfisSistemaService(prisma as any);
    const resultado = await service.preservarCustomizados('loja-1');

    expect(resultado).toEqual({ customizados: 1, grantsCustomizados: 3 });
    expect(prisma.perfil_permissao.createMany).not.toHaveBeenCalled();
    expect(prisma.perfil_permissao.deleteMany).not.toHaveBeenCalled();
    expect(prisma.perfil_acesso.updateMany).not.toHaveBeenCalled();
  });
});
