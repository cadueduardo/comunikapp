import { Test, TestingModule } from '@nestjs/testing';
import { MovimentacoesController } from './movimentacoes.controller';
import { EstoqueSimpleService } from '../services/estoque-simple.service';
import { CreateMovimentacaoDto } from '../dto/create-movimentacao.dto';
import { QueryMovimentacoesDto } from '../dto/query-estoque.dto';
import { EstoqueRequest } from '../middleware/tenant-isolation.middleware';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('MovimentacoesController', () => {
  let controller: MovimentacoesController;
  let estoqueService: EstoqueSimpleService;

  const mockEstoqueService = {
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
          provide: EstoqueSimpleService,
          useValue: mockEstoqueService,
        },
      ],
    }).compile();

    controller = module.get<MovimentacoesController>(MovimentacoesController);
    estoqueService = module.get<EstoqueSimpleService>(EstoqueSimpleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('executar', () => {
    it('should execute a movement successfully', async () => {
      const createDto: CreateMovimentacaoDto = {
        estoqueId: 'estoque-123',
        tipo: 'ENTRADA',
        quantidade: 50,
        documentoRef: 'DOC-001',
        orcamentoId: 'orc-123',
        observacoes: 'Entrada de material',
      };

      const expectedResult = {
        item: {
          id: 'estoque-123',
          quantidadeAtual: 150,
          dataUltimaMov: new Date(),
        },
        movimentacao: {
          id: 'mov-123',
          tipo: 'ENTRADA',
          quantidade: 50,
          quantidadeAnterior: 100,
          quantidadePosterior: 150,
          documentoRef: 'DOC-001',
          observacoes: 'Entrada de material',
          usuarioId: mockRequest.estoque.usuarioId,
          dataMovimentacao: new Date(),
        },
      };

      mockEstoqueService.criarMovimentacao.mockResolvedValue(expectedResult);

      const result = await controller.executar(createDto, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.criarMovimentacao).toHaveBeenCalledWith(
        {
          lojaId: mockRequest.estoque.lojaId,
          usuarioId: mockRequest.estoque.usuarioId,
        },
        createDto
      );
    });

    it('should throw BadRequestException when service throws error', async () => {
      const createDto: CreateMovimentacaoDto = {
        estoqueId: 'estoque-123',
        tipo: 'ENTRADA',
        quantidade: 50,
      };

      mockEstoqueService.criarMovimentacao.mockRejectedValue(
        new BadRequestException('Dados inválidos')
      );

      await expect(
        controller.executar(createDto, mockRequest)
      ).rejects.toThrow(BadRequestException);
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
            usuarioId: mockRequest.estoque.usuarioId,
            usuarioNome: 'João Silva',
            observacoes: 'Entrada de material',
            dataMovimentacao: new Date(),
            lojaId: mockRequest.estoque.lojaId,
            createdAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      mockEstoqueService.listarMovimentacoes.mockResolvedValue(expectedResult);

      const result = await controller.listar(query, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.listarMovimentacoes).toHaveBeenCalledWith(
        {
          lojaId: mockRequest.estoque.lojaId,
          usuarioId: mockRequest.estoque.usuarioId,
        },
        query
      );
    });

    it('should handle empty results', async () => {
      const query: QueryMovimentacoesDto = {};

      const expectedResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockEstoqueService.listarMovimentacoes.mockResolvedValue(expectedResult);

      const result = await controller.listar(query, mockRequest);

      expect(result).toEqual(expectedResult);
    });
  });


});
