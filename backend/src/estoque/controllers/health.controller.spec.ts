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

  describe('dbCheck', () => {
    it('should return health status successfully', async () => {
      const expectedResult = {
        status: 'ok',
        timestamp: new Date(),
        module: 'estoque',
        version: '1.0.0',
        uptime: 3600,
      };

      mockEstoqueService.healthCheck.mockResolvedValue(expectedResult);

      const result = await controller.dbCheck();

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

      const result = await controller.dbCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('error');
      expect(result.status).toBe('unhealthy');
      expect(result.module).toBe('estoque');
    });
  });

  // info endpoint não existe mais neste controller; coberto por swagger
});
