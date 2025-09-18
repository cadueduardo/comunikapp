// ===== SETUP PARA TESTES DO MÓDULO CATÁLOGO DE INSUMOS =====

// Mock global do Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $on: jest.fn(),
    $queryRaw: jest.fn(),
  })),
}));

// Mock do ConfigService
jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue('mock-database-url'),
  })),
}));

// Configurações globais para testes
process.env.NODE_ENV = 'test';
process.env.CATALOGO_INSUMOS_DATABASE_URL = 'mock://test-database';
