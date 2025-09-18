import { Test, TestingModule } from '@nestjs/testing';
import { CatalogoInsumosController } from './catalogo-insumos.controller';
import { CatalogoInsumosService } from '../services/catalogo-insumos.service';
import { CreateCatalogoInsumoDto, UpdateCatalogoInsumoDto, BuscarInsumosDto } from '../dto';
import { LogicaConsumoInsumo } from '../interfaces';

describe('CatalogoInsumosController', () => {
  let controller: CatalogoInsumosController;
  let service: CatalogoInsumosService;

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

  const mockPaginatedResult = {
    data: [mockInsumo],
    total: 1,
    page: 1,
    limit: 20,
    totalPages: 1,
  };

  const mockService = {
    createInsumo: jest.fn(),
    findInsumoById: jest.fn(),
    buscarInsumos: jest.fn(),
    updateInsumo: jest.fn(),
    deactivateInsumo: jest.fn(),
    activateInsumo: jest.fn(),
    findInsumosByCategoria: jest.fn(),
    findInsumosByMarca: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogoInsumosController],
      providers: [
        {
          provide: CatalogoInsumosService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CatalogoInsumosController>(CatalogoInsumosController);
    service = module.get<CatalogoInsumosService>(CatalogoInsumosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    it('should create a new insumo', async () => {
      mockService.createInsumo.mockResolvedValue(mockInsumo);

      const result = await controller.createInsumo(createDto);

      expect(result).toEqual(mockInsumo);
      expect(service.createInsumo).toHaveBeenCalledWith(createDto);
    });
  });

  describe('buscarInsumos', () => {
    const filtros: BuscarInsumosDto = {
      nome: 'Papel',
      page: 1,
      limit: 20,
    };

    it('should return paginated results', async () => {
      mockService.buscarInsumos.mockResolvedValue(mockPaginatedResult);

      const result = await controller.buscarInsumos(filtros);

      expect(result).toEqual(mockPaginatedResult);
      expect(service.buscarInsumos).toHaveBeenCalledWith(filtros);
    });
  });

  describe('findInsumoById', () => {
    it('should return insumo by id', async () => {
      mockService.findInsumoById.mockResolvedValue(mockInsumo);

      const result = await controller.findInsumoById('insumo-123');

      expect(result).toEqual(mockInsumo);
      expect(service.findInsumoById).toHaveBeenCalledWith('insumo-123');
    });
  });

  describe('updateInsumo', () => {
    const updateDto: UpdateCatalogoInsumoDto = {
      nome: 'Papel Couchê 90g Atualizado',
    };

    it('should update insumo', async () => {
      const updatedInsumo = { ...mockInsumo, ...updateDto };
      mockService.updateInsumo.mockResolvedValue(updatedInsumo);

      const result = await controller.updateInsumo('insumo-123', updateDto);

      expect(result).toEqual(updatedInsumo);
      expect(service.updateInsumo).toHaveBeenCalledWith('insumo-123', updateDto);
    });
  });

  describe('deactivateInsumo', () => {
    it('should deactivate insumo', async () => {
      const deactivatedInsumo = { ...mockInsumo, ativo: false };
      mockService.deactivateInsumo.mockResolvedValue(deactivatedInsumo);

      const result = await controller.deactivateInsumo('insumo-123');

      expect(result).toEqual(deactivatedInsumo);
      expect(service.deactivateInsumo).toHaveBeenCalledWith('insumo-123');
    });
  });

  describe('activateInsumo', () => {
    it('should activate insumo', async () => {
      const activatedInsumo = { ...mockInsumo, ativo: true };
      mockService.activateInsumo.mockResolvedValue(activatedInsumo);

      const result = await controller.activateInsumo('insumo-123');

      expect(result).toEqual(activatedInsumo);
      expect(service.activateInsumo).toHaveBeenCalledWith('insumo-123');
    });
  });

  describe('findInsumosByCategoria', () => {
    it('should return insumos by category', async () => {
      mockService.findInsumosByCategoria.mockResolvedValue([mockInsumo]);

      const result = await controller.findInsumosByCategoria('cat-123');

      expect(result).toEqual([mockInsumo]);
      expect(service.findInsumosByCategoria).toHaveBeenCalledWith('cat-123');
    });
  });

  describe('findInsumosByMarca', () => {
    it('should return insumos by brand', async () => {
      mockService.findInsumosByMarca.mockResolvedValue([mockInsumo]);

      const result = await controller.findInsumosByMarca('Suzano');

      expect(result).toEqual([mockInsumo]);
      expect(service.findInsumosByMarca).toHaveBeenCalledWith('Suzano');
    });
  });
});
