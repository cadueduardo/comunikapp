import { Test, TestingModule } from '@nestjs/testing';
import { ItensController } from './itens.controller';
import { ItensEstoqueService } from '../services/itens-estoque.service';
import { DashboardEstoqueService } from '../services/dashboard-estoque.service';
import { CreateItemEstoqueDto } from '../dto/create-item-estoque.dto';
import { QueryItensEstoqueDto } from '../dto/query-estoque.dto';
import { EstoqueRequest } from '../middleware/tenant-isolation.middleware';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ItensController', () => {
  let controller: ItensController;
  let estoqueService: ItensEstoqueService;
  let dashboardService: DashboardEstoqueService;

  const mockEstoqueService = {
    criarItemEstoque: jest.fn(),
    listarItensEstoque: jest.fn(),
    buscarItemEstoquePorId: jest.fn(),
    atualizarItemEstoque: jest.fn(),
    excluirItemEstoque: jest.fn(),
    obterDashboard: jest.fn(),
  };

  const mockDashboardService = {
    obterDashboard: jest.fn(),
  };

  const mockRequest: EstoqueRequest = {
    estoque: {
      lojaId: 'loja-123',
      usuarioId: 'user-456',
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItensController],
      providers: [
        {
          provide: ItensEstoqueService,
          useValue: mockEstoqueService,
        },
        {
          provide: DashboardEstoqueService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<ItensController>(ItensController);
    estoqueService = module.get<ItensEstoqueService>(ItensEstoqueService);
    dashboardService = module.get<DashboardEstoqueService>(DashboardEstoqueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('criar', () => {
    it('should create a stock item successfully', async () => {
      const createDto: any = {
        insumoId: 'insumo-123',
        localizacaoId: 'loc-123',
        nome: 'Item X',
        quantidadeAtual: 100,
        quantidadeReservada: 0,
        unidadeMedida: 'un',
        precoUnitario: 25.5,
        estoqueMinimo: 10,
        estoqueMaximo: 200,
      };

      const expectedResult = {
        id: 'item-123',
        ...createDto,
        quantidadeReservada: 0,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.criarItemEstoque.mockResolvedValue(expectedResult);

      const result = await controller.criar(createDto as any, { id: 'loja-123' } as any);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.criarItemEstoque).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
          usuarioId: 'loja-123',
        },
        createDto,
      );
    });

    it('should throw BadRequestException when service throws error', async () => {
      const createDto: any = {
        insumoId: 'insumo-123',
        localizacaoId: 'loc-123',
      };

      mockEstoqueService.criarItemEstoque.mockRejectedValue(
        new BadRequestException('Dados inválidos'),
      );

      await expect(controller.criar(createDto as any, { id: 'loja-123' } as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listar', () => {
    it('should return paginated stock items list', async () => {
      const query: QueryItensEstoqueDto = {
        page: 1,
        limit: 10,
        insumoId: 'insumo-123',
        localizacaoId: 'loc-123',
      };

      const expectedResult = {
        data: [
          {
            id: 'item-123',
            insumoId: 'insumo-123',
            insumoNome: 'Material de Construção',
            localizacaoId: 'loc-123',
            localizacaoCodigo: 'DEP01-COR01-P001',
            quantidadeAtual: 100,
            quantidadeReservada: 0,
            estoqueMinimo: 10,
            estoqueMaximo: 200,
            valorUnitario: 25.5,
            lojaId: mockRequest.estoque.lojaId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          pages: 1,
        },
      };

      mockEstoqueService.listarItensEstoque.mockResolvedValue(expectedResult);

      const result = await controller.listar(query as any, { id: 'loja-123' } as any);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.listarItensEstoque).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
        },
        query,
      );
    });

    it('should handle empty results', async () => {
      const query: QueryItensEstoqueDto = {} as any;

      const expectedResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockEstoqueService.listarItensEstoque.mockResolvedValue(expectedResult);

      const result = await controller.listar(query as any, { id: 'loja-123' } as any);

      expect(result).toEqual(expectedResult);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('buscarPorId', () => {
    it('should return stock item by id', async () => {
      const itemId = 'item-123';

      const expectedResult = {
        id: itemId,
        insumoId: 'insumo-123',
        insumoNome: 'Material de Construção',
        localizacaoId: 'loc-123',
        localizacaoCodigo: 'DEP01-COR01-P001',
        quantidadeAtual: 100,
        quantidadeReservada: 0,
        estoqueMinimo: 10,
        estoqueMaximo: 200,
        valorUnitario: 25.5,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.buscarItemEstoquePorId.mockResolvedValue(
        expectedResult,
      );

      const result = await controller.buscarPorId(itemId, { id: 'loja-123' } as any);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.buscarItemEstoquePorId).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
        },
        itemId,
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      const itemId = 'item-not-found';

      mockEstoqueService.buscarItemEstoquePorId.mockRejectedValue(
        new NotFoundException('Item não encontrado'),
      );

      await expect(controller.buscarPorId(itemId, { id: 'loja-123' } as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('atualizar', () => {
    it('should update stock item successfully', async () => {
      const itemId = 'item-123';
      const updateDto = {
        quantidadeAtual: 150,
        estoqueMinimo: 15,
        valorUnitario: 30.0,
      };

      const expectedResult = {
        id: itemId,
        insumoId: 'insumo-123',
        insumoNome: 'Material de Construção',
        localizacaoId: 'loc-123',
        localizacaoCodigo: 'DEP01-COR01-P001',
        quantidadeAtual: 150,
        quantidadeReservada: 0,
        estoqueMinimo: 15,
        estoqueMaximo: 200,
        valorUnitario: 30.0,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.atualizarItemEstoque.mockResolvedValue(expectedResult);

      const result = await controller.atualizar(itemId, updateDto as any, { id: 'loja-123' } as any);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.atualizarItemEstoque).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
          usuarioId: 'loja-123',
        },
        itemId,
        updateDto,
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      const itemId = 'item-not-found';
      const updateDto = { quantidadeAtual: 150 };

      mockEstoqueService.atualizarItemEstoque.mockRejectedValue(
        new NotFoundException('Item não encontrado'),
      );

      await expect(
        controller.atualizar(itemId, updateDto as any, { id: 'loja-123' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('excluir', () => {
    it('should delete stock item successfully', async () => {
      const itemId = 'item-123';

      const expectedResult = {
        id: itemId,
        insumoId: 'insumo-123',
        localizacaoId: 'loc-123',
        quantidadeAtual: 0,
        quantidadeReservada: 0,
        estoqueMinimo: 10,
        estoqueMaximo: 200,
        valorUnitario: 25.5,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.excluirItemEstoque.mockResolvedValue(expectedResult);

      const result = await controller.excluir(itemId, { id: 'loja-123' } as any);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.excluirItemEstoque).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
          usuarioId: 'loja-123',
        },
        itemId,
      );
    });

    it('should throw NotFoundException when item not found', async () => {
      const itemId = 'item-not-found';

      mockEstoqueService.excluirItemEstoque.mockRejectedValue(
        new NotFoundException('Item não encontrado'),
      );

      await expect(controller.excluir(itemId, mockRequest as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
