import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  EstoqueSimpleService,
  IEstoqueContext,
} from './estoque-simple.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('EstoqueSimpleService', () => {
  let service: EstoqueSimpleService;
  let prismaService: PrismaService;

  const mockContext: IEstoqueContext = {
    lojaId: 'loja-123',
    usuarioId: 'user-456',
  };

  const mockPrismaService: any = {
    $executeRaw: jest.fn().mockResolvedValue({ affectedRows: 1 }),
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRawUnsafe: jest.fn().mockResolvedValue({ affectedRows: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EstoqueSimpleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EstoqueSimpleService>(EstoqueSimpleService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Defaults dos mocks de Prisma para cobrir os cenários dos testes
    mockPrismaService.$queryRaw.mockImplementation((strings: any, ...vals: any[]) => {
      const sql = Array.isArray(strings) ? strings.join(' ') : strings;
      if (typeof sql === 'string' && sql.includes('COUNT(*)')) {
        return Promise.resolve([{ total: 1 }]);
      }
      if (typeof sql === 'string' && sql.includes("FROM information_schema.tables")) {
        return Promise.resolve([{ table_name: 'itens_estoque' }]);
      }
      if (typeof sql === 'string' && sql.includes('FROM localizacoes')) {
        return Promise.resolve([
          {
            id: 'loc-123',
            loja_id: mockContext.lojaId,
            codigo: 'DEP01-COR01-P001',
            deposito: 'Depósito Principal',
            corredor: 'Corredor 01',
            prateleira: 'Prateleira 01',
            nivel: 'Nível A',
            posicao: 'Posição 001',
            descricao: 'Localização de exemplo',
            capacidade: 100,
            ativo: 1,
            criado_em: new Date(),
            atualizado_em: new Date(),
          },
        ]);
      }
      if (typeof sql === 'string' && sql.includes('FROM movimentacoes_estoque')) {
        return Promise.resolve([
          {
            id: 'mov-123',
            item_id: 'item-123',
            tipo: 'ENTRADA',
            quantidade: 50,
            quantidade_anterior: 100,
            quantidade_atual: 150,
            documento_referencia: 'DOC-001',
            responsavel: mockContext.usuarioId,
            loja_id: mockContext.lojaId,
            criado_em: new Date(),
            observacoes: 'Entrada de material',
            insumoNome: 'Material de Construção',
            localizacaoCodigo: 'DEP01-COR01-P001',
          },
        ]);
      }
      if (typeof sql === 'string' && sql.includes('FROM itens_estoque')) {
        return Promise.resolve([
          {
            id: 'item-123',
            insumoId: 'insumo-123',
            localizacao_id: 'loc-123',
            nome: 'Item X',
            quantidade: 100,
            quantidadeReservada: 0,
            estoque_minimo: 10,
            estoque_maximo: 200,
            unidade_medida: 'un',
            preco_unitario: 0,
            dataUltimaMov: new Date(),
            criado_em: new Date(),
            codigo: 'ITEM-001',
            descricao: 'desc',
            codigoBarras: '123',
            lote: null,
            dataValidade: null,
            observacoes: null,
            ativo: 1,
            localizacaoCodigo: 'DEP01-COR01-P001',
          },
        ]);
      }
      return Promise.resolve([{ ok: 1 }]);
    });

    mockPrismaService.$queryRawUnsafe.mockImplementation((sql: string, ...vals: any[]) => {
      if (typeof sql === 'string' && sql.includes('SELECT COUNT(*) as total')) {
        return Promise.resolve([{ total: 1 }]);
      }
      if (typeof sql === 'string' && sql.includes('information_schema.COLUMNS')) {
        return Promise.resolve([
          { COLUMN_NAME: 'insumo_id' },
          { COLUMN_NAME: 'unidade_medida' },
          { COLUMN_NAME: 'preco_unitario' },
          { COLUMN_NAME: 'localizacao_id' },
          { COLUMN_NAME: 'quantidade' },
        ]);
      }
      if (typeof sql === 'string' && sql.includes('SELECT * FROM itens_estoque WHERE id')) {
        return Promise.resolve([
          {
            id: vals?.[0] || 'item-123',
            insumoId: 'insumo-123',
            localizacaoId: 'loc-123',
            nome: 'Item X',
            quantidadeAtual: 100,
            quantidadeReservada: 0,
            estoqueMinimo: 10,
            estoqueMaximo: 200,
            unidadeMedida: 'un',
            precoUnitario: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);
      }
      if (typeof sql === 'string' && sql.includes('FROM itens_estoque')) {
        return Promise.resolve([
          {
            id: 'item-123',
            insumoId: 'insumo-123',
            localizacao_id: 'loc-123',
            nome: 'Item X',
            quantidade: 100,
            quantidadeReservada: 0,
            estoque_minimo: 10,
            estoque_maximo: 200,
            unidade_medida: 'un',
            preco_unitario: 0,
            dataUltimaMov: new Date(),
            criado_em: new Date(),
            codigo: 'ITEM-001',
            descricao: 'desc',
            codigoBarras: '123',
            lote: null,
            dataValidade: null,
            observacoes: null,
            ativo: 1,
            localizacaoCodigo: 'DEP01-COR01-P001',
          },
        ]);
      }
      if (typeof sql === 'string' && sql.includes('FROM localizacoes')) {
        return Promise.resolve([{ id: 'loc-123' }]);
      }
      return Promise.resolve([]);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateContext', () => {
    it('should throw BadRequestException when lojaId is missing', () => {
      const invalidContext = { usuarioId: 'user-123' };

      expect(() => {
        service['validateContext'](invalidContext as IEstoqueContext);
      }).toThrow(BadRequestException);
    });

    it('should throw BadRequestException when context is null', () => {
      expect(() => {
        service['validateContext'](null as any);
      }).toThrow(BadRequestException);
    });

    it('should not throw when context is valid', () => {
      expect(() => {
        service['validateContext'](mockContext);
      }).not.toThrow();
    });
  });

  describe('criarLocalizacao', () => {
    it('should create a location successfully', async () => {
      const locationData = {
        codigo: 'DEP01-COR01-P001',
        deposito: 'Depósito Principal',
        corredor: 'Corredor 01',
        prateleira: 'Prateleira 01',
        nivel: 'Nível A',
        posicao: 'Posição 001',
        descricao: 'Localização de exemplo',
        capacidade: 100,
      };

      const expectedResult = {
        id: 'loc-123',
        ...locationData,
        ativo: true,
        lojaId: mockContext.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.criarLocalizacao(mockContext, locationData);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^loc-\d+$/);
      expect(result.codigo).toBe(locationData.codigo);
      expect(result.deposito).toBe(locationData.deposito);
      expect((result as any).lojaId ?? (result as any).loja_id).toBe(
        mockContext.lojaId,
      );
      expect(result).toHaveProperty('ativo');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('should throw BadRequestException when context is invalid', async () => {
      const invalidContext = { usuarioId: 'user-123' };
      const locationData = { codigo: 'TEST', deposito: 'Test' };

      await expect(
        service.criarLocalizacao(
          invalidContext as IEstoqueContext,
          locationData,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listarLocalizacoes', () => {
    it('should return paginated locations list', async () => {
      const query = { page: 1, limit: 10 };

      const expectedResult = {
        data: [
          {
            id: 'loc-1',
            codigo: 'DEP01-COR01-P001',
            deposito: 'Depósito Principal',
            corredor: 'Corredor 01',
            prateleira: 'Prateleira 01',
            nivel: 'Nível A',
            posicao: 'Posição 001',
            descricao: 'Localização de exemplo',
            capacidade: 100,
            ativo: true,
            lojaId: mockContext.lojaId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: query.page || 1,
        limit: query.limit || 20,
      };

      const result = await service.listarLocalizacoes(mockContext, query);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(query.page);
      expect(result.limit).toBe(query.limit);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('codigo');
      expect(
        (result.data[0] as any).lojaId ?? (result.data[0] as any).loja_id,
      ).toBe(mockContext.lojaId);
    });

    it('should use default pagination when query is not provided', async () => {
      const result = await service.listarLocalizacoes(mockContext);

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should throw BadRequestException when context is invalid', async () => {
      const invalidContext = { usuarioId: 'user-123' };

      await expect(
        service.listarLocalizacoes(invalidContext as IEstoqueContext),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('criarItemEstoque', () => {
    it('should create a stock item successfully', async () => {
      const itemData: any = {
        insumoId: 'insumo-123',
        localizacaoId: 'loc-123',
        nome: 'Item X',
        quantidadeAtual: 100,
        quantidadeReservada: 0,
        unidadeMedida: 'un',
        precoUnitario: 0,
        estoqueMinimo: 10,
        estoqueMaximo: 200,
      };

      const expectedResult = {
        id: 'item-123',
        ...itemData,
        quantidadeReservada: 0,
        lojaId: mockContext.lojaId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await service.criarItemEstoque(mockContext, itemData);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^item-\d+$/);
      expect(result.insumoId).toBe(itemData.insumoId);
      expect(result.localizacaoId).toBe(itemData.localizacaoId);
      expect(result.quantidadeAtual).toBe(itemData.quantidadeAtual);
      expect(result.quantidadeReservada).toBe(0);
      expect(result.estoqueMinimo).toBe(itemData.estoqueMinimo);
      expect(result.estoqueMaximo).toBe(itemData.estoqueMaximo);
      expect(result.lojaId).toBe(mockContext.lojaId);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should use default values when optional fields are not provided', async () => {
      const itemData = {
        insumoId: 'insumo-123',
        localizacaoId: 'loc-123',
      };

      const result = await service.criarItemEstoque(mockContext, itemData);

      expect(result.quantidadeAtual).toBe(0);
      expect(result.quantidadeReservada).toBe(0);
      expect(result.estoqueMinimo).toBe(0);
      expect(result.estoqueMaximo).toBeNull();
    });

    it('should throw BadRequestException when context is invalid', async () => {
      const invalidContext = { usuarioId: 'user-123' };
      const itemData: any = { insumoId: 'insumo-123', localizacaoId: 'loc-123' };

      await expect(
        service.criarItemEstoque(invalidContext as IEstoqueContext, itemData),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listarItensEstoque', () => {
    it('should return paginated stock items list', async () => {
      const query = { page: 1, limit: 10 };

      const expectedResult = {
        data: [
          {
            id: 'item-1',
            insumoId: 'insumo-123',
            localizacaoId: 'loc-123',
            quantidadeAtual: 100,
            quantidadeReservada: 0,
            estoqueMinimo: 10,
            estoqueMaximo: 200,
            lojaId: mockContext.lojaId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        total: 1,
        page: query.page || 1,
        limit: query.limit || 20,
      };

      const result = await service.listarItensEstoque(mockContext, query);

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(query.page);
      expect(result.limit).toBe(query.limit);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('insumoId');
      expect(result.data[0]).toHaveProperty('localizacaoId');
      expect(result.data[0].lojaId).toBe(mockContext.lojaId);
    });

    it('should throw BadRequestException when context is invalid', async () => {
      const invalidContext = { usuarioId: 'user-123' };

      await expect(
        service.listarItensEstoque(invalidContext as IEstoqueContext),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('criarMovimentacao', () => {
    it('should create a movement successfully', async () => {
      const movementData: any = {
        estoqueId: 'estoque-123',
        tipo: 'ENTRADA',
        quantidade: 50,
        documentoRef: 'DOC-001',
        observacoes: 'Entrada de material',
      };

      const expectedResult = {
        id: 'mov-123',
        ...movementData,
        usuarioId: mockContext.usuarioId,
        lojaId: mockContext.lojaId,
        dataMovimentacao: new Date(),
      };

      const result = await service.criarMovimentacao(mockContext, movementData);

      expect(result).toBeDefined();
      expect(result.id).toMatch(/^mov-\d+$/);
      expect(result.estoqueId).toBe(movementData.estoqueId);
      expect(result.tipo).toBe(movementData.tipo);
      expect(result.quantidade).toBe(movementData.quantidade);
      expect(result.documentoRef).toBe(movementData.documentoRef);
      expect(result.observacoes).toBe(movementData.observacoes);
      expect(result.usuarioId).toBe(mockContext.usuarioId);
      expect(result.lojaId).toBe(mockContext.lojaId);
      expect(result.dataMovimentacao).toBeInstanceOf(Date);
    });

    it('should throw BadRequestException when context is invalid', async () => {
      const invalidContext = { usuarioId: 'user-123' };
      const movementData = {
        estoqueId: 'estoque-123',
        tipo: 'ENTRADA',
        quantidade: 50,
      };

      await expect(
        service.criarMovimentacao(
          invalidContext as IEstoqueContext,
          movementData,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('obterDashboard', () => {
    it('should return dashboard data successfully', async () => {
      const expectedResult = {
        totalLocalizacoes: 25,
        totalItens: 150,
        totalMovimentacoes: 500,
        itensAbaixoMinimo: 5,
        valorTotalEstoque: 125000.5,
        ultimasMovimentacoes: [
          {
            id: 'mov-123',
            tipo: 'ENTRADA',
            quantidade: 50,
            dataMovimentacao: new Date(),
          },
        ],
        estatisticas: {
          entradas: 300,
          saidas: 150,
          ajustes: 30,
          transferencias: 20,
        },
      };

      const result = await service.obterDashboard(mockContext);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('totalItens');
      expect(result).toHaveProperty('totalLocalizacoes');
      expect(result).toHaveProperty('itensAbaixoMinimo');
      expect(result).toHaveProperty('valorTotalEstoque');
      expect(result).toHaveProperty('ultimasMovimentacoes');
      expect(result).toHaveProperty('estatisticas');
      expect(result.ultimasMovimentacoes).toBeInstanceOf(Array);
      expect(result.estatisticas).toBeInstanceOf(Object);
    });

    it('should throw BadRequestException when context is invalid', async () => {
      const invalidContext = { usuarioId: 'user-123' };

      await expect(
        service.obterDashboard(invalidContext as IEstoqueContext),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const result = await service.healthCheck();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('module');
      expect(['ok', 'unhealthy']).toContain((result as any).status);
    });
  });
});
