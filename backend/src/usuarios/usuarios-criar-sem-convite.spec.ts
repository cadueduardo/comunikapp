import { UsuariosService } from './usuarios.service';

describe('UsuariosService.criar (senha opcional e convite da loja)', () => {
  function setup() {
    const tx = {
      usuario: {
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'maria@exemplo.com',
          funcao: 'VENDAS',
        }),
      },
      perfil_acesso: { findMany: jest.fn().mockResolvedValue([]) },
      usuario_perfil: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
    };
    const prisma = {
      usuario: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      loja: {
        findUnique: jest.fn().mockResolvedValue({ nome: 'Loja Teste' }),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) =>
        fn(tx),
      ),
    };
    const mail = { sendVerificationEmail: jest.fn().mockResolvedValue(undefined) };
    const audit = { registrar: jest.fn().mockResolvedValue(undefined) };
    const service = new UsuariosService(prisma as any, mail as any, audit as any);
    return { service, prisma, mail, audit, tx };
  }

  it('sem senha cria pendente e envia convite para o e-mail informado', async () => {
    const { service, mail, tx, prisma } = setup();

    const result = await service.criar(
      'loja-1',
      {
        nome_completo: 'Maria Souza',
        email: 'maria@exemplo.com',
        funcao: 'VENDAS',
      },
      'admin-1',
    );

    expect(result).toEqual({ id: 'user-1' });
    expect(tx.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja_id: 'loja-1',
          email: 'maria@exemplo.com',
          senha: null,
          status: 'PENDENTE_VERIFICACAO',
          email_verificado: false,
        }),
      }),
    );
    const convite = tx.usuario.create.mock.calls[0][0].data;
    expect(convite.codigo_verificacao_email).toMatch(/^\d{6}$/);
    expect(mail.sendVerificationEmail).toHaveBeenCalledWith(
      'maria@exemplo.com',
      convite.codigo_verificacao_email,
      expect.objectContaining({
        mode: 'convite',
        lojaNome: 'Loja Teste',
      }),
    );
    expect(prisma.loja.findUnique).toHaveBeenCalledWith({
      where: { id: 'loja-1' },
      select: { nome: true },
    });
  });

  it('cria usuário ativo quando a senha é informada e não envia convite', async () => {
    const { service, mail, tx, audit } = setup();

    const result = await service.criar(
      'loja-1',
      {
        nome_completo: 'Maria Souza',
        email: 'maria@exemplo.com',
        funcao: 'VENDAS',
        senha: 'senha-segura',
      },
      'admin-1',
    );

    expect(result).toEqual({ id: 'user-1' });
    expect(tx.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          loja_id: 'loja-1',
          email: 'maria@exemplo.com',
          status: 'ATIVO',
          email_verificado: true,
        }),
      }),
    );
    expect(audit.registrar).toHaveBeenCalled();
    expect(mail.sendVerificationEmail).not.toHaveBeenCalled();
  });
});
