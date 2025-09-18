import { Test, TestingModule } from '@nestjs/testing';
import { CatalogoInsumosModule } from './catalogo-insumos.module';
import { CatalogoInsumosPrismaService } from './prisma/catalogo-insumos-prisma.service';

// Mock do ConfigModule
jest.mock('@nestjs/config', () => ({
  ConfigModule: {
    forRoot: jest.fn().mockReturnValue({
      module: class MockConfigModule {},
      providers: [],
      exports: [],
    }),
  },
}));

// Mock do PrismaService
const mockPrismaService = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  checkHealth: jest.fn(),
  getConnectionInfo: jest.fn(),
};

describe('CatalogoInsumosModule', () => {
  let module: TestingModule;
  let prismaService: CatalogoInsumosPrismaService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [CatalogoInsumosModule],
    })
      .overrideProvider(CatalogoInsumosPrismaService)
      .useValue(mockPrismaService)
      .compile();

    module = moduleRef;
    prismaService = moduleRef.get<CatalogoInsumosPrismaService>(CatalogoInsumosPrismaService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have CatalogoInsumosPrismaService defined', () => {
    expect(prismaService).toBeDefined();
  });

  it('should export CatalogoInsumosPrismaService', () => {
    expect(module.get(CatalogoInsumosPrismaService)).toBeDefined();
  });
});
