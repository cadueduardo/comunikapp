import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../../prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: PrismaService;

  const prismaMock = { $queryRawUnsafe: jest.fn().mockResolvedValue([{ ok: 1 }]) } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('dbCheck', () => {
    it('should return health status successfully', async () => {
      const result = await controller.dbCheck();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('db');
    });

    it('should handle service errors gracefully', async () => {
      (prisma.$queryRawUnsafe as any as jest.Mock).mockRejectedValueOnce(
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
