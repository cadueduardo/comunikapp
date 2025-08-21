import { Test, TestingModule } from '@nestjs/testing';
import { TiposMaterialService } from './tipos-material.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TiposMaterialService', () => {
  let service: TiposMaterialService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiposMaterialService,
        {
          provide: PrismaService,
          useValue: {
            tipomaterial: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            insumo: {
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TiposMaterialService>(TiposMaterialService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have prisma service injected', () => {
    expect(prismaService).toBeDefined();
  });
});
