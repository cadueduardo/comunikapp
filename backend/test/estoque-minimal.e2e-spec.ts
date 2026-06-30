import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EstoqueModule } from '../src/estoque/estoque.module';
import { ConfigModule } from '@nestjs/config';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

describe.skip('EstoqueModule Minimal (e2e)', () => {
  let app: INestApplication;

  const lojaId = 'loja-minimal-123';
  const usuarioId = 'user-minimal-456';
  const internalToken = 'test-internal-token';

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.ESTOQUE_INTERNAL_API_TOKEN = internalToken;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), EstoqueModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const withHeaders = (req: request.Test) =>
    req
      .set('x-internal-token', internalToken)
      .set('x-loja-id', lojaId)
      .set('x-usuario-id', usuarioId);

  it('GET /api/estoque/health deve responder 200', async () => {
    await withHeaders(request(app.getHttpServer()).get('/api/estoque/health'))
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
      });
  });

  it('GET /api/estoque/itens/dashboard deve responder 200', async () => {
    await withHeaders(
      request(app.getHttpServer()).get('/api/estoque/itens/dashboard'),
    ).expect(200);
  });

  it('GET /api/estoque/relatorios/baixo deve responder 200', async () => {
    await withHeaders(
      request(app.getHttpServer()).get('/api/estoque/relatorios/baixo'),
    ).expect(200);
  });
});
