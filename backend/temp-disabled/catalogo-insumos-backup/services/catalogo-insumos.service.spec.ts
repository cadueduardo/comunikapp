import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CatalogoInsumosService } from './catalogo-insumos.service';
import { CatalogoInsumosPrismaService } from '../prisma/catalogo-insumos-prisma.service';
import { CreateCatalogoInsumoDto, UpdateCatalogoInsumoDto, BuscarInsumosDto } from '../dto';
import { LogicaConsumoInsumo } from '../interfaces';

describe('CatalogoInsumosService', () => {
  let service: CatalogoInsumosService;
  let prismaService: CatalogoInsumosPrismaService;

  const mockPrismaService = {
    catalogoInsumo: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockInsumo = {
    id: 'insumo-123',
    codigo_catalogo: 'PAPEL-001',
    nome: 'Papel Couchê 90g',
    descricao_tecnica: 'Papel couchê brilho 90g/m²',
    categoria_global_id: 'cat-123',
    marca: 'Suzano',
    especificacoes: { gramatura: 90, acabamento: 'brilho' },
    unidade_compra: 'resma',
    unidade_uso: 'folha',
    fator_conversao: 500,
    largura: 21.0,
    altura: 29.7,
    gramatura: 90,
    unidade_dimensao: 'cm',
    tipo_calculo: 'area',
    logica_consumo: LogicaConsumoInsumo.AREA,
    disponibilidade: true,
    fonte_coleta: 'manual',
    data_coleta: new Date(),
    data_atualizacao: new Date(),
    ativo: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogoInsumosService,
        {
          provide: CatalogoInsumosPrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CatalogoInsumosService>(CatalogoInsumosService);
    prismaService = module.get<CatalogoInsumosPrismaService>(CatalogoInsumosPrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createInsumo', () => {
    const createDto: CreateCatalogoInsumoDto = {
      codigo_catalogo: 'PAPEL-001',
      nome: 'Papel Couchê 90g',
      unidade_compra: 'resma',
      unidade_uso: 'folha',
      fator_conversao: 500,
      logica_consumo: LogicaConsumoInsumo.AREA,
    };

    it('should create a new insumo successfully', async () => {
      mockPrismaService.catalogoInsumo.findUnique.mockResolvedValue(null);
      mockPrismaService.catalogoInsumo.create.mockResolvedValue(mockInsumo);

      const result = await service.createInsumo(createDto);

      expect(result).toEqual(mockInsumo);
      expect(mockPrismaService.catalogoInsumo.findUnique).toHaveBeenCalledWith({
        where: { codigo_catalogo: createDto.codigo_catalogo },
      });
      expect(mockPrismaService.catalogoInsumo.create).toHaveBeenCalledWith({
        data: {
          ...createDto,
          data_coleta: expect.any(Date),
        },
        include: {
          categoria_global: true,
        },
      });
    });

    it('should throw BadRequestException if codigo_catalogo already exists', async () => {
      mockPrismaService.catalogoInsumo.findUnique.mockResolvedValue(mockInsumo);

      await expect(service.createInsumo(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.catalogoInsumo.create).not.toHaveBeenCalled();
    });
  });

  describe('findInsumoById', () => {
    it('should return insumo when found', async () => {
      mockPrismaService.catalogoInsumo.findUnique.mockResolvedValue(mockInsumo);

      const result = await service.findInsumoById('insumo-123');

      expect(result).toEqual(mockInsumo);
      expect(mockPrismaService.catalogoInsumo.findUnique).toHaveBeenCalledWith({
        where: { id: 'insumo-123' },
        include: { categoria_global: true },
      });
    });

    it('should throw NotFoundException when insumo not found', async () => {
      mockPrismaService.catalogoInsumo.findUnique.mockResolvedValue(null);

      await expect(service.findInsumoById('insumo-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('buscarInsumos', () => {
    const mockPaginatedResult = {
      data: [mockInsumo],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    it('should return paginated results with default filters', async () => {
      mockPrismaService.catalogoInsumo.count.mockResolvedValue(1);
      mockPrismaService.catalogoInsumo.findMany.mockResolvedValue([mockInsumo]);

      const result = await service.buscarInsumos({});

      expect(result).toEqual(mockPaginatedResult);
      expect(mockPrismaService.catalogoInsumo.count).toHaveBeenCalledWith({
        where: {},
      });
      expect(mockPrismaService.catalogoInsumo.findMany).toHaveBeenCalledWith({
        where: {},
        include: { categoria_global: true },
        orderBy: { nome: 'asc' },
        skip: 0,
        take: 20,
      });
    });

    it('should apply filters correctly', async () => {
      const filtros: BuscarInsumosDto = {
        nome: 'Papel',
        categoria_id: 'cat-123',
        marca: 'Suzano',
        ativo: true,
        page: 2,
        limit: 10,
        orderBy: 'nome',
        orderDirection: 'desc',
      };

      mockPrismaService.catalogoInsumo.count.mockResolvedValue(1);
      mockPrismaService.catalogoInsumo.findMany.mockResolvedValue([mockInsumo]);

      await service.buscarInsumos(filtros);

      expect(mockPrismaService.catalogoInsumo.findMany).toHaveBeenCalledWith({
        where: {
          nome: { contains: 'Papel', mode: 'insensitive' },
          categoria_global_id: 'cat-123',
          marca: { contains: 'Suzano', mode: 'insensitive' },
          ativo: true,
        },
        include: { categoria_global: true },
        orderBy: { nome: 'desc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('updateInsumo', () => {
    const updateDto: UpdateCatalogoInsumoDto = {
      nome: 'Papel Couchê 90g Atualizado',
    };

    it('should update insumo successfully', async () => {
      mockPrismaService.catalogoInsumo.findUnique.mockResolvedValue(mockInsumo);
      mockPrismaService.catalogoInsumo.update.mockResolvedValue({
        ...mockInsumo,
        ...updateDto,
      });

      const result = await service.updateInsumo('insumo-123', updateDto);

      expect(result).toEqual({
        ...mockInsumo,
        ...updateDto,
      });
      expect(mockPrismaService.catalogoInsumo.update).toHaveBeenCalledWith({
        where: { id: 'insumo-123' },
        data: {
          ...updateDto,
          data_atualizacao: expect.any(Date),
        },
        include: { categoria_global: true },
      });
    });

    it('should throw NotFoundException when insumo not found', async () => {
      mockPrismaService.catalogoInsumo.findUnique.mockResolvedValue(null);

      await expect(service.updateInsumo('insumo-999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivateInsumo', () => {
    it('should deactivate insumo successfully', async () => {
      const deactivatedInsumo = { ...mockInsumo, ativo: false };
      mockPrismaService.catalogoInsumo.update.mockResolvedValue(deactivatedInsumo);

      const result = await service.deactivateInsumo('insumo-123');

      expect(result).toEqual(deactivatedInsumo);
      expect(mockPrismaService.catalogoInsumo.update).toHaveBeenCalledWith({
        where: { id: 'insumo-123' },
        data: { ativo: false },
        include: { categoria_global: true },
      });
    });
  });

  describe('activateInsumo', () => {
    it('should activate insumo successfully', async () => {
      const activatedInsumo = { ...mockInsumo, ativo: true };
      mockPrismaService.catalogoInsumo.update.mockResolvedValue(activatedInsumo);

      const result = await service.activateInsumo('insumo-123');

      expect(result).toEqual(activatedInsumo);
      expect(mockPrismaService.catalogoInsumo.update).toHaveBeenCalledWith({
        where: { id: 'insumo-123' },
        data: { ativo: true },
        include: { categoria_global: true },
      });
    });
  });
});
