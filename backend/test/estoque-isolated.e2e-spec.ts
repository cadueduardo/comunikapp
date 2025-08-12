import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { EstoqueModule } from '../src/estoque/estoque.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('EstoqueModule Isolated (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockLojaId = 'loja-test-isolated-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [EstoqueModule],
    })
    .overrideProvider(PrismaService)
    .useValue({
      localizacaoEstoque: {
        create: jest.fn().mockResolvedValue({
          id: 'localizacao-123',
          nome: 'Prateleira A1',
          descricao: 'Prateleira principal',
          tipo: 'PRATELEIRA',
          endereco: 'A1-01-01',
          capacidade: 100,
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'localizacao-123',
            nome: 'Prateleira A1',
            descricao: 'Prateleira principal',
            tipo: 'PRATELEIRA',
            endereco: 'A1-01-01',
            capacidade: 100,
            lojaId: mockLojaId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'localizacao-123',
          nome: 'Prateleira A1',
          descricao: 'Prateleira principal',
          tipo: 'PRATELEIRA',
          endereco: 'A1-01-01',
          capacidade: 100,
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        update: jest.fn().mockResolvedValue({
          id: 'localizacao-123',
          nome: 'Prateleira A1 Atualizada',
          descricao: 'Prateleira principal atualizada',
          tipo: 'PRATELEIRA',
          endereco: 'A1-01-01',
          capacidade: 150,
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        delete: jest.fn().mockResolvedValue({
          id: 'localizacao-123',
          nome: 'Prateleira A1',
          descricao: 'Prateleira principal',
          tipo: 'PRATELEIRA',
          endereco: 'A1-01-01',
          capacidade: 100,
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      itemEstoque: {
        create: jest.fn().mockResolvedValue({
          id: 'item-123',
          nome: 'Produto Teste',
          descricao: 'Produto para teste',
          codigo: 'PROD001',
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 10.50,
          quantidadeAtual: 0,
          quantidadeMinima: 5,
          quantidadeMaxima: 100,
          localizacaoId: 'localizacao-123',
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'item-123',
            nome: 'Produto Teste',
            descricao: 'Produto para teste',
            codigo: 'PROD001',
            categoria: 'MATERIAL',
            unidadeMedida: 'UNIDADE',
            precoUnitario: 10.50,
            quantidadeAtual: 0,
            quantidadeMinima: 5,
            quantidadeMaxima: 100,
            localizacaoId: 'localizacao-123',
            lojaId: mockLojaId,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]),
        findUnique: jest.fn().mockResolvedValue({
          id: 'item-123',
          nome: 'Produto Teste',
          descricao: 'Produto para teste',
          codigo: 'PROD001',
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 10.50,
          quantidadeAtual: 0,
          quantidadeMinima: 5,
          quantidadeMaxima: 100,
          localizacaoId: 'localizacao-123',
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        update: jest.fn().mockResolvedValue({
          id: 'item-123',
          nome: 'Produto Teste Atualizado',
          descricao: 'Produto para teste atualizado',
          codigo: 'PROD001',
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 15.00,
          quantidadeAtual: 10,
          quantidadeMinima: 5,
          quantidadeMaxima: 100,
          localizacaoId: 'localizacao-123',
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        delete: jest.fn().mockResolvedValue({
          id: 'item-123',
          nome: 'Produto Teste',
          descricao: 'Produto para teste',
          codigo: 'PROD001',
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 10.50,
          quantidadeAtual: 0,
          quantidadeMinima: 5,
          quantidadeMaxima: 100,
          localizacaoId: 'localizacao-123',
          lojaId: mockLojaId,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      movimentacaoEstoque: {
        create: jest.fn().mockResolvedValue({
          id: 'movimentacao-123',
          itemId: 'item-123',
          tipo: 'ENTRADA',
          quantidade: 10,
          quantidadeAnterior: 0,
          quantidadePosterior: 10,
          motivo: 'Compra inicial',
          observacoes: 'Movimento de teste',
          lojaId: mockLojaId,
          createdAt: new Date()
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'movimentacao-123',
            itemId: 'item-123',
            tipo: 'ENTRADA',
            quantidade: 10,
            quantidadeAnterior: 0,
            quantidadePosterior: 10,
            motivo: 'Compra inicial',
            observacoes: 'Movimento de teste',
            lojaId: mockLojaId,
            createdAt: new Date()
          }
        ])
      },
      $executeRaw: jest.fn().mockResolvedValue(1)
    })
    .compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/estoque/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/api/estoque/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('module', 'estoque');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should return module info', () => {
      return request(app.getHttpServer())
        .get('/api/estoque/health/info')
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
        lojaId: mockLojaId
      };

      return request(app.getHttpServer())
        .post('/api/estoque/localizacoes')
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
        descricao: 'Prateleira sem nome'
      };

      return request(app.getHttpServer())
        .post('/api/estoque/localizacoes')
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
    it('should create a new item', () => {
      const createItemDto = {
        nome: 'Produto Teste',
        descricao: 'Produto para teste',
        codigo: 'PROD001',
        categoria: 'MATERIAL',
        unidadeMedida: 'UNIDADE',
        precoUnitario: 10.50,
        quantidadeMinima: 5,
        quantidadeMaxima: 100,
        localizacaoId: 'localizacao-123',
        lojaId: mockLojaId
      };

      return request(app.getHttpServer())
        .post('/api/estoque/itens')
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
      return request(app.getHttpServer())
        .get('/api/estoque/itens')
        .query({ lojaId: mockLojaId })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/estoque/movimentacoes (POST)', () => {
    it('should create a movement', () => {
      const createMovementDto = {
        itemId: 'item-123',
        tipo: 'ENTRADA',
        quantidade: 10,
        motivo: 'Compra inicial',
        observacoes: 'Movimento de teste',
        lojaId: mockLojaId
      };

      return request(app.getHttpServer())
        .post('/api/estoque/movimentacoes')
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
      return request(app.getHttpServer())
        .get('/api/estoque/movimentacoes')
        .query({ lojaId: mockLojaId })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/estoque/dashboard (GET)', () => {
    it('should return dashboard data', () => {
      return request(app.getHttpServer())
        .get('/api/estoque/dashboard')
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
});
