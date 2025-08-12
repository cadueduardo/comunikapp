import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Mock do MailService para evitar problemas de dependência
jest.mock('../src/mail/mail.service', () => ({
  MailService: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendVerificationEmail: jest.fn().mockResolvedValue(true),
  })),
}));

describe('EstoqueModule Performance (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockLojaId = 'loja-perf-test-123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
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

  describe('Performance Tests', () => {
    it('should load dashboard within 3 seconds', async () => {
      const startTime = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/estoque/dashboard')
        .query({ lojaId: mockLojaId })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(3000); // 3 segundos
    });

    it('should handle bulk item creation efficiently', async () => {
      const items = [];
      const startTime = Date.now();

      // Criar 50 itens em lote
      for (let i = 1; i <= 50; i++) {
        const item = {
          nome: `Produto Performance ${i}`,
          descricao: `Produto para teste de performance ${i}`,
          codigo: `PERF${i.toString().padStart(3, '0')}`,
          categoria: 'MATERIAL',
          unidadeMedida: 'UNIDADE',
          precoUnitario: 10.00 + i,
          quantidadeMinima: 1,
          quantidadeMaxima: 100,
          lojaId: mockLojaId
        };

        const response = await request(app.getHttpServer())
          .post('/api/estoque/itens')
          .send(item)
          .expect(201);

        items.push(response.body);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerItem = totalTime / 50;

      expect(totalTime).toBeLessThan(10000); // 10 segundos para 50 itens
      expect(avgTimePerItem).toBeLessThan(200); // 200ms por item
    });

    it('should list items efficiently with pagination', async () => {
      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .get('/api/estoque/itens')
        .query({ 
          lojaId: mockLojaId,
          page: 1,
          limit: 20
        })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(1000); // 1 segundo
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const promises = [];

      const startTime = Date.now();

      // Executar 10 requisições simultâneas
      for (let i = 0; i < concurrentRequests; i++) {
        const promise = request(app.getHttpServer())
          .get('/api/estoque/health')
          .expect(200);
        
        promises.push(promise);
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / concurrentRequests;

      expect(totalTime).toBeLessThan(5000); // 5 segundos para 10 requisições
      expect(avgTimePerRequest).toBeLessThan(500); // 500ms por requisição
    });

    it('should handle large dataset queries efficiently', async () => {
      // Criar dados de teste em massa
      const locations = [];
      for (let i = 1; i <= 20; i++) {
        const location = await request(app.getHttpServer())
          .post('/api/estoque/localizacoes')
          .send({
            nome: `Localização ${i}`,
            descricao: `Localização para teste ${i}`,
            tipo: 'PRATELEIRA',
            endereco: `A${i}-01-01`,
            capacidade: 100,
            lojaId: mockLojaId
          })
          .expect(201);
        
        locations.push(location.body);
      }

      const startTime = Date.now();

      // Buscar todas as localizações
      const response = await request(app.getHttpServer())
        .get('/api/estoque/localizacoes')
        .query({ lojaId: mockLojaId })
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(responseTime).toBeLessThan(2000); // 2 segundos
      expect(response.body.length).toBeGreaterThanOrEqual(20);
    });

    it('should maintain performance under load', async () => {
      const loadTestDuration = 5000; // 5 segundos
      const requestsPerSecond = 5;
      const totalRequests = Math.floor(loadTestDuration / 1000) * requestsPerSecond;
      
      const startTime = Date.now();
      const promises = [];
      const responseTimes = [];

      // Simular carga por 5 segundos
      for (let i = 0; i < totalRequests; i++) {
        const requestStart = Date.now();
        
        const promise = request(app.getHttpServer())
          .get('/api/estoque/health')
          .expect(200)
          .then(() => {
            const requestEnd = Date.now();
            responseTimes.push(requestEnd - requestStart);
          });
        
        promises.push(promise);
        
        // Aguardar 200ms entre requisições (5 req/s)
        if (i < totalRequests - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      await Promise.all(promises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(totalTime).toBeLessThan(loadTestDuration + 2000); // +2s de tolerância
      expect(avgResponseTime).toBeLessThan(1000); // 1 segundo média
      expect(maxResponseTime).toBeLessThan(3000); // 3 segundos máximo
    });
  });
});
