import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

/**
 * Gate 0S / HS-01 — fronteira pública da aplicação.
 *
 * A versão anterior deste arquivo chamava `/api/estoque/health` com
 * `x-internal-token` e esperava 200. Isso deixou de valer: quem decide se uma
 * rota é pública é exclusivamente o catálogo em
 * `src/common/security/rotas-publicas.ts`, e o health do estoque não está nele
 * (ver `rotas-publicas.spec.ts`, bloco "nega por padrão"). Um cabeçalho enviado
 * pelo próprio chamador não abre rota — era exatamente esse o tipo de desvio
 * que o gate fechou.
 *
 * O caso agora afirma o comportamento pretendido, não o antigo.
 */
describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('nega /api/estoque/health sem autenticação', async () => {
    await request(app.getHttpServer()).get('/api/estoque/health').expect(401);
  });

  it('não aceita cabeçalho do chamador como autorização', async () => {
    await request(app.getHttpServer())
      .get('/api/estoque/health')
      .set(
        'x-internal-token',
        process.env.ESTOQUE_INTERNAL_API_TOKEN ||
          'ci-estoque-internal-token-min-32-chars',
      )
      .set('x-loja-id', 'loja-root-e2e')
      .set('x-usuario-id', 'user-root-e2e')
      .expect(401);
  });
});
