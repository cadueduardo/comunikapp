import { Test, TestingModule } from '@nestjs/testing';
import { LojasService } from './lojas.service';

describe('LojasService', () => {
  let service: lojasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LojasService],
    }).compile();

    service = module.get<LojasService>(LojasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
