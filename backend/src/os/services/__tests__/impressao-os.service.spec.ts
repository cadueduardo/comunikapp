import { Test, TestingModule } from '@nestjs/testing';
import { ImpressaoOSService, ConfiguracaoImpressao } from '../impressao-os.service';
import { PrismaService } from '../../../common/services/prisma.service';
import TransformacaoDadosHelper from '../../helpers/transformacao-dados.helper';

// Mock do PrismaService
const mockPrismaService = {
  ordemServico: {
    findUnique: jest.fn(),
  },
};

// Mock do TransformacaoDadosHelper
jest.mock('../../helpers/transformacao-dados.helper', () => ({
  __esModule: true,
  default: {
    transformarDadosCompletos: jest.fn(),
  },
}));

// Mock do QRCode
jest.mock('qrcode', () => ({
  toDataUrl: jest.fn(),
}));

// Mock do fs
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('ImpressaoOSService', () => {
  let service: ImpressaoOSService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpressaoOSService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ImpressaoOSService>(ImpressaoOSService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('gerarDadosImpressao', () => {
    it('deve gerar dados completos para impressão', async () => {
      const osId = 'os-123';
      const config: ConfiguracaoImpressao = {
        incluirQRCode: true,
        incluirLogo: true,
        incluirDetalhesTecnicos: true,
        formato: 'html'
      };

      const mockOS = {
        id: 'os-123',
        numero: 'OS-2024-001',
        data_abertura: new Date('2024-01-01'),
        data_prazo: new Date('2024-01-10'),
        status: 'FILA',
        nome_servico: 'Banner Promocional',
        quantidade: 10,
        observacoes: 'Urgente',
        aprovacao_tecnica_status: 'PENDENTE',
        loja: {
          nome: 'Loja Teste',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP'
        },
        cliente: {
          nome: 'Cliente Teste',
          documento: '12345678901',
          telefone: '11999999999',
          email: 'cliente@teste.com',
          endereco: 'Rua Cliente, 456',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234567'
        },
        orcamento: {
          id: 'orc-123',
          horas_producao: 8,
          produtos: [
            {
              id: 'prod-123',
              insumos: [
                {
                  id: 'insumo-123',
                  quantidade: 5,
                  unidade: 'm²',
                  observacoes: 'Material principal',
                  insumo: {
                    nome: 'Adesivo Vinil',
                    unidade_uso: 'm²'
                  }
                }
              ],
              maquinas: [
                {
                  id: 'maq-123',
                  tempo_horas: 4,
                  maquina: {
                    nome: 'Impressora Digital',
                    tipo: 'Digital'
                  }
                }
              ],
              funcoes: [],
              servicos_manuais: [
                {
                  id: 'serv-123',
                  servico: {
                    nome: 'Laminação',
                    categorias: ['acabamento']
                  }
                }
              ],
              custos_indiretos: []
            }
          ]
        }
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(mockOS);

      // Mock do QRCode
      const QRCode = require('qrcode');
      QRCode.toDataUrl.mockResolvedValue('data:image/png;base64,mock-qr-code');

      // Mock do TransformacaoDadosHelper
      const mockTransformacaoDadosHelper = TransformacaoDadosHelper as jest.Mocked<typeof TransformacaoDadosHelper>;
      mockTransformacaoDadosHelper.transformarDadosCompletos.mockReturnValue({
        prazoProducaoDias: 2,
        materiaisPrincipais: [
          { nome: 'Adesivo Vinil', quantidade: 5, unidade: 'm²' }
        ],
        tipoImpressao: { tipo: 'Digital', confianca: 0.9 },
        acabamentos: [
          { nome: 'Laminação', categoria: 'acabamento' }
        ],
        instalacaoNecessaria: false,
        instalacaoFormatada: 'Não'
      });

      const resultado = await service.gerarDadosImpressao(osId, config);

      expect(resultado).toBeDefined();
      expect(resultado.os).toEqual(mockOS);
      expect(resultado.cliente).toEqual(mockOS.cliente);
      expect(resultado.loja).toEqual(mockOS.loja);
      expect(resultado.qrCodeDataUrl).toBe('data:image/png;base64,mock-qr-code');
      expect(resultado.dadosTransformados).toBeDefined();
      expect(mockPrismaService.ordemServico.findUnique).toHaveBeenCalledWith({
        where: { id: osId },
        include: expect.any(Object)
      });
    });

    it('deve lançar erro se OS não for encontrada', async () => {
      const osId = 'os-inexistente';
      const config: ConfiguracaoImpressao = {
        incluirQRCode: false,
        incluirLogo: false,
        incluirDetalhesTecnicos: false,
        formato: 'html'
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(null);

      await expect(service.gerarDadosImpressao(osId, config))
        .rejects.toThrow('OS os-inexistente não encontrada');
    });

    it('deve funcionar sem QR Code quando configurado', async () => {
      const osId = 'os-123';
      const config: ConfiguracaoImpressao = {
        incluirQRCode: false,
        incluirLogo: true,
        incluirDetalhesTecnicos: true,
        formato: 'html'
      };

      const mockOS = {
        id: 'os-123',
        numero: 'OS-2024-001',
        data_abertura: new Date('2024-01-01'),
        loja: { nome: 'Loja Teste' },
        cliente: { nome: 'Cliente Teste' },
        orcamento: null
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(mockOS);

      const resultado = await service.gerarDadosImpressao(osId, config);

      expect(resultado.qrCodeDataUrl).toBe('');
      expect(resultado.dadosTransformados).toBeNull();
    });
  });

  describe('gerarTemplateHTML', () => {
    it('deve gerar template HTML com dados substituídos', async () => {
      const dados = {
        os: {
          numero: 'OS-2024-001',
          data_abertura: new Date('2024-01-01'),
          nome_servico: 'Banner Teste',
          quantidade: 5,
          status: 'FILA',
          observacoes: 'Teste de observações',
          aprovacao_tecnica_status: 'PENDENTE',
          aprovacao_tecnica_por: null,
          aprovacao_tecnica_em: null,
          data_instalacao_agendada: null
        },
        cliente: {
          nome: 'Cliente Teste',
          documento: '12345678901',
          telefone: '11999999999',
          email: 'cliente@teste.com',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234567'
        },
        loja: {
          nome: 'Loja Teste',
          endereco: 'Rua Loja, 456',
          cidade: 'São Paulo',
          estado: 'SP'
        },
        orcamento: null,
        produtos: [],
        insumos: [],
        maquinas: [],
        servicosManuais: [],
        dadosTransformados: {
          materiaisPrincipais: [
            { nome: 'Material 1', quantidade: 10, unidade: 'm²' }
          ],
          tipoImpressao: { tipo: 'Digital' },
          acabamentos: [
            { nome: 'Acabamento 1' }
          ],
          instalacaoNecessaria: false
        },
        qrCodeDataUrl: 'data:image/png;base64,mock-qr'
      };

      const config: ConfiguracaoImpressao = {
        incluirQRCode: true,
        incluirLogo: true,
        incluirDetalhesTecnicos: true,
        formato: 'html'
      };

      // Mock do fs.readFileSync para retornar template inline
      const fs = require('fs');
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found'); // Força uso do template inline
      });

      const html = await service.gerarTemplateHTML(dados, config);

      expect(html).toContain('OS-2024-001');
      expect(html).toContain('Cliente Teste');
      expect(html).toContain('Banner Teste');
      expect(html).toContain('data:image/png;base64,mock-qr');
      expect(html).toContain('Material 1');
      expect(html).toContain('Digital');
      expect(html).toContain('Acabamento 1');
    });

    it('deve formatar dados corretamente', async () => {
      const dados = {
        os: {
          numero: 'OS-2024-001',
          data_abertura: new Date('2024-01-01T10:00:00Z'),
          nome_servico: 'Banner Teste',
          quantidade: 5,
          status: 'FILA',
          observacoes: 'Teste de observações',
          aprovacao_tecnica_status: 'APROVADA',
          aprovacao_tecnica_por: 'João Silva',
          aprovacao_tecnica_em: new Date('2024-01-02T10:00:00Z'),
          data_instalacao_agendada: new Date('2024-01-15T10:00:00Z')
        },
        cliente: {
          nome: 'Cliente Teste',
          documento: '12345678901',
          telefone: '11999999999',
          email: 'cliente@teste.com',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234567'
        },
        loja: {
          nome: 'Loja Teste',
          endereco: 'Rua Loja, 456',
          cidade: 'São Paulo',
          estado: 'SP'
        },
        orcamento: null,
        produtos: [
          {
            largura: 100,
            altura: 200,
            profundidade: 50
          }
        ],
        insumos: [
          {
            insumo: { nome: 'Material 1' },
            quantidade: 10,
            unidade: 'm²',
            observacoes: 'Observação teste'
          }
        ],
        maquinas: [],
        servicosManuais: [],
        dadosTransformados: {
          materiaisPrincipais: [
            { nome: 'Material 1', quantidade: 10, unidade: 'm²' }
          ],
          tipoImpressao: { tipo: 'Digital' },
          acabamentos: [
            { nome: 'Acabamento 1' }
          ],
          instalacaoNecessaria: true
        },
        qrCodeDataUrl: ''
      };

      const config: ConfiguracaoImpressao = {
        incluirQRCode: false,
        incluirLogo: true,
        incluirDetalhesTecnicos: true,
        formato: 'html'
      };

      const fs = require('fs');
      fs.readFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });

      const html = await service.gerarTemplateHTML(dados, config);

      // Verificar formatação de data
      expect(html).toContain('01/01/2024');
      
      // Verificar formatação de endereço
      expect(html).toContain('Rua Teste, 123, São Paulo, SP, 01234567');
      
      // Verificar formatação de dimensões
      expect(html).toContain('L: 100cm x A: 200cm x P: 50cm');
      
      // Verificar formatação de materiais
      expect(html).toContain('Material 1 (10 m²)');
      
      // Verificar formatação de acabamentos
      expect(html).toContain('Acabamento 1');
      
      // Verificar instalação
      expect(html).toContain('Sim');
      
      // Verificar aprovação técnica
      expect(html).toContain('aprovada');
      expect(html).toContain('João Silva');
      
      // Verificar agendamento
      expect(html).toContain('15/01/2024');
    });
  });

  describe('gerarQRCode', () => {
    it('deve gerar QR Code com URL correta', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataUrl.mockResolvedValue('data:image/png;base64,mock-qr-code');

      // Usar reflexão para acessar método privado
      const resultado = await (service as any).gerarQRCode('OS-2024-001');

      expect(resultado).toBe('data:image/png;base64,mock-qr-code');
      expect(QRCode.toDataUrl).toHaveBeenCalledWith(
        expect.stringContaining('/os/OS-2024-001'),
        expect.objectContaining({
          width: 100,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
      );
    });

    it('deve retornar string vazia em caso de erro', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataUrl.mockRejectedValue(new Error('QR Code error'));

      const resultado = await (service as any).gerarQRCode('OS-2024-001');

      expect(resultado).toBe('');
    });
  });
});
