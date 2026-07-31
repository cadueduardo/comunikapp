import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Cruza o catálogo de rotas públicas com os controllers reais da aplicação
 * (Gate 0S — HS-03). Se alguma rota liberada pelo catálogo deixar de declarar
 * `@Public()`, o `RotasPublicasValidator` derruba a inicialização e este teste
 * falha, impedindo que a fronteira pública volte a divergir.
 */
describe('RotasPublicasValidator contra os controllers reais', () => {
  let app: INestApplication | undefined;

  afterAll(async () => {
    await app?.close();
  });

  it('inicializa sem divergência entre catálogo e declarações @Public()', async () => {
    const prismaFalso = {
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $on: jest.fn(),
      onModuleInit: jest.fn().mockResolvedValue(undefined),
      onModuleDestroy: jest.fn().mockResolvedValue(undefined),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaFalso)
      .compile();

    app = moduleRef.createNestApplication();

    await expect(app.init()).resolves.toBeDefined();
  }, 120000);
});
