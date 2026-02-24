import { Test, TestingModule } from '@nestjs/testing';
import { MovimentacoesController } from './movimentacoes.controller';
import { MovimentacoesService } from '../services/movimentacoes.service';
import { CreateMovimentacaoDto } from '../dto/create-movimentacao.dto';
import { QueryMovimentacoesDto } from '../dto/query-estoque.dto';
import { EstoqueRequest } from '../middleware/tenant-isolation.middleware';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MovimentacoesController', () => {
  let controller: MovimentacoesController;
  let movimentacoesService: MovimentacoesService;

  const mockMovimentacoesService = {
    criarMovimentacao: jest.fn(),
    listarMovimentacoes: jest.fn(),
  };

  const mockRequest: EstoqueRequest = {
    estoque: {
      lojaId: 'loja-123',
      usuarioId: 'user-456',
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovimentacoesController],
      providers: [
        {
          provide: MovimentacoesService,
          useValue: mockMovimentacoesService,
        },
      ],
    }).compile();

    controller = module.get<MovimentacoesController>(MovimentacoesController);
    movimentacoesService =
      module.get<MovimentacoesService>(MovimentacoesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('criar', () => {
    it('should create a movement successfully', async () => {
      const createDto: CreateMovimentacaoDto = {
        estoqueId: 'estoque-123',
        tipo: 'ENTRADA',
        quantidade: 50,
        documentoRef: 'DOC-001',
        orcamentoId: 'orc-123',
        observacoes: 'Entrada de material',
      };

      const expectedResult = {
        id: 'mov-123',
        estoqueId: 'estoque-123',
        tipo: 'ENTRADA',
        quantidade: 50,
        quantidadeAnterior: 100,
        quantidadePosterior: 150,
        documentoRef: 'DOC-001',
        observacoes: 'Entrada de material',
        usuarioId: 'loja-123',
        dataMovimentacao: new Date(),
      } as any;

      mockMovimentacoesService.criarMovimentacao.mockResolvedValue(
        expectedResult,
      );

      const loja = { id: 'loja-123' } as any;
      const result = await controller.criar(createDto, loja);

      expect(result).toEqual(expectedResult);
      expect(mockMovimentacoesService.criarMovimentacao).toHaveBeenCalledWith(
        {
          lojaId: loja.id,
          usuarioId: loja.id,
        },
        createDto,
      );
    });

    it('should throw BadRequestException when service throws error', async () => {
      const createDto: CreateMovimentacaoDto = {
        estoqueId: 'estoque-123',
        tipo: 'ENTRADA',
        quantidade: 50,
      };

      mockMovimentacoesService.criarMovimentacao.mockRejectedValue(
        new BadRequestException('Dados inválidos'),
      );

      const loja = { id: 'loja-123' } as any;
      await expect(controller.criar(createDto, loja)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listar', () => {
    it('should return paginated movements list', async () => {
      const query: QueryMovimentacoesDto = {
        page: 1,
        limit: 10,
        tipo: 'ENTRADA',
        estoqueId: 'estoque-123',
        dataInicial: '2025-01-01',
        dataFinal: '2025-01-31',
      };

      const expectedResult = {
        data: [
          {
            id: 'mov-123',
            estoqueId: 'estoque-123',
            insumoNome: 'Material de Construção',
            localizacaoCodigo: 'DEP01-COR01-P001',
            tipo: 'ENTRADA',
            quantidade: 50,
            quantidadeAnterior: 100,
            quantidadePosterior: 150,
            documentoRef: 'DOC-001',
            orcamentoId: 'orc-123',
            usuarioId: 'user-456',
            usuarioNome: 'João Silva',
            observacoes: 'Entrada de material',
            dataMovimentacao: new Date(),
            lojaId: 'loja-123',
            createdAt: new Date(),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      } as any;

      mockMovimentacoesService.listarMovimentacoes.mockResolvedValue(
        expectedResult,
      );

      const loja = { id: 'loja-123' } as any;
      const result = await controller.listar(query, loja);

      expect(result).toEqual(expectedResult);
      expect(mockMovimentacoesService.listarMovimentacoes).toHaveBeenCalledWith(
        {
          lojaId: loja.id,
        },
        query,
      );
    });

    it('should handle empty results', async () => {
      const query: QueryMovimentacoesDto = {};

      const expectedResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
      };

      mockMovimentacoesService.listarMovimentacoes.mockResolvedValue(
        expectedResult,
      );

      const loja = { id: 'loja-123' } as any;
      const result = await controller.listar(query, loja);

      expect(result).toEqual(expectedResult);
    });
  });
});
