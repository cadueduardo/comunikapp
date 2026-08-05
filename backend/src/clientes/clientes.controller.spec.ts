import { Test, TestingModule } from '@nestjs/testing';
import { usuario_funcao } from '@prisma/client';
import { ClientesController } from './clientes.controller';
import { ClientesService } from './clientes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VendasPermissionsGuard } from '../vendas/permissions/vendas-permissions.guard';

describe('ClientesController', () => {
  let controller: ClientesController;
  let service: ClientesService;

  const identidade = {
    usuarioId: 'user-1',
    lojaId: 'loja-1',
    funcao: usuario_funcao.VENDAS,
  };

  const mockClientesService = {
    listar: jest.fn(),
    buscar: jest.fn(),
    criar: jest.fn(),
    obterUm: jest.fn(),
    atualizar: jest.fn(),
    inativar: jest.fn(),
    transferirCarteira: jest.fn(),
    listarResponsaveisDisponiveis: jest.fn(),
    listarParticipantes: jest.fn(),
    adicionarParticipante: jest.fn(),
    removerParticipante: jest.fn(),
    mesclar: jest.fn(),
    listarContatos: jest.fn(),
    criarContato: jest.fn(),
    atualizarContato: jest.fn(),
    inativarContato: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientesController],
      providers: [{ provide: ClientesService, useValue: mockClientesService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(VendasPermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientesController>(ClientesController);
    service = module.get<ClientesService>(ClientesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('listar delega para o service com a identidade e a query', () => {
    const query = { escopo: 'propria' } as any;
    controller.listar(identidade, query);
    expect(service.listar).toHaveBeenCalledWith(identidade, query);
  });

  it('buscar delega q e escopo', () => {
    controller.buscar(identidade, 'joao', 'equipe');
    expect(service.buscar).toHaveBeenCalledWith(identidade, 'joao', 'equipe');
  });

  it('criar delega identidade e dto (não aceita loja/responsável do body)', () => {
    const dto = { nome: 'Cliente X' } as any;
    controller.criar(identidade, dto);
    expect(service.criar).toHaveBeenCalledWith(identidade, dto);
  });

  it('obterUm delega identidade e id', () => {
    controller.obterUm(identidade, 'cli-1');
    expect(service.obterUm).toHaveBeenCalledWith(identidade, 'cli-1');
  });

  it('atualizar delega identidade, id e dto', () => {
    const dto = { nome: 'Novo nome' } as any;
    controller.atualizar(identidade, 'cli-1', dto);
    expect(service.atualizar).toHaveBeenCalledWith(identidade, 'cli-1', dto);
  });

  it('inativar (DELETE) chama o service.inativar — nunca hard delete', () => {
    controller.inativar(identidade, 'cli-1');
    expect(service.inativar).toHaveBeenCalledWith(identidade, 'cli-1');
    expect(service.inativar).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ hardDelete: true }),
    );
  });

  it('transferir delega identidade, id e dto de transferência', () => {
    const dto = {
      para_usuario_id: 'user-2',
      motivo: 'Redistribuição',
      chave_operacao: 'chave-1',
    };
    controller.transferir(identidade, 'cli-1', dto);
    expect(service.transferirCarteira).toHaveBeenCalledWith(identidade, 'cli-1', dto);
  });

  it('listarParticipantes delega identidade e id', () => {
    controller.listarParticipantes(identidade, 'cli-1');
    expect(service.listarParticipantes).toHaveBeenCalledWith(identidade, 'cli-1');
  });

  it('adicionarParticipante delega identidade, id e dto', () => {
    const dto = { usuario_id: 'user-2' };
    controller.adicionarParticipante(identidade, 'cli-1', dto);
    expect(service.adicionarParticipante).toHaveBeenCalledWith(
      identidade,
      'cli-1',
      dto,
    );
  });

  it('removerParticipante delega identidade, cliente e usuarioId', () => {
    controller.removerParticipante(identidade, 'cli-1', 'user-2');
    expect(service.removerParticipante).toHaveBeenCalledWith(
      identidade,
      'cli-1',
      'user-2',
    );
  });

  it('mesclar delega para o service (que nega — Fase diferida)', () => {
    controller.mesclar(identidade, 'cli-1');
    expect(service.mesclar).toHaveBeenCalledWith(identidade, 'cli-1');
  });

  describe('contatos', () => {
    it('listarContatos delega identidade e id do cliente', () => {
      controller.listarContatos(identidade, 'cli-1');
      expect(service.listarContatos).toHaveBeenCalledWith(identidade, 'cli-1');
    });

    it('criarContato delega identidade, id do cliente e dto', () => {
      const dto = { nome: 'Contato X' } as any;
      controller.criarContato(identidade, 'cli-1', dto);
      expect(service.criarContato).toHaveBeenCalledWith(identidade, 'cli-1', dto);
    });

    it('atualizarContato delega identidade, ids e dto', () => {
      const dto = { nome: 'Contato Y' } as any;
      controller.atualizarContato(identidade, 'cli-1', 'contato-1', dto);
      expect(service.atualizarContato).toHaveBeenCalledWith(
        identidade,
        'cli-1',
        'contato-1',
        dto,
      );
    });

    it('inativarContato (DELETE) chama o service.inativarContato — soft', () => {
      controller.inativarContato(identidade, 'cli-1', 'contato-1');
      expect(service.inativarContato).toHaveBeenCalledWith(
        identidade,
        'cli-1',
        'contato-1',
      );
    });
  });
});
