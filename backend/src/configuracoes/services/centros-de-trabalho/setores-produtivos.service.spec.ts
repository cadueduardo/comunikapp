import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SetoresProdutivosService } from './setores-produtivos.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('SetoresProdutivosService', () => {
  let service: SetoresProdutivosService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      setorProdutivo: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      workflowSetor: {
        count: jest.fn(),
      },
      workflowInstanciaSetor: {
        count: jest.fn(),
      },
      usuario: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SetoresProdutivosService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SetoresProdutivosService>(SetoresProdutivosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar setores da loja', async () => {
    const mockSetores = [
      { id: 'setor-1', nome: 'Impressão', loja_id: 'loja-1' },
    ];
    prisma.setorProdutivo.findMany.mockResolvedValueOnce(mockSetores as any);

    const resultado = await service.listar('loja-1');

    expect(prisma.setorProdutivo.findMany).toHaveBeenCalledWith({
      where: { loja_id: 'loja-1' },
      orderBy: { ordem: 'asc' },
    });
    expect(resultado).toEqual(mockSetores);
  });

  it('deve retornar setor quando encontrar por id', async () => {
    const mockSetor = { id: 'setor-1', loja_id: 'loja-1' };
    prisma.setorProdutivo.findFirst.mockResolvedValueOnce(mockSetor as any);

    const resultado = await service.obterPorId('setor-1', 'loja-1');

    expect(prisma.setorProdutivo.findFirst).toHaveBeenCalledWith({
      where: { id: 'setor-1', loja_id: 'loja-1' },
    });
    expect(resultado).toEqual(mockSetor);
  });

  it('deve lançar erro quando setor não for encontrado', async () => {
    prisma.setorProdutivo.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.obterPorId('setor-1', 'loja-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('não deve permitir criar setor duplicado', async () => {
    prisma.setorProdutivo.findFirst.mockResolvedValueOnce({
      id: 'existing',
    } as any);

    await expect(
      service.criar('loja-1', {
        nome: 'Impressão',
        cor: '#000',
        ativo: true,
        ordem: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve retornar setor associado ao operador quando existir', async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce({
      instancias_setor_operador: [
        { setor: { id: 'setor-1', nome: 'Impressão' } },
      ],
    } as any);

    const resultado = await service.obterPorOperador('operador-1');

    expect(resultado).toEqual({ id: 'setor-1', nome: 'Impressão' });
  });

  it('deve retornar null quando operador não tiver setor', async () => {
    prisma.usuario.findUnique.mockResolvedValueOnce(null as any);

    const resultado = await service.obterPorOperador('operador-1');

    expect(resultado).toBeNull();
  });
});
