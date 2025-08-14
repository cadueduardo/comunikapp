import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// O app principal não expõe a rota '/'. Validar uma rota existente do módulo estoque com bypass controlado.
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/estoque/health (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/estoque/health')
      .set('x-internal-token', process.env.ESTOQUE_INTERNAL_API_TOKEN || 'test-internal-token')
      .set('x-loja-id', 'loja-root-e2e')
      .set('x-usuario-id', 'user-root-e2e')
      .expect(200);
  });
});
