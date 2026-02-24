import { Test, TestingModule } from '@nestjs/testing';
import { ImpressaoOSController } from '../impressao-os.controller';
import {
  ImpressaoOSService,
  ConfiguracaoImpressao,
} from '../../services/impressao-os.service';
import { HttpException, HttpStatus } from '@nestjs/common';

// Mock do ImpressaoOSService
const mockImpressaoOSService = {
  gerarDadosImpressao: jest.fn(),
  gerarTemplateHTML: jest.fn(),
};

describe('ImpressaoOSController', () => {
  let controller: ImpressaoOSController;
  let impressaoOSService: ImpressaoOSService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImpressaoOSController],
      providers: [
        {
          provide: ImpressaoOSService,
          useValue: mockImpressaoOSService,
        },
      ],
    }).compile();

    controller = module.get<ImpressaoOSController>(ImpressaoOSController);
    impressaoOSService = module.get<ImpressaoOSService>(ImpressaoOSService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('imprimirOS', () => {
    it('deve gerar template HTML para impressão', async () => {
      const osId = 'os-123';
      const mockDados = {
        os: { numero: 'OS-2024-001' },
        cliente: { nome: 'Cliente Teste' },
        loja: { nome: 'Loja Teste' },
        orcamento: null,
        produtos: [],
        insumos: [],
        maquinas: [],
        servicosManuais: [],
        dadosTransformados: null,
        qrCodeDataUrl: 'data:image/png;base64,mock-qr',
      };
      const mockHTML = '<html>Template HTML preview-mode</html>';

      mockImpressaoOSService.gerarDadosImpressao.mockResolvedValue(mockDados);
      mockImpressaoOSService.gerarTemplateHTML.mockResolvedValue(mockHTML);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.imprimirOS(
        osId,
        'html',
        'simples',
        'true',
        'true',
        'true',
        mockRes,
      );

      expect(mockImpressaoOSService.gerarDadosImpressao).toHaveBeenCalledWith(
        osId,
        {
          formato: 'html',
          versao: 'simples',
          incluirQRCode: true,
          incluirLogo: true,
          incluirDetalhesTecnicos: true,
        },
      );
      expect(mockImpressaoOSService.gerarTemplateHTML).toHaveBeenCalledWith(
        mockDados,
        {
          formato: 'html',
          versao: 'simples',
          incluirQRCode: true,
          incluirLogo: true,
          incluirDetalhesTecnicos: true,
        },
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/html; charset=utf-8',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="OS-OS-2024-001.html"',
      );
      expect(mockRes.send).toHaveBeenCalledWith(mockHTML);
    });

    it('deve usar configurações padrão quando parâmetros não fornecidos', async () => {
      const osId = 'os-123';
      const mockDados = {
        os: { numero: 'OS-2024-001' },
        cliente: { nome: 'Cliente Teste' },
        loja: { nome: 'Loja Teste' },
        orcamento: null,
        produtos: [],
        insumos: [],
        maquinas: [],
        servicosManuais: [],
        dadosTransformados: null,
        qrCodeDataUrl: '',
      };
      const mockHTML = '<html>Template HTML preview-mode</html>';

      mockImpressaoOSService.gerarDadosImpressao.mockResolvedValue(mockDados);
      mockImpressaoOSService.gerarTemplateHTML.mockResolvedValue(mockHTML);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.imprimirOS(
        osId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        mockRes,
      );

      expect(mockImpressaoOSService.gerarDadosImpressao).toHaveBeenCalledWith(
        osId,
        {
          formato: 'html',
          versao: 'simples',
          incluirQRCode: true,
          incluirLogo: true,
          incluirDetalhesTecnicos: true,
        },
      );
    });

    it('deve converter parâmetros string para boolean corretamente', async () => {
      const osId = 'os-123';
      const mockDados = {
        os: { numero: 'OS-2024-001' },
        cliente: { nome: 'Cliente Teste' },
        loja: { nome: 'Loja Teste' },
        orcamento: null,
        produtos: [],
        insumos: [],
        maquinas: [],
        servicosManuais: [],
        dadosTransformados: null,
        qrCodeDataUrl: '',
      };
      const mockHTML = '<html>Template HTML preview-mode</html>';

      mockImpressaoOSService.gerarDadosImpressao.mockResolvedValue(mockDados);
      mockImpressaoOSService.gerarTemplateHTML.mockResolvedValue(mockHTML);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.imprimirOS(
        osId,
        'html',
        'simples',
        'false',
        'false',
        'false',
        mockRes,
      );

      expect(mockImpressaoOSService.gerarDadosImpressao).toHaveBeenCalledWith(
        osId,
        {
          formato: 'html',
          versao: 'simples',
          incluirQRCode: false,
          incluirLogo: false,
          incluirDetalhesTecnicos: false,
        },
      );
    });

    it('deve lançar HttpException em caso de erro', async () => {
      const osId = 'os-123';
      const errorMessage = 'OS não encontrada';

      mockImpressaoOSService.gerarDadosImpressao.mockRejectedValue(
        new Error(errorMessage),
      );

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await expect(
        controller.imprimirOS(
          osId,
          'html',
          'simples',
          'true',
          'true',
          'true',
          mockRes,
        ),
      ).rejects.toThrow(HttpException);

      try {
        await controller.imprimirOS(
          osId,
          'html',
          'simples',
          'true',
          'true',
          'true',
          mockRes,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toContain('Erro ao gerar impressão da OS');
        expect(error.message).toContain(errorMessage);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('previewImpressao', () => {
    it('deve gerar preview do template', async () => {
      const osId = 'os-123';
      const mockDados = {
        os: { numero: 'OS-2024-001' },
        cliente: { nome: 'Cliente Teste' },
        loja: { nome: 'Loja Teste' },
        orcamento: null,
        produtos: [],
        insumos: [],
        maquinas: [],
        servicosManuais: [],
        dadosTransformados: null,
        qrCodeDataUrl: '',
      };
      const mockHTML = '<html>Template HTML preview-mode</html>';

      mockImpressaoOSService.gerarDadosImpressao.mockResolvedValue(mockDados);
      mockImpressaoOSService.gerarTemplateHTML.mockResolvedValue(mockHTML);

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.previewImpressao(osId, 'true', 'true', 'true', mockRes);

      expect(mockImpressaoOSService.gerarDadosImpressao).toHaveBeenCalledWith(
        osId,
        {
          formato: 'html',
          versao: 'simples',
          incluirQRCode: true,
          incluirLogo: true,
          incluirDetalhesTecnicos: true,
        },
      );
      expect(mockImpressaoOSService.gerarTemplateHTML).toHaveBeenCalledWith(
        mockDados,
        {
          formato: 'html',
          versao: 'simples',
          incluirQRCode: true,
          incluirLogo: true,
          incluirDetalhesTecnicos: true,
        },
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/html; charset=utf-8',
      );
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('preview-mode'),
      );
    });

    it('deve lançar HttpException em caso de erro no preview', async () => {
      const osId = 'os-123';
      const errorMessage = 'Erro no preview';

      mockImpressaoOSService.gerarDadosImpressao.mockRejectedValue(
        new Error(errorMessage),
      );

      const mockRes = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await expect(
        controller.previewImpressao(osId, 'true', 'true', 'true', mockRes),
      ).rejects.toThrow(HttpException);

      try {
        await controller.previewImpressao(
          osId,
          'true',
          'true',
          'true',
          mockRes,
        );
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toContain('Erro ao gerar preview da impressão');
        expect(error.message).toContain(errorMessage);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('obterDadosImpressao', () => {
    it('deve retornar dados estruturados da OS', async () => {
      const osId = 'os-123';
      const mockDados = {
        os: {
          id: 'os-123',
          numero: 'OS-2024-001',
          data_abertura: new Date('2024-01-01'),
          data_prazo: new Date('2024-01-10'),
          status: 'FILA',
          nome_servico: 'Banner Teste',
          quantidade: 5,
          observacoes: 'Teste',
          aprovacao_tecnica_status: 'PENDENTE',
          aprovacao_tecnica_por: null,
          aprovacao_tecnica_em: null,
          data_instalacao_agendada: null,
        },
        cliente: {
          nome: 'Cliente Teste',
          documento: '12345678901',
          telefone: '11999999999',
          email: 'cliente@teste.com',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234567',
        },
        loja: {
          nome: 'Loja Teste',
          endereco: 'Rua Loja, 456',
          cidade: 'São Paulo',
          estado: 'SP',
        },
        orcamento: null,
        produtos: [],
        insumos: [
          {
            insumo: { nome: 'Material 1' },
            quantidade: 10,
            unidade: 'm²',
            observacoes: 'Observação teste',
          },
        ],
        maquinas: [],
        servicosManuais: [],
        dadosTransformados: {
          materiaisPrincipais: [
            { nome: 'Material 1', quantidade: 10, unidade: 'm²' },
          ],
          tipoImpressao: { tipo: 'Digital' },
          acabamentos: [{ nome: 'Acabamento 1' }],
          instalacaoNecessaria: false,
        },
        qrCodeDataUrl: 'data:image/png;base64,mock-qr',
      };

      mockImpressaoOSService.gerarDadosImpressao.mockResolvedValue(mockDados);

      const resultado = await controller.obterDadosImpressao(
        osId,
        'true',
        'true',
        'true',
      );

      expect(resultado).toEqual({
        sucesso: true,
        dados: {
          os: {
            id: 'os-123',
            numero: 'OS-2024-001',
            data_abertura: new Date('2024-01-01'),
            data_prazo: new Date('2024-01-10'),
            status: 'FILA',
            nome_servico: 'Banner Teste',
            quantidade: 5,
            observacoes: 'Teste',
            aprovacao_tecnica_status: 'PENDENTE',
            aprovacao_tecnica_por: null,
            aprovacao_tecnica_em: null,
            data_instalacao_agendada: null,
          },
          cliente: {
            nome: 'Cliente Teste',
            documento: '12345678901',
            telefone: '11999999999',
            email: 'cliente@teste.com',
            endereco: 'Rua Teste, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234567',
          },
          loja: {
            nome: 'Loja Teste',
            endereco: 'Rua Loja, 456',
            cidade: 'São Paulo',
            estado: 'SP',
          },
          dados_transformados: mockDados.dadosTransformados,
          materiais: [
            {
              nome: 'Material 1',
              quantidade: 10,
              unidade: 'm²',
              observacoes: 'Observação teste',
            },
          ],
          qr_code_disponivel: true,
        },
      });
    });

    it('deve lançar HttpException em caso de erro', async () => {
      const osId = 'os-123';
      const errorMessage = 'Erro ao obter dados';

      mockImpressaoOSService.gerarDadosImpressao.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.obterDadosImpressao(osId, 'true', 'true', 'true'),
      ).rejects.toThrow(HttpException);

      try {
        await controller.obterDadosImpressao(osId, 'true', 'true', 'true');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toContain('Erro ao obter dados da OS');
        expect(error.message).toContain(errorMessage);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });
});
