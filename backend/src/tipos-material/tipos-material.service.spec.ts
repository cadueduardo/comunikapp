import { Test, TestingModule } from '@nestjs/testing';
import { TiposMaterialService } from './tipos-material.service';

describe('TiposMaterialService', () => {
  let service: TiposMaterialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TiposMaterialService],
    }).compile();

    service = module.get<TiposMaterialService>(TiposMaterialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
