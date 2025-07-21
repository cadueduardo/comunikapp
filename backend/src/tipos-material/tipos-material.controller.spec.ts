import { Test, TestingModule } from '@nestjs/testing';
import { TiposMaterialController } from './tipos-material.controller';

describe('TiposMaterialController', () => {
  let controller: TiposMaterialController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiposMaterialController],
    }).compile();

    controller = module.get<TiposMaterialController>(TiposMaterialController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
