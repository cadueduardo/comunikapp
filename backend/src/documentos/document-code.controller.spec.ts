import { Test, TestingModule } from '@nestjs/testing';
import { DocumentCodeController } from './document-code.controller';
import { DocumentCodeService, TipoOS } from './document-code.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('DocumentCodeController', () => {
  let controller: DocumentCodeController;
  let documentCodeService: DocumentCodeService;

  const mockDocumentCodeService = {
    gerarCodigoOSPorTipo: jest.fn(),
    validarCodigoOS: jest.fn(),
    extrairInformacoesCodigo: jest.fn(),
    verificarCodigoExistente: jest.fn(),
    obterEstatisticasNumeracao: jest.fn(),
    obterProximoNumero: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentCodeController],
      providers: [
        {
          provide: DocumentCodeService,
          useValue: mockDocumentCodeService,
        },
      ],
    }).compile();

    controller = module.get<DocumentCodeController>(DocumentCodeController);
    documentCodeService = module.get<DocumentCodeService>(DocumentCodeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarCodigoOS', () => {
    it('deve gerar código para OS Comercial', async () => {
      mockDocumentCodeService.gerarCodigoOSPorTipo.mockResolvedValue(
        'OS-2025-001',
      );

      const resultado = await controller.gerarCodigoOS({
        lojaId: 'loja-001',
        tipoOS: TipoOS.COMERCIAL,
        ano: 2025,
      });

      expect(resultado).toEqual({
        sucesso: true,
        codigo: 'OS-2025-001',
        tipo: TipoOS.COMERCIAL,
        lojaId: 'loja-001',
        ano: 2025,
      });
      expect(mockDocumentCodeService.gerarCodigoOSPorTipo).toHaveBeenCalledWith(
        'loja-001',
        TipoOS.COMERCIAL,
        2025,
      );
    });

    it('deve gerar código para OS Interna', async () => {
      mockDocumentCodeService.gerarCodigoOSPorTipo.mockResolvedValue(
        'OSI-2025-001',
      );

      const resultado = await controller.gerarCodigoOS({
        lojaId: 'loja-001',
        tipoOS: TipoOS.INTERNA,
        ano: 2025,
      });

      expect(resultado).toEqual({
        sucesso: true,
        codigo: 'OSI-2025-001',
        tipo: TipoOS.INTERNA,
        lojaId: 'loja-001',
        ano: 2025,
      });
    });

    it('deve usar ano atual quando não fornecido', async () => {
      mockDocumentCodeService.gerarCodigoOSPorTipo.mockResolvedValue(
        'OS-2025-001',
      );

      const resultado = await controller.gerarCodigoOS({
        lojaId: 'loja-001',
        tipoOS: TipoOS.COMERCIAL,
      });

      expect(resultado.ano).toBe(new Date().getFullYear());
    });

    it('deve lançar erro quando lojaId está ausente', async () => {
      await expect(
        controller.gerarCodigoOS({
          lojaId: '',
          tipoOS: TipoOS.COMERCIAL,
        }),
      ).rejects.toThrow(HttpException);
    });

    it('deve lançar erro quando tipoOS é inválido', async () => {
      await expect(
        controller.gerarCodigoOS({
          lojaId: 'loja-001',
          tipoOS: 'INVALIDO' as TipoOS,
        }),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('validarCodigoOS', () => {
    it('deve validar código válido', async () => {
      mockDocumentCodeService.validarCodigoOS.mockReturnValue({
        valido: true,
        tipo: TipoOS.COMERCIAL,
      });

      const resultado = await controller.validarCodigoOS('OS-2025-001');

      expect(resultado).toEqual({
        sucesso: true,
        codigo: 'OS-2025-001',
        valido: true,
        tipo: TipoOS.COMERCIAL,
        erro: undefined,
      });
    });

    it('deve validar código inválido', async () => {
      mockDocumentCodeService.validarCodigoOS.mockReturnValue({
        valido: false,
        erro: 'Formato inválido',
      });

      const resultado = await controller.validarCodigoOS('INVALIDO');

      expect(resultado).toEqual({
        sucesso: true,
        codigo: 'INVALIDO',
        valido: false,
        tipo: undefined,
        erro: 'Formato inválido',
      });
    });
  });

  describe('obterInformacoesCodigo', () => {
    it('deve retornar informações de código válido', async () => {
      mockDocumentCodeService.extrairInformacoesCodigo.mockReturnValue({
        tipo: TipoOS.COMERCIAL,
        ano: 2025,
        numero: 1,
      });

      const resultado = await controller.obterInformacoesCodigo('OS-2025-001');

      expect(resultado).toEqual({
        sucesso: true,
        codigo: 'OS-2025-001',
        informacoes: {
          tipo: TipoOS.COMERCIAL,
          ano: 2025,
          numero: 1,
        },
      });
    });

    it('deve lançar erro para código inválido', async () => {
      mockDocumentCodeService.extrairInformacoesCodigo.mockReturnValue(null);

      await expect(
        controller.obterInformacoesCodigo('INVALIDO'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('verificarCodigoExistente', () => {
    it('deve verificar se código existe', async () => {
      mockDocumentCodeService.verificarCodigoExistente.mockResolvedValue(true);

      const resultado = await controller.verificarCodigoExistente(
        'OS-2025-001',
        'loja-001',
      );

      expect(resultado).toEqual({
        sucesso: true,
        codigo: 'OS-2025-001',
        lojaId: 'loja-001',
        existe: true,
      });
    });

    it('deve verificar se código não existe', async () => {
      mockDocumentCodeService.verificarCodigoExistente.mockResolvedValue(false);

      const resultado = await controller.verificarCodigoExistente(
        'OS-2025-999',
        'loja-001',
      );

      expect(resultado).toEqual({
        sucesso: true,
        codigo: 'OS-2025-999',
        lojaId: 'loja-001',
        existe: false,
      });
    });
  });

  describe('obterEstatisticas', () => {
    it('deve retornar estatísticas de numeração', async () => {
      mockDocumentCodeService.obterEstatisticasNumeracao.mockResolvedValue({
        comercial: { total: 10, ultimoNumero: 10 },
        interna: { total: 5, ultimoNumero: 5 },
      });

      const resultado = await controller.obterEstatisticas('loja-001', 2025);

      expect(resultado).toEqual({
        sucesso: true,
        lojaId: 'loja-001',
        ano: 2025,
        estatisticas: {
          comercial: { total: 10, ultimoNumero: 10 },
          interna: { total: 5, ultimoNumero: 5 },
        },
      });
    });

    it('deve usar ano atual quando não fornecido', async () => {
      mockDocumentCodeService.obterEstatisticasNumeracao.mockResolvedValue({
        comercial: { total: 0, ultimoNumero: 0 },
        interna: { total: 0, ultimoNumero: 0 },
      });

      const resultado = await controller.obterEstatisticas('loja-001');

      expect(resultado.ano).toBe(new Date().getFullYear());
    });
  });

  describe('obterProximoNumero', () => {
    it('deve retornar próximo número para OS Comercial', async () => {
      mockDocumentCodeService.obterProximoNumero.mockResolvedValue(6);

      const resultado = await controller.obterProximoNumero(
        'loja-001',
        'COMERCIAL',
        2025,
      );

      expect(resultado).toEqual({
        sucesso: true,
        lojaId: 'loja-001',
        tipoOS: 'COMERCIAL',
        ano: 2025,
        proximoNumero: 6,
      });
    });

    it('deve retornar próximo número para OS Interna', async () => {
      mockDocumentCodeService.obterProximoNumero.mockResolvedValue(3);

      const resultado = await controller.obterProximoNumero(
        'loja-001',
        'INTERNA',
        2025,
      );

      expect(resultado).toEqual({
        sucesso: true,
        lojaId: 'loja-001',
        tipoOS: 'INTERNA',
        ano: 2025,
        proximoNumero: 3,
      });
    });

    it('deve lançar erro para tipoOS inválido', async () => {
      await expect(
        controller.obterProximoNumero('loja-001', 'INVALIDO', 2025),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('listarTiposOS', () => {
    it('deve retornar lista de tipos disponíveis', async () => {
      const resultado = await controller.listarTiposOS();

      expect(resultado).toEqual({
        sucesso: true,
        tipos: [
          {
            valor: TipoOS.COMERCIAL,
            label: 'Comercial',
            prefixo: 'OS',
            formato: 'OS-AAAA-NNN',
          },
          {
            valor: TipoOS.INTERNA,
            label: 'Interna',
            prefixo: 'OSI',
            formato: 'OSI-AAAA-NNN',
          },
        ],
      });
    });
  });
});
