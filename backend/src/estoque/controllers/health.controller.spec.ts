import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { EstoqueSimpleService } from '../services/estoque-simple.service';

describe('HealthController', () => {
  let controller: HealthController;
  let estoqueService: EstoqueSimpleService;

  const mockEstoqueService = {
    healthCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: EstoqueSimpleService,
          useValue: mockEstoqueService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    estoqueService = module.get<EstoqueSimpleService>(EstoqueSimpleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health status successfully', async () => {
      const expectedResult = {
        status: 'ok',
        timestamp: new Date(),
        module: 'estoque',
        version: '1.0.0',
        uptime: 3600,
      };

      mockEstoqueService.healthCheck.mockResolvedValue(expectedResult);

      const result = await controller.check();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('uptime');
      expect(mockEstoqueService.healthCheck).toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      mockEstoqueService.healthCheck.mockRejectedValue(
        new Error('Service error'),
      );

      const result = await controller.check();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('error');
      expect(result.status).toBe('unhealthy');
      expect(result.module).toBe('estoque');
    });
  });

  describe('info', () => {
    it('should return module information', async () => {
      const result = await controller.info();

      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('features');
      expect(result).toHaveProperty('isolation');
      expect(result).toHaveProperty('multiTenant');
      expect(result.name).toBe('estoque');
      expect(result.version).toBe('1.0.0');
      expect(result.isolation).toBe(true);
      expect(result.multiTenant).toBe(true);
      expect(Array.isArray(result.features)).toBe(true);
    });
  });
});
