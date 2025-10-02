import { Test, TestingModule } from '@nestjs/testing';
import { OSService } from '../os.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DocumentCodeService, TipoOS } from '../../../documentos/document-code.service';
import { ValidacaoEstoqueService } from '../../../orcamentos-v2/services/validacao-estoque.service';
import { AlcadasOrcamentoService } from '../alcadas-orcamento.service';
import { BadRequestException } from '@nestjs/common';

describe('OSService - Validações Condicionais', () => {
  let service: OSService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    loja: {
      findUnique: jest.fn(),
    },
    cliente: {
      findUnique: jest.fn(),
    },
    orcamento: {
      findUnique: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
    },
  };

  const mockDocumentCodeService = {
    gerarCodigoOSPorTipo: jest.fn(),
  };

  const mockValidacaoEstoqueService = {
    validarEstoqueOS: jest.fn(),
  };

  const mockAlcadasOrcamentoService = {
    podeAprovarAutomaticamente: jest.fn().mockResolvedValue({ pode: true }),
    validarOrcamentoDisponivel: jest.fn().mockResolvedValue({
      centro_custo: 'CC001',
      orcamento_disponivel: 10000,
      orcamento_reservado: 2000,
      orcamento_livre: 8000,
      pode_aprovar: true
    }),
    reservarOrcamento: jest.fn().mockResolvedValue({ sucesso: true }),
    liberarOrcamento: jest.fn().mockResolvedValue({ sucesso: true }),
    identificarAprovadorNecessario: jest.fn().mockResolvedValue('GERENTE'),
    processarAprovacaoAutomatica: jest.fn().mockResolvedValue({ aprovada_automaticamente: true }),
    obterRelatorioConsumoDepartamento: jest.fn().mockResolvedValue({
      departamentos: [],
      total_geral: { orcamento_total: 0, orcamento_utilizado: 0, orcamento_disponivel: 0 }
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OSService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: DocumentCodeService,
          useValue: mockDocumentCodeService,
        },
        {
          provide: ValidacaoEstoqueService,
          useValue: mockValidacaoEstoqueService,
        },
        {
          provide: AlcadasOrcamentoService,
          useValue: mockAlcadasOrcamentoService,
        },
      ],
    }).compile();

    service = module.get<OSService>(OSService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validarDadosOS', () => {
    const lojaId = 'loja-001';
    const mockLoja = { id: lojaId, nome: 'Loja Teste' };

    beforeEach(() => {
      mockPrismaService.loja.findUnique.mockResolvedValue(mockLoja);
    });

    describe('Validações Básicas', () => {
      it('deve validar dados básicos corretos', async () => {
        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          prioridade: 'NORMAL',
          cliente_id: 'cliente-001'
        };

        mockPrismaService.cliente.findUnique.mockResolvedValue({ id: 'cliente-001' });

        await expect(service['validarDadosOS'](lojaId, dados as any)).resolves.not.toThrow();
      });

      it('deve rejeitar quando loja não existe', async () => {
        mockPrismaService.loja.findUnique.mockResolvedValue(null);

        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          cliente_id: 'cliente-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow(BadRequestException);
      });

      it('deve rejeitar quando nome do serviço está vazio', async () => {
        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: '',
          quantidade: 10,
          cliente_id: 'cliente-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Nome do serviço é obrigatório');
      });

      it('deve rejeitar quando quantidade é zero ou negativa', async () => {
        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 0,
          cliente_id: 'cliente-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Quantidade deve ser maior que zero');
      });

      it('deve rejeitar prioridade inválida', async () => {
        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          prioridade: 'INVALIDA',
          cliente_id: 'cliente-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Prioridade inválida: INVALIDA');
      });

      it('deve rejeitar responsável inexistente', async () => {
        mockPrismaService.usuario.findUnique.mockResolvedValue(null);

        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          responsavel_id: 'usuario-inexistente',
          cliente_id: 'cliente-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Responsável usuario-inexistente não encontrado');
      });
    });

    describe('Validações OS Comercial', () => {
      it('deve rejeitar quando cliente não é informado', async () => {
        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Cliente é obrigatório para OS Comercial');
      });

      it('deve rejeitar quando cliente não existe', async () => {
        mockPrismaService.cliente.findUnique.mockResolvedValue(null);

        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          cliente_id: 'cliente-inexistente'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Cliente cliente-inexistente não encontrado');
      });

      it('deve rejeitar orçamento não aprovado', async () => {
        mockPrismaService.cliente.findUnique.mockResolvedValue({ id: 'cliente-001' });
        mockPrismaService.orcamento.findUnique.mockResolvedValue({
          id: 'orc-001',
          loja_id: lojaId,
          status_aprovacao: 'PENDENTE',
          produtos: []
        });

        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          cliente_id: 'cliente-001',
          orcamento_id: 'orc-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Orçamento deve estar aprovado para gerar OS');
      });

      it('deve rejeitar valor orçado negativo', async () => {
        mockPrismaService.cliente.findUnique.mockResolvedValue({ id: 'cliente-001' });

        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          cliente_id: 'cliente-001',
          valor_orcado: -100
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Valor orçado não pode ser negativo');
      });

      it('deve rejeitar satisfação do cliente inválida', async () => {
        mockPrismaService.cliente.findUnique.mockResolvedValue({ id: 'cliente-001' });

        const dados = {
          tipo_os: TipoOS.COMERCIAL,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          cliente_id: 'cliente-001',
          satisfacao_cliente: 6
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Satisfação do cliente deve ser um número inteiro entre 1 e 5');
      });
    });

    describe('Validações OS Interna', () => {
      it('deve rejeitar quando departamento não é informado', async () => {
        const dados = {
          tipo_os: TipoOS.INTERNA,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          centro_custo: 'CC-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Departamento solicitante é obrigatório para OS Interna');
      });

      it('deve rejeitar quando centro de custo não é informado', async () => {
        const dados = {
          tipo_os: TipoOS.INTERNA,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          departamento_solicitante: 'TI'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Centro de custo é obrigatório para OS Interna');
      });

      it('deve rejeitar centro de custo com formato inválido', async () => {
        const dados = {
          tipo_os: TipoOS.INTERNA,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          departamento_solicitante: 'TI',
          centro_custo: 'centro inválido'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Centro de custo deve ter formato válido');
      });

      it('deve rejeitar quando cliente é informado', async () => {
        const dados = {
          tipo_os: TipoOS.INTERNA,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          departamento_solicitante: 'TI',
          centro_custo: 'CC-001',
          cliente_id: 'cliente-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Cliente não deve ser informado para OS Interna');
      });

      it('deve rejeitar quando orçamento é informado', async () => {
        const dados = {
          tipo_os: TipoOS.INTERNA,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          departamento_solicitante: 'TI',
          centro_custo: 'CC-001',
          orcamento_id: 'orc-001'
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Orçamento não deve ser informado para OS Interna');
      });

      it('deve rejeitar campos específicos de OS Comercial', async () => {
        const dados = {
          tipo_os: TipoOS.INTERNA,
          nome_servico: 'Banner Teste',
          quantidade: 10,
          departamento_solicitante: 'TI',
          centro_custo: 'CC-001',
          valor_orcado: 1000
        };

        await expect(service['validarDadosOS'](lojaId, dados as any))
          .rejects.toThrow('Valor orçado não se aplica a OS Interna');
      });
    });
  });

  describe('validarTransicaoOSComercial', () => {
    it('deve rejeitar transição para PRODUCAO sem aprovação técnica', async () => {
      const os = {
        tipo_os: TipoOS.COMERCIAL,
        aprovacao_tecnica_status: 'PENDENTE'
      };

      const resultado = await service['validarTransicaoOSComercial'](os, 'FILA', 'PRODUCAO', 'user-001');

      expect(resultado.valida).toBe(false);
      expect(resultado.motivo).toBe('OS Comercial deve ter aprovação técnica antes de iniciar produção');
    });

    it('deve permitir transição para PRODUCAO com aprovação técnica', async () => {
      const os = {
        tipo_os: TipoOS.COMERCIAL,
        aprovacao_tecnica_status: 'APROVADA'
      };

      const resultado = await service['validarTransicaoOSComercial'](os, 'FILA', 'PRODUCAO', 'user-001');

      expect(resultado.valida).toBe(true);
    });

    it('deve rejeitar finalização sem materiais disponíveis', async () => {
      const os = {
        tipo_os: TipoOS.COMERCIAL,
        materiais_disponivel: false
      };

      const resultado = await service['validarTransicaoOSComercial'](os, 'ACABAMENTO', 'FINALIZADA', 'user-001');

      expect(resultado.valida).toBe(false);
      expect(resultado.motivo).toBe('Materiais devem estar disponíveis para finalizar OS');
    });

    it('deve permitir finalização com materiais disponíveis', async () => {
      const os = {
        tipo_os: TipoOS.COMERCIAL,
        materiais_disponivel: true
      };

      const resultado = await service['validarTransicaoOSComercial'](os, 'ACABAMENTO', 'FINALIZADA', 'user-001');

      expect(resultado.valida).toBe(true);
    });
  });

  describe('validarTransicaoOSInterna', () => {
    it('deve rejeitar transição para PRODUCAO sem aprovação gerencial', async () => {
      const os = {
        tipo_os: TipoOS.INTERNA,
        aprovacao_gerencial: 'PENDENTE'
      };

      const resultado = await service['validarTransicaoOSInterna'](os, 'FILA', 'PRODUCAO', 'user-001');

      expect(resultado.valida).toBe(false);
      expect(resultado.motivo).toBe('OS Interna deve ter aprovação orçamentária antes de iniciar produção');
    });

    it('deve permitir transição para PRODUCAO com aprovação gerencial', async () => {
      const os = {
        tipo_os: TipoOS.INTERNA,
        aprovacao_gerencial: 'APROVADA'
      };

      const resultado = await service['validarTransicaoOSInterna'](os, 'FILA', 'PRODUCAO', 'user-001');

      expect(resultado.valida).toBe(true);
    });
  });

  describe('validarTransicaoEtapa', () => {
    it('deve aplicar validações condicionais para OS Comercial', async () => {
      const os = {
        tipo_os: TipoOS.COMERCIAL,
        aprovacao_tecnica_status: 'PENDENTE'
      };

      const resultado = await service['validarTransicaoEtapa']('FILA', 'PRODUCAO', os, 'user-001');

      expect(resultado.valida).toBe(false);
      expect(resultado.motivo).toBe('Transição de FILA para PRODUCAO não é permitida');
    });

    it('deve aplicar validações condicionais para OS Interna', async () => {
      const os = {
        tipo_os: TipoOS.INTERNA,
        aprovacao_gerencial: 'PENDENTE'
      };

      const resultado = await service['validarTransicaoEtapa']('FILA', 'PRODUCAO', os, 'user-001');

      expect(resultado.valida).toBe(false);
      expect(resultado.motivo).toBe('Transição de FILA para PRODUCAO não é permitida');
    });

    it('deve permitir transições válidas sem validações condicionais', async () => {
      const resultado = await service['validarTransicaoEtapa']('FILA', 'CANCELADA');

      expect(resultado.valida).toBe(true);
    });
  });
});
