import { Test, TestingModule } from '@nestjs/testing';
import { LotesController } from './lotes.controller';
import { LotesService } from '../services/lotes.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LotesController', () => {
  let controller: LotesController;
  let lotesService: LotesService;

  const mockLotesService = {
    criarLote: jest.fn(),
    listarLotes: jest.fn(),
    buscarLotePorId: jest.fn(),
    atualizarLote: jest.fn(),
    excluirLote: jest.fn(),
    lotesProximosVencimento: jest.fn(),
    consumirLote: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotesController],
      providers: [
        {
          provide: LotesService,
          useValue: mockLotesService,
        },
      ],
    }).compile();

    controller = module.get<LotesController>(LotesController);
    lotesService = module.get<LotesService>(LotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('criarLote', () => {
    it('deve criar um lote com sucesso', async () => {
      const data = { itemId: 'item-1', quantidade: 10 } as any;
      const loja = { id: 'loja-123' } as any;
      const expected = { id: 'lote-1', ...data };
      mockLotesService.criarLote.mockResolvedValue(expected);

      const res = await controller.criarLote(loja, data);

      expect(res).toEqual({
        success: true,
        data: expected,
        message: 'Lote criado com sucesso',
      });
      expect(mockLotesService.criarLote).toHaveBeenCalledWith(
        { lojaId: loja.id },
        data,
      );
    });
  });

  describe('listarLotes', () => {
    it('deve listar lotes', async () => {
      const loja = { id: 'loja-123' } as any;
      const query = { page: 1, limit: 10 } as any;
      const expected = { data: [], total: 0, page: 1, limit: 10 };
      mockLotesService.listarLotes.mockResolvedValue(expected);

      const res = await controller.listarLotes(loja, query);

      expect(res).toEqual({
        success: true,
        data: expected,
        message: 'Lotes listados com sucesso',
      });
      expect(mockLotesService.listarLotes).toHaveBeenCalledWith(
        { lojaId: loja.id },
        query,
      );
    });
  });

  describe('buscarLote', () => {
    it('deve retornar um lote por ID', async () => {
      const loja = { id: 'loja-123' } as any;
      const id = 'lote-1';
      const expected = { id } as any;
      mockLotesService.buscarLotePorId.mockResolvedValue(expected);

      const res = await controller.buscarLote(loja, id);

      expect(res).toEqual({
        success: true,
        data: expected,
        message: 'Lote encontrado com sucesso',
      });
      expect(mockLotesService.buscarLotePorId).toHaveBeenCalledWith(
        { lojaId: loja.id },
        id,
      );
    });
  });

  describe('atualizarLote', () => {
    it('deve atualizar um lote', async () => {
      const loja = { id: 'loja-123' } as any;
      const id = 'lote-1';
      const data = { quantidade: 5 } as any;
      const expected = { id, ...data };
      mockLotesService.atualizarLote.mockResolvedValue(expected);

      const res = await controller.atualizarLote(loja, id, data);

      expect(res).toEqual({
        success: true,
        data: expected,
        message: 'Lote atualizado com sucesso',
      });
      expect(mockLotesService.atualizarLote).toHaveBeenCalledWith(
        { lojaId: loja.id },
        id,
        data,
      );
    });
  });

  describe('excluirLote', () => {
    it('deve excluir um lote', async () => {
      const loja = { id: 'loja-123' } as any;
      const id = 'lote-1';
      mockLotesService.excluirLote.mockResolvedValue({ message: 'ok' });

      const res = await controller.excluirLote(loja, id);

      expect(res).toEqual({
        success: true,
        message: 'Lote excluído com sucesso',
      });
      expect(mockLotesService.excluirLote).toHaveBeenCalledWith(
        { lojaId: loja.id },
        id,
      );
    });
  });

  describe('lotesProximosVencimento', () => {
    it('deve listar lotes próximos ao vencimento', async () => {
      const loja = { id: 'loja-123' } as any;
      const dias = '30';
      const expected = { data: [] } as any;
      mockLotesService.lotesProximosVencimento.mockResolvedValue(expected);

      const res = await controller.lotesProximosVencimento(loja, dias);

      expect(res).toEqual({
        success: true,
        data: expected,
        message: 'Lotes próximos do vencimento retornados com sucesso',
      });
      expect(mockLotesService.lotesProximosVencimento).toHaveBeenCalledWith(
        { lojaId: loja.id },
        30,
      );
    });
  });

  describe('consumirLote', () => {
    it('deve consumir quantidade do lote', async () => {
      const loja = { id: 'loja-123' } as any;
      const id = 'lote-1';
      const body = { quantidade: 2 };
      const expected = { id, quantidade: 2 } as any;
      mockLotesService.consumirLote.mockResolvedValue(expected);

      const res = await controller.consumirLote(loja, id, body as any);

      expect(res).toEqual({
        success: true,
        data: expected,
        message: 'Quantidade consumida com sucesso',
      });
      expect(mockLotesService.consumirLote).toHaveBeenCalledWith(
        { lojaId: loja.id },
        id,
        2,
      );
    });
  });
});
