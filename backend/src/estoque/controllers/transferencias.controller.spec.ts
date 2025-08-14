import { Test, TestingModule } from '@nestjs/testing';
import { TransferenciasController } from './transferencias.controller';
import { TransferenciasService } from '../services/transferencias.service';
import { BadRequestException } from '@nestjs/common';

describe('TransferenciasController', () => {
  let controller: TransferenciasController;
  let transferenciasService: TransferenciasService;

  const mockTransferenciasService = {
    criarTransferencia: jest.fn(),
    listarTransferencias: jest.fn(),
    buscarTransferenciaPorId: jest.fn(),
    listarHistoricoPorItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransferenciasController],
      providers: [
        {
          provide: TransferenciasService,
          useValue: mockTransferenciasService,
        },
      ],
    }).compile();

    controller = module.get<TransferenciasController>(TransferenciasController);
    transferenciasService = module.get<TransferenciasService>(TransferenciasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('criarTransferencia', () => {
    it('deve criar transferência', async () => {
      const loja = { id: 'loja-123' } as any;
      const body = {
        itemId: 'item-1',
        localizacaoOrigemId: 'loc-1',
        localizacaoDestinoId: 'loc-2',
        quantidade: 3,
      } as any;
      const expected = { id: 'tr-1', ...body } as any;
      mockTransferenciasService.criarTransferencia.mockResolvedValue(expected);

      const res = await controller.criarTransferencia(loja, body);

      expect(res).toEqual({ success: true, data: expected, message: 'Transferência criada com sucesso' });
      expect(mockTransferenciasService.criarTransferencia).toHaveBeenCalledWith({ lojaId: loja.id }, body);
    });
  });

  describe('listarTransferencias', () => {
    it('deve listar transferências', async () => {
      const loja = { id: 'loja-123' } as any;
      const query = { page: 1, limit: 10 } as any;
      const expected = { data: [], total: 0, page: 1, limit: 10 };
      mockTransferenciasService.listarTransferencias.mockResolvedValue(expected);

      const res = await controller.listarTransferencias(loja, query);

      expect(res).toEqual({ success: true, data: expected, message: 'Transferências listadas com sucesso' });
      expect(mockTransferenciasService.listarTransferencias).toHaveBeenCalledWith({ lojaId: loja.id }, query);
    });
  });

  describe('buscarTransferencia', () => {
    it('deve buscar transferência por id', async () => {
      const loja = { id: 'loja-123' } as any;
      const id = 'tr-1';
      const expected = { id } as any;
      mockTransferenciasService.buscarTransferenciaPorId.mockResolvedValue(expected);

      const res = await controller.buscarTransferencia(loja, id);

      expect(res).toEqual({ success: true, data: expected, message: 'Transferência encontrada com sucesso' });
      expect(mockTransferenciasService.buscarTransferenciaPorId).toHaveBeenCalledWith({ lojaId: loja.id }, id);
    });
  });

  describe('historicoTransferenciasItem', () => {
    it('deve listar histórico por item', async () => {
      const loja = { id: 'loja-123' } as any;
      const itemId = 'item-1';
      const expected = { data: [] } as any;
      mockTransferenciasService.listarHistoricoPorItem.mockResolvedValue(expected);

      const res = await controller.historicoTransferenciasItem(loja, itemId);

      expect(res).toEqual({ success: true, data: expected, message: 'Histórico de transferências retornado com sucesso' });
      expect(mockTransferenciasService.listarHistoricoPorItem).toHaveBeenCalledWith({ lojaId: loja.id }, itemId);
    });
  });
});


