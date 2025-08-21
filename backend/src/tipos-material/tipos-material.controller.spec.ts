import { Test, TestingModule } from '@nestjs/testing';
import { TiposMaterialController } from './tipos-material.controller';
import { TiposMaterialService } from './tipos-material.service';

describe('TiposMaterialController', () => {
  let controller: TiposMaterialController;
  let service: TiposMaterialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposMaterialController],
      providers: [
        {
          provide: TiposMaterialService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TiposMaterialController>(TiposMaterialController);
    service = module.get<TiposMaterialService>(TiposMaterialService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should have service injected', () => {
    expect(service).toBeDefined();
  });
});
