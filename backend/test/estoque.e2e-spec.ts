import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

// Mock do MailService para evitar problemas de dependência
jest.mock('../src/mail/mail.service', () => ({
  MailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
  })),
}));

describe.skip('EstoqueModule (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockLojaId = 'loja-test-123';
  const mockUserId = 'user-test-456';
  const withHeaders = (req: request.Test) =>
    req
      .set('x-internal-token', process.env.ESTOQUE_INTERNAL_API_TOKEN || 'test-internal-token')
      .set('x-loja-id', mockLojaId)
      .set('x-usuario-id', mockUserId);

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.ESTOQUE_INTERNAL_API_TOKEN = process.env.ESTOQUE_INTERNAL_API_TOKEN || 'test-internal-token';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider('MailService')
      .useValue({
        sendEmail: jest.fn().mockResolvedValue(true),
        sendWelcomeEmail: jest.fn().mockResolvedValue(true),
        sendVerificationEmail: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Limpar dados de teste
    try {
      await prismaService.$executeRaw`DELETE FROM MovimentacaoEstoque WHERE lojaId = ${mockLojaId}`;
      await prismaService.$executeRaw`DELETE FROM ItemEstoque WHERE lojaId = ${mockLojaId}`;
      await prismaService.$executeRaw`DELETE FROM LocalizacaoEstoque WHERE lojaId = ${mockLojaId}`;
    } catch (error) {
      console.log('Erro ao limpar dados de teste:', error.message);
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    try {
      await prismaService.$executeRaw`DELETE FROM MovimentacaoEstoque WHERE lojaId = ${mockLojaId}`;
      await prismaService.$executeRaw`DELETE FROM ItemEstoque WHERE lojaId = ${mockLojaId}`;
      await prismaService.$executeRaw`DELETE FROM LocalizacaoEstoque WHERE lojaId = ${mockLojaId}`;
    } catch (error) {
      console.log('Erro ao limpar dados de teste:', error.message);
    }
    await app.close();
  });

  describe('/api/estoque/health (GET)', () => {
    const withHeaders = (req: request.Test) =>
      req
        .set('x-internal-token', process.env.ESTOQUE_INTERNAL_API_TOKEN || 'test-internal-token')
        .set('x-loja-id', mockLojaId)
        .set('x-usuario-id', mockUserId);

    it('should return health status', () => {
      return withHeaders(request(app.getHttpServer()).get('/api/estoque/health'))
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('module', 'estoque');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should return module info', () => {
      return withHeaders(request(app.getHttpServer()).get('/api/estoque/health/info'))
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', 'Estoque Module');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('description');
        });
    });
  });

  describe('/api/estoque/localizacoes (POST)', () => {
    it('should create a new location', () => {
      const createLocationDto = {
        nome: 'Prateleira A1',
        descricao: 'Prateleira principal',
        tipo: 'PRATELEIRA',
        endereco: 'A1-01-01',
        capacidade: 100,
        lojaId: mockLojaId,
      };

      return withHeaders(request(app.getHttpServer()).post('/api/estoque/localizacoes'))
        .send(createLocationDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.nome).toBe(createLocationDto.nome);
          expect(res.body.lojaId).toBe(mockLojaId);
        });
    });

    it('should validate required fields', () => {
      const invalidDto = {
        descricao: 'Prateleira sem nome',
      };

      return withHeaders(request(app.getHttpServer()).post('/api/estoque/localizacoes'))
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/api/estoque/localizacoes (GET)', () => {
    it('should list locations', () => {
      return request(app.getHttpServer())
        .get('/api/estoque/localizacoes')
        .query({ lojaId: mockLojaId })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/api/estoque/itens (POST)', () => {
    it('should create a new item', async () => {
      // Primeiro criar uma localização
      const location = await withHeaders(request(app.getHttpServer()).post('/api/estoque/localizacoes'))
        .send({
          nome: 'Prateleira B1',
          descricao: 'Prateleira para itens',
          tipo: 'PRATELEIRA',
          endereco: 'B1-01-01',
          capacidade: 50,
          lojaId: mockLojaId,
        })
        .expect(201);

      const createItemDto = {
        nome: 'Produto Teste',
        descricao: 'Produto para teste',
        codigo: 'PROD001',
        categoria: 'MATERIAL',
        unidadeMedida: 'UNIDADE',
        precoUnitario: 10.5,
        quantidadeMinima: 5,
        quantidadeMaxima: 100,
        localizacaoId: location.body.id,
        lojaId: mockLojaId,
      };

      return withHeaders(request(app.getHttpServer()).post('/api/estoque/itens'))
        .send(createItemDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.nome).toBe(createItemDto.nome);
          expect(res.body.lojaId).toBe(mockLojaId);
        });
    });
  });

  describe('/api/estoque/itens (GET)', () => {
    it('should list items', () => {
      return withHeaders(request(app.getHttpServer()).get('/api/estoque/itens'))
        .query({ lojaId: mockLojaId })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/estoque/movimentacoes (POST)', () => {
    it('should create a movement', async () => {
      // Primeiro criar um item
      const item = await withHeaders(request(app.getHttpServer()).post('/api/estoque/itens'))
        .send({
          nome: 'Produto Movimento',
          descricao: 'Produto para teste de movimento',
          codigo: 'PROD002',
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 15.0,
          quantidadeMinima: 2,
          quantidadeMaxima: 50,
          lojaId: mockLojaId,
        })
        .expect(201);

      const createMovementDto = {
        itemId: item.body.id,
        tipo: 'ENTRADA',
        quantidade: 10,
        motivo: 'Compra inicial',
        observacoes: 'Movimento de teste',
        lojaId: mockLojaId,
      };

      return withHeaders(request(app.getHttpServer()).post('/api/estoque/movimentacoes'))
        .send(createMovementDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.tipo).toBe('ENTRADA');
          expect(res.body.quantidade).toBe(10);
          expect(res.body.lojaId).toBe(mockLojaId);
        });
    });
  });

  describe('/api/estoque/movimentacoes (GET)', () => {
    it('should list movements', () => {
      return withHeaders(request(app.getHttpServer()).get('/api/estoque/movimentacoes'))
        .query({ lojaId: mockLojaId })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/estoque/dashboard (GET)', () => {
    it('should return dashboard data', () => {
      return withHeaders(request(app.getHttpServer()).get('/api/estoque/dashboard'))
        .query({ lojaId: mockLojaId })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalItens');
          expect(res.body).toHaveProperty('totalLocalizacoes');
          expect(res.body).toHaveProperty('movimentacoesRecentes');
          expect(res.body).toHaveProperty('itensBaixoEstoque');
        });
    });
  });

  describe('Multi-tenant isolation', () => {
    const otherLojaId = 'loja-outra-123';

    it('should isolate data by lojaId', async () => {
      // Criar item na loja principal
      const item1 = await request(app.getHttpServer())
        .post('/api/estoque/itens')
        .send({
          nome: 'Item Loja Principal',
          descricao: 'Item da loja principal',
          codigo: 'PROD003',
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 20.0,
          quantidadeMinima: 1,
          quantidadeMaxima: 20,
          lojaId: mockLojaId,
        })
        .expect(201);

      // Criar item em outra loja
      const item2 = await request(app.getHttpServer())
        .post('/api/estoque/itens')
        .send({
          nome: 'Item Outra Loja',
          descricao: 'Item de outra loja',
          codigo: 'PROD004',
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 25.0,
          quantidadeMinima: 1,
          quantidadeMaxima: 30,
          lojaId: otherLojaId,
        })
        .expect(201);

      // Verificar isolamento - buscar itens da loja principal
      const itemsLojaPrincipal = await request(app.getHttpServer())
        .get('/api/estoque/itens')
        .query({ lojaId: mockLojaId })
        .expect(200);

      expect(itemsLojaPrincipal.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: item1.body.id }),
        ]),
      );

      expect(itemsLojaPrincipal.body).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: item2.body.id }),
        ]),
      );
    });
  });
});
