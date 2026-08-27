import { BadRequestException, NotFoundException } from '@nestjs/common';
import { usuario_funcao, usuario_status } from '@prisma/client';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService contenção (Fase 0)', () => {
  function setup(overrides?: {
    findFirst?: unknown;
    count?: number;
    update?: unknown;
  }) {
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(overrides?.findFirst ?? null),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'user-1' }),
        update: jest.fn().mockResolvedValue(overrides?.update ?? { id: 'u1' }),
        count: jest.fn().mockResolvedValue(overrides?.count ?? 0),
      },
    };
    const mail = { sendVerificationEmail: jest.fn() };
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new UsuariosService(prisma as any, mail as any, audit as any);
    return { service, prisma, mail, audit };
  }

  it('obter não devolve senha nem segredo', async () => {
    const publico = {
      id: 'u1',
      nome_completo: 'Ana',
      email: 'ana@loja.com',
      telefone: null,
      funcao: usuario_funcao.VENDAS,
      loja_id: 'loja-1',
      status: usuario_status.ATIVO,
      ativo: true,
      email_verificado: true,
      criado_em: new Date(),
      atualizado_em: new Date(),
    };
    const { service, prisma } = setup({ findFirst: publico });

    const resultado = await service.obter('u1', 'loja-1');

    expect(resultado).toEqual(publico);
    expect(prisma.usuario.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          id: true,
          email: true,
        }),
      }),
    );
    const select = prisma.usuario.findFirst.mock.calls[0][0].select;
    expect(select.senha).toBeUndefined();
    expect(select.two_factor_secret).toBeUndefined();
    expect(select.codigo_verificacao_email).toBeUndefined();
  });

  it('obter de outra loja resulta em não encontrado', async () => {
    const { service } = setup({ findFirst: null });
    await expect(service.obter('u1', 'loja-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('impede rebaixar o último administrador ativo', async () => {
    const { service } = setup({
      findFirst: {
        id: 'admin-1',
        funcao: usuario_funcao.ADMINISTRADOR,
        status: usuario_status.ATIVO,
      },
      count: 0,
    });

    await expect(
      service.atualizar(
        'admin-1',
        'loja-1',
        { funcao: usuario_funcao.VENDAS },
        'ator-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reenviar código não revela se o e-mail existe', async () => {
    const { service, mail } = setup();
    const resposta = await service.reenviarCodigo('naoexiste@loja.com');
    expect(resposta.message).toMatch(/Se o e-mail existir/i);
    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('lista só a loja autenticada e pagina', async () => {
    const prisma = {
      usuario: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ id: 'u1', loja_id: 'loja-1' }]),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
    };
    const mail = { sendVerificationEmail: jest.fn() };
    const audit = { registrar: jest.fn() };
    const service = new UsuariosService(prisma as any, mail as any, audit as any);

    const resultado = await service.listar('loja-1', { page: 1, limit: 20 });

    expect(resultado.total).toBe(1);
    expect(resultado.items).toHaveLength(1);
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ loja_id: 'loja-1' }),
        take: 20,
        skip: 0,
      }),
    );
  });
});
