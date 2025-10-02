import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { DocumentCodeService } from '../../../documentos/document-code.service';
import { ValidacaoEstoqueService } from '../../../orcamentos-v2/services/validacao-estoque.service';
import { AlcadasOrcamentoService } from '../alcadas-orcamento.service';
import { OSService } from '../os.service';
import { CorrecaoMateriaisHelper } from '../../helpers/correcao-materiais.helper';
import { TipoOS } from '../../../documentos/document-code.service';

describe('OSService - Correção de Materiais', () => {
  let service: OSService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    ordemServico: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    loja: {
      findUnique: jest.fn().mockResolvedValue({ id: 'loja-123', nome: 'Loja Teste' }),
    },
    cliente: {
      findUnique: jest.fn().mockResolvedValue({ id: 'cliente-123', nome: 'Cliente Teste' }),
    },
    usuario: {
      findUnique: jest.fn().mockResolvedValue({ id: 'usuario-123', nome: 'Usuário Teste' }),
    },
    $queryRaw: jest.fn(),
  };

  const mockDocumentCodeService = {
    gerarCodigoOS: jest.fn().mockResolvedValue('OS-2025-001'),
  };

  const mockValidacaoEstoqueService = {
    validarInsumosOS: jest.fn().mockResolvedValue({
      materiaisDisponiveis: true,
      alertas: [],
      recomendacoes: [],
      detalhes: [],
    }),
  };

  const mockAlcadasOrcamentoService = {
    validarAlcadas: jest.fn().mockResolvedValue({ aprovado: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OSService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DocumentCodeService, useValue: mockDocumentCodeService },
        { provide: ValidacaoEstoqueService, useValue: mockValidacaoEstoqueService },
        { provide: AlcadasOrcamentoService, useValue: mockAlcadasOrcamentoService },
      ],
    }).compile();

    service = module.get<OSService>(OSService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create - Correção de Materiais', () => {
    it('deve aplicar correção de materiais ao criar OS', async () => {
      // Mock da OS criada
      const osCriada = {
        id: 'os-123',
        numero: 'OS-2025-001',
        nome_servico: 'Banner Personalizado',
        quantidade: 25,
        insumos_calculados: JSON.stringify([
          {
            insumo_id: 'lona',
            nome: 'Bobina Lona Impressão Digital',
            quantidade_necessaria: 27.00,
            unidade: 'm²',
            custo_unitario: 10.14,
            custo_total: 273.78,
            disponivel_estoque: true,
          },
          {
            insumo_id: 'cabo',
            nome: 'Cabo De Madeira Para Banner',
            quantidade_necessaria: 90,
            unidade: 'cm',
            custo_unitario: 70.91,
            custo_total: 6381.90,
            disponivel_estoque: true,
          },
          {
            insumo_id: 'ponteira',
            nome: 'Ponteira Para Banner',
            quantidade_necessaria: 2,
            unidade: 'unidades',
            custo_unitario: 0.13,
            custo_total: 0.26,
            disponivel_estoque: true,
          },
        ]),
      };

      mockPrismaService.ordemServico.create.mockResolvedValue(osCriada);

      // Dados de entrada
      const createOSDto = {
        cliente_id: 'cliente-123',
        nome_servico: 'Banner Personalizado',
        quantidade: 25,
        tipo_os: TipoOS.COMERCIAL,
        insumos_calculados: [
          {
            insumo_id: 'lona',
            nome: 'Bobina Lona Impressão Digital',
            quantidade_necessaria: 27.00,
            unidade: 'm²',
            custo_unitario: 10.14,
            custo_total: 273.78,
            disponivel_estoque: true,
          },
          {
            insumo_id: 'cabo',
            nome: 'Cabo De Madeira Para Banner',
            quantidade_necessaria: 90,
            unidade: 'cm',
            custo_unitario: 70.91,
            custo_total: 6381.90,
            disponivel_estoque: true,
          },
          {
            insumo_id: 'ponteira',
            nome: 'Ponteira Para Banner',
            quantidade_necessaria: 2,
            unidade: 'unidades',
            custo_unitario: 0.13,
            custo_total: 0.26,
            disponivel_estoque: true,
          },
        ],
      };

      // Executar criação
      const resultado = await service.create('loja-123', createOSDto);

      // Verificar se a correção foi aplicada
      expect(mockPrismaService.ordemServico.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          quantidade: 25,
          insumos_calculados: expect.stringContaining('"quantidade_necessaria":2250'), // 90 * 25
        }),
      });

      // Verificar se os materiais m² não foram alterados
      const insumosSalvos = JSON.parse(mockPrismaService.ordemServico.create.mock.calls[0][0].data.insumos_calculados);
      const lona = insumosSalvos.find((i: any) => i.insumo_id === 'lona');
      expect(lona.quantidade_necessaria).toBe(27.00); // Não multiplicado (m²)

      // Verificar se os materiais cm foram multiplicados
      const cabo = insumosSalvos.find((i: any) => i.insumo_id === 'cabo');
      expect(cabo.quantidade_necessaria).toBe(2250); // 90 * 25
      expect(cabo.custo_total).toBe(159547.50); // 2250 * 70.91

      // Verificar se os materiais unidades foram multiplicados
      const ponteira = insumosSalvos.find((i: any) => i.insumo_id === 'ponteira');
      expect(ponteira.quantidade_necessaria).toBe(50); // 2 * 25
      expect(ponteira.custo_total).toBe(6.50); // 50 * 0.13
    });

    it('deve manter insumos originais em caso de erro na correção', async () => {
      // Mock da OS criada
      const osCriada = {
        id: 'os-123',
        numero: 'OS-2025-001',
        nome_servico: 'Banner Personalizado',
        quantidade: 25,
        insumos_calculados: JSON.stringify([]),
      };

      mockPrismaService.ordemServico.create.mockResolvedValue(osCriada);

      // Dados de entrada com insumos inválidos
      const createOSDto = {
        cliente_id: 'cliente-123',
        nome_servico: 'Banner Personalizado',
        quantidade: 25,
        tipo_os: TipoOS.COMERCIAL,
        insumos_calculados: null, // Dados inválidos
      };

      // Executar criação
      const resultado = await service.create('loja-123', createOSDto);

      // Verificar se não houve erro
      expect(resultado).toBeDefined();
      expect(mockPrismaService.ordemServico.create).toHaveBeenCalled();
    });
  });

  describe('corrigirInsumosCalculados - Método Privado', () => {
    it('deve aplicar correção corretamente', () => {
      const insumos = [
        {
          insumo_id: 'test1',
          nome: 'Material m²',
          quantidade_necessaria: 10,
          unidade: 'm²',
          custo_unitario: 5,
          custo_total: 50,
          disponivel_estoque: true,
        },
        {
          insumo_id: 'test2',
          nome: 'Material cm',
          quantidade_necessaria: 20,
          unidade: 'cm',
          custo_unitario: 2,
          custo_total: 40,
          disponivel_estoque: true,
        },
      ];

      const quantidadeProduto = 3;

      // Usar reflexão para acessar método privado
      const resultado = (service as any).corrigirInsumosCalculados(insumos, quantidadeProduto);

      // Verificar correção
      expect(resultado[0].quantidade_necessaria).toBe(10); // m² não multiplicado
      expect(resultado[1].quantidade_necessaria).toBe(60); // cm multiplicado (20 * 3)
      expect(resultado[1].custo_total).toBe(120); // 60 * 2
    });
  });
});
