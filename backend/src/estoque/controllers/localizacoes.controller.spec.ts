import { Test, TestingModule } from '@nestjs/testing';
import { LocalizacoesController } from './localizacoes.controller';
import { EstoqueSimpleService } from '../services/estoque-simple.service';
import { CreateLocalizacaoDto } from '../dto/create-localizacao.dto';
import { QueryLocalizacoesDto } from '../dto/query-estoque.dto';
import { EstoqueRequest } from '../middleware/tenant-isolation.middleware';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LocalizacoesController', () => {
  let controller: LocalizacoesController;
  let estoqueService: EstoqueSimpleService;

  const mockEstoqueService = {
    criarLocalizacao: jest.fn(),
    listarLocalizacoes: jest.fn(),
    buscarLocalizacaoPorId: jest.fn(),
    atualizarLocalizacao: jest.fn(),
    desativarLocalizacao: jest.fn(),
  };

  const mockRequest: EstoqueRequest = {
    estoque: {
      lojaId: 'loja-123',
      usuarioId: 'user-456',
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocalizacoesController],
      providers: [
        {
          provide: EstoqueSimpleService,
          useValue: mockEstoqueService,
        },
      ],
    }).compile();

    controller = module.get<LocalizacoesController>(LocalizacoesController);
    estoqueService = module.get<EstoqueSimpleService>(EstoqueSimpleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('criar', () => {
    it('should create a location successfully', async () => {
      const createDto: CreateLocalizacaoDto = {
        codigo: 'DEP01-COR01-P001',
        deposito: 'Depósito Principal',
        corredor: 'Corredor 01',
        prateleira: 'Prateleira 01',
        nivel: 'Nível A',
        posicao: 'Posição 001',
        descricao: 'Localização de exemplo',
        capacidade: 100,
      };

      const expectedResult = {
        id: 'loc-123',
        ...createDto,
        ativo: true,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.criarLocalizacao.mockResolvedValue(expectedResult);

      const loja = { id: 'loja-123' } as any;
      const result = await controller.criar(createDto, loja);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.criarLocalizacao).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
          usuarioId: 'loja-123',
        },
        createDto,
      );
    });

    it('should throw BadRequestException when service throws error', async () => {
      const createDto: CreateLocalizacaoDto = {
        codigo: 'DEP01-COR01-P001',
        deposito: 'Depósito Principal',
      };

      mockEstoqueService.criarLocalizacao.mockRejectedValue(
        new BadRequestException('Dados inválidos'),
      );

      const loja = { id: 'loja-123' } as any;
      await expect(controller.criar(createDto, loja)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('listar', () => {
    it('should return paginated locations list', async () => {
      const query: QueryLocalizacoesDto = {
        page: 1,
        limit: 10,
        deposito: 'depósito',
      };

      const expectedResult = {
        data: [
          {
            id: 'loc-123',
            codigo: 'DEP01-COR01-P001',
            deposito: 'Depósito Principal',
            ativo: true,
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

      mockEstoqueService.listarLocalizacoes.mockResolvedValue(expectedResult);

      const loja = { id: 'loja-123' } as any;
      const result = await controller.listar(query, loja);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.listarLocalizacoes).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
        },
        query,
      );
    });

    it('should handle empty results', async () => {
      const query: QueryLocalizacoesDto = {};

      const expectedResult = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        },
      };

      mockEstoqueService.listarLocalizacoes.mockResolvedValue(expectedResult);

      const loja = { id: 'loja-123' } as any;
      const result = await controller.listar(query, loja);

      expect(result).toEqual(expectedResult);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('buscarPorId', () => {
    it('should return location by id', async () => {
      const locationId = 'loc-123';

      const expectedResult = {
        id: locationId,
        codigo: 'DEP01-COR01-P001',
        deposito: 'Depósito Principal',
        ativo: true,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.buscarLocalizacaoPorId.mockResolvedValue(
        expectedResult,
      );

      const loja = { id: 'loja-123' } as any;
      const result = await controller.buscarPorId(locationId, loja);

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.buscarLocalizacaoPorId).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
        },
        locationId,
      );
    });

    it('should throw NotFoundException when location not found', async () => {
      const locationId = 'loc-not-found';

      mockEstoqueService.buscarLocalizacaoPorId.mockRejectedValue(
        new NotFoundException('Localização não encontrada'),
      );

      await expect(
        controller.buscarPorId(locationId, { id: 'loja-123' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('atualizar', () => {
    it('should update location successfully', async () => {
      const locationId = 'loc-123';
      const updateDto = {
        descricao: 'Nova descrição',
        capacidade: 200,
      };

      const expectedResult = {
        id: locationId,
        codigo: 'DEP01-COR01-P001',
        deposito: 'Depósito Principal',
        descricao: 'Nova descrição',
        capacidade: 200,
        ativo: true,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.atualizarLocalizacao.mockResolvedValue(expectedResult);

      const result = await controller.atualizar(
        locationId,
        updateDto,
        { id: 'loja-123' } as any,
      );

      expect(result).toEqual(expectedResult);
      expect(mockEstoqueService.atualizarLocalizacao).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
          usuarioId: 'loja-123',
        },
        locationId,
        updateDto,
      );
    });

    it('should throw NotFoundException when location not found', async () => {
      const locationId = 'loc-not-found';
      const updateDto = { descricao: 'Nova descrição' };

      mockEstoqueService.atualizarLocalizacao.mockRejectedValue(
        new NotFoundException('Localização não encontrada'),
      );

      await expect(
        controller.atualizar(locationId, updateDto, { id: 'loja-123' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('desativar', () => {
    it('should deactivate location successfully', async () => {
      const locationId = 'loc-123';

      const expectedResult = {
        id: locationId,
        codigo: 'DEP01-COR01-P001',
        deposito: 'Depósito Principal',
        ativo: false,
        lojaId: mockRequest.estoque.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockEstoqueService.atualizarLocalizacao.mockResolvedValue(expectedResult);

      const result = await controller.desativar(locationId, { id: 'loja-123' } as any);

      expect(result).toEqual(expectedResult);
      expect(result).toHaveProperty('ativo', false);
      expect(mockEstoqueService.atualizarLocalizacao).toHaveBeenCalledWith(
        {
          lojaId: 'loja-123',
          usuarioId: 'loja-123',
        },
        locationId,
        { ativo: false },
      );
    });

    it('should throw NotFoundException when location not found', async () => {
      const locationId = 'loc-not-found';

      mockEstoqueService.atualizarLocalizacao.mockRejectedValue(
        new NotFoundException('Localização não encontrada'),
      );

      await expect(
        controller.desativar(locationId, { id: 'loja-123' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
