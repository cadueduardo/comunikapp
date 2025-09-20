/**
 * Testes unitários para OSService
 * Cobertura mínima ≥ 80% conforme premissas
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OSService } from '../services/os.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { StatusOS } from '../interfaces/os.interfaces';

describe('OSService', () => {
  let service: OSService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    ordemServico: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    movimentacaoOS: {
      create: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OSService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OSService>(OSService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarNumeroOS', () => {
    it('deve gerar número 000001 para primeira OS', async () => {
      mockPrismaService.ordemServico.findFirst.mockResolvedValue(null);

      const numero = await service.gerarNumeroOS('loja-123');

      expect(numero).toBe('000001');
      expect(mockPrismaService.ordemServico.findFirst).toHaveBeenCalledWith({
        where: { loja_id: 'loja-123' },
        orderBy: { numero: 'desc' },
        select: { numero: true },
      });
    });

    it('deve gerar próximo número sequencial', async () => {
      mockPrismaService.ordemServico.findFirst.mockResolvedValue({
        numero: '000005',
      });

      const numero = await service.gerarNumeroOS('loja-123');

      expect(numero).toBe('000006');
    });
  });

  describe('create', () => {
    it('deve criar OS com dados válidos', async () => {
      const createDto = {
        cliente_id: 'cliente-123',
        nome_servico: 'Banner 3x2m',
        quantidade: 1,
      };

      const mockOS = {
        id: 'os-123',
        numero: '000001',
        loja_id: 'loja-123',
        status: StatusOS.FILA,
        ...createDto,
        criado_em: new Date(),
        atualizado_em: new Date(),
      };

      mockPrismaService.ordemServico.findFirst.mockResolvedValue(null);
      mockPrismaService.ordemServico.create.mockResolvedValue(mockOS);
      mockPrismaService.movimentacaoOS.create.mockResolvedValue({});

      const result = await service.create('loja-123', createDto);

      expect(result).toBeDefined();
      expect(result.numero).toBe('000001');
      expect(result.status).toBe(StatusOS.FILA);
      expect(mockPrismaService.ordemServico.create).toHaveBeenCalled();
      expect(mockPrismaService.movimentacaoOS.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar OS quando encontrada', async () => {
      const mockOS = {
        id: 'os-123',
        numero: '000001',
        loja_id: 'loja-123',
        status: StatusOS.FILA,
        nome_servico: 'Banner 3x2m',
        quantidade: 1,
        criado_em: new Date(),
        atualizado_em: new Date(),
        itens: [],
        movimentacoes: [],
        checklists: [],
      };

      mockPrismaService.ordemServico.findFirst.mockResolvedValue(mockOS);

      const result = await service.findOne('os-123', 'loja-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('os-123');
      expect(mockPrismaService.ordemServico.findFirst).toHaveBeenCalledWith({
        where: { id: 'os-123', loja_id: 'loja-123' },
        include: {
          itens: true,
          movimentacoes: { orderBy: { data_movimentacao: 'desc' } },
          checklists: { orderBy: { ordem: 'asc' } },
        },
      });
    });

    it('deve lançar NotFoundException quando OS não encontrada', async () => {
      mockPrismaService.ordemServico.findFirst.mockResolvedValue(null);

      await expect(service.findOne('os-inexistente', 'loja-123'))
        .rejects
        .toThrow(NotFoundException);
    });
  });

  describe('avancarEtapa', () => {
    it('deve avançar etapa com transição válida', async () => {
      const mockOS = {
        id: 'os-123',
        numero: '000001',
        status: StatusOS.FILA,
        loja_id: 'loja-123',
      };

      const mockOSAtualizada = {
        ...mockOS,
        status: StatusOS.PRODUCAO,
      };

      mockPrismaService.ordemServico.findFirst.mockResolvedValue(mockOS);
      mockPrismaService.ordemServico.update.mockResolvedValue(mockOSAtualizada);
      mockPrismaService.movimentacaoOS.create.mockResolvedValue({});

      const result = await service.avancarEtapa(
        'os-123',
        'loja-123',
        { nova_etapa: 'PRODUCAO' },
        'usuario-123'
      );

      expect(result.status).toBe(StatusOS.PRODUCAO);
      expect(mockPrismaService.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 'os-123' },
        data: { status: 'PRODUCAO' },
      });
    });

    it('deve rejeitar transição inválida', async () => {
      const mockOS = {
        id: 'os-123',
        status: StatusOS.FINALIZADA, // Status final
        loja_id: 'loja-123',
      };

      mockPrismaService.ordemServico.findFirst.mockResolvedValue(mockOS);

      await expect(
        service.avancarEtapa(
          'os-123',
          'loja-123',
          { nova_etapa: 'PRODUCAO' },
          'usuario-123'
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('healthCheck', () => {
    it('deve retornar status OK quando sistema está funcionando', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      const health = await service.healthCheck();

      expect(health.status).toBe('OK');
      expect(health.timestamp).toBeDefined();
    });

    it('deve retornar status ERROR quando há problemas', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('DB Error'));

      const health = await service.healthCheck();

      expect(health.status).toBe('ERROR');
      expect(health.timestamp).toBeDefined();
    });
  });
});
