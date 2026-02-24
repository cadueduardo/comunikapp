import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AprovacaoAlcadaController } from '../aprovacao-alcada.controller';
import {
  AprovacaoAlcadaService,
  NivelAlcada,
} from '../../services/aprovacao-alcada.service';
import { OSPermissionsGuard } from '../../guards/os-permissions.guard';

describe('AprovacaoAlcadaController', () => {
  let controller: AprovacaoAlcadaController;
  let service: AprovacaoAlcadaService;

  const mockAprovacaoAlcadaService = {
    aprovarOSInterna: jest.fn(),
    rejeitarOSInterna: jest.fn(),
    listarOSPendentesAprovacao: jest.fn(),
    obterEstatisticasAprovacao: jest.fn(),
    validarAprovacaoAlcada: jest.fn(),
  };

  const mockOSPermissionsGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AprovacaoAlcadaController],
      providers: [
        {
          provide: AprovacaoAlcadaService,
          useValue: mockAprovacaoAlcadaService,
        },
      ],
    })
      .overrideGuard(OSPermissionsGuard)
      .useValue(mockOSPermissionsGuard)
      .compile();

    controller = module.get<AprovacaoAlcadaController>(
      AprovacaoAlcadaController,
    );
    service = module.get<AprovacaoAlcadaService>(AprovacaoAlcadaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('aprovarOSInterna', () => {
    const mockRequest = {
      user: {
        id: 'user-001',
        funcao: 'GERENTE_MARKETING',
        loja_id: 'loja-001',
      },
    };

    const mockBody = {
      observacoes: 'Aprovado conforme alçada',
    };

    it('deve aprovar OS interna com sucesso', async () => {
      mockAprovacaoAlcadaService.aprovarOSInterna.mockResolvedValue(undefined);

      const resultado = await controller.aprovarOSInterna(
        'os-001',
        mockBody,
        mockRequest,
      );

      expect(resultado).toEqual({
        success: true,
        message: 'OS Interna aprovada com sucesso',
        osId: 'os-001',
        aprovador: 'user-001',
        data: expect.any(String),
      });

      expect(service.aprovarOSInterna).toHaveBeenCalledWith(
        'os-001',
        'user-001',
        'GERENTE_MARKETING',
        'Aprovado conforme alçada',
      );
    });

    it('deve lançar exceção quando serviço falha', async () => {
      const errorMessage = 'OS não encontrada';
      mockAprovacaoAlcadaService.aprovarOSInterna.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.aprovarOSInterna('os-001', mockBody, mockRequest),
      ).rejects.toThrow(HttpException);

      try {
        await controller.aprovarOSInterna('os-001', mockBody, mockRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(error.getResponse()).toEqual({
          success: false,
          message: errorMessage,
        });
      }
    });
  });

  describe('rejeitarOSInterna', () => {
    const mockRequest = {
      user: {
        id: 'user-001',
        funcao: 'GERENTE_MARKETING',
        loja_id: 'loja-001',
      },
    };

    const mockBody = {
      motivoRejeicao: 'Orçamento insuficiente',
    };

    it('deve rejeitar OS interna com sucesso', async () => {
      mockAprovacaoAlcadaService.rejeitarOSInterna.mockResolvedValue(undefined);

      const resultado = await controller.rejeitarOSInterna(
        'os-001',
        mockBody,
        mockRequest,
      );

      expect(resultado).toEqual({
        success: true,
        message: 'OS Interna rejeitada com sucesso',
        osId: 'os-001',
        aprovador: 'user-001',
        motivo: 'Orçamento insuficiente',
        data: expect.any(String),
      });

      expect(service.rejeitarOSInterna).toHaveBeenCalledWith(
        'os-001',
        'user-001',
        'Orçamento insuficiente',
      );
    });

    it('deve lançar exceção quando serviço falha', async () => {
      const errorMessage = 'OS não encontrada';
      mockAprovacaoAlcadaService.rejeitarOSInterna.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.rejeitarOSInterna('os-001', mockBody, mockRequest),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('listarOSPendentesAprovacao', () => {
    const mockRequest = {
      user: {
        id: 'user-001',
        funcao: 'GERENTE_MARKETING',
        loja_id: 'loja-001',
      },
    };

    const mockOSPendentes = {
      data: [
        {
          id: 'os-001',
          tipo_os: 'INTERNA',
          valor_estimado: 1500,
          centro_custo: 'CC001',
          departamento_solicitante: 'MARKETING',
          status: 'AGUARDANDO_APROVACAO_ORCAMENTARIA',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };

    it('deve listar OS pendentes com sucesso', async () => {
      mockAprovacaoAlcadaService.listarOSPendentesAprovacao.mockResolvedValue(
        mockOSPendentes,
      );

      const resultado = await controller.listarOSPendentesAprovacao(
        mockRequest,
        '1',
        '10',
      );

      expect(resultado).toEqual({
        success: true,
        data: mockOSPendentes.data,
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      expect(service.listarOSPendentesAprovacao).toHaveBeenCalledWith(
        'loja-001',
        'GERENTE_MARKETING',
        1,
        10,
      );
    });

    it('deve usar valores padrão para paginação', async () => {
      mockAprovacaoAlcadaService.listarOSPendentesAprovacao.mockResolvedValue(
        mockOSPendentes,
      );

      await controller.listarOSPendentesAprovacao(mockRequest);

      expect(service.listarOSPendentesAprovacao).toHaveBeenCalledWith(
        'loja-001',
        'GERENTE_MARKETING',
        1,
        10,
      );
    });

    it('deve lançar exceção quando serviço falha', async () => {
      const errorMessage = 'Erro interno do servidor';
      mockAprovacaoAlcadaService.listarOSPendentesAprovacao.mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        controller.listarOSPendentesAprovacao(mockRequest),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('obterEstatisticasAprovacao', () => {
    const mockRequest = {
      user: {
        id: 'user-001',
        funcao: 'GERENTE_MARKETING',
        loja_id: 'loja-001',
      },
    };

    const mockEstatisticas = [
      {
        status: 'APROVADA',
        quantidade: 5,
        valorTotal: 7500,
      },
      {
        status: 'REJEITADA',
        quantidade: 2,
        valorTotal: 3000,
      },
    ];

    it('deve obter estatísticas com sucesso', async () => {
      mockAprovacaoAlcadaService.obterEstatisticasAprovacao.mockResolvedValue(
        mockEstatisticas,
      );

      const resultado = await controller.obterEstatisticasAprovacao(
        mockRequest,
        {},
      );

      expect(resultado).toEqual({
        success: true,
        data: mockEstatisticas,
        periodo: {
          inicio: undefined,
          fim: undefined,
        },
      });

      expect(service.obterEstatisticasAprovacao).toHaveBeenCalledWith(
        'loja-001',
        undefined,
        undefined,
      );
    });

    it('deve obter estatísticas com período específico', async () => {
      mockAprovacaoAlcadaService.obterEstatisticasAprovacao.mockResolvedValue(
        mockEstatisticas,
      );

      const query = {
        periodoInicio: '2025-01-01',
        periodoFim: '2025-01-31',
      };

      const resultado = await controller.obterEstatisticasAprovacao(
        mockRequest,
        query,
      );

      expect(resultado.periodo.inicio).toBe('2025-01-01T00:00:00.000Z');
      expect(resultado.periodo.fim).toBe('2025-01-31T00:00:00.000Z');

      expect(service.obterEstatisticasAprovacao).toHaveBeenCalledWith(
        'loja-001',
        new Date('2025-01-01'),
        new Date('2025-01-31'),
      );
    });
  });

  describe('validarAprovacaoAlcada', () => {
    const mockRequest = {
      user: {
        id: 'user-001',
        funcao: 'GERENTE_MARKETING',
        loja_id: 'loja-001',
      },
    };

    it('deve validar aprovação com sucesso', async () => {
      const mockOS = {
        id: 'os-001',
        valor_estimado: 1500,
        centro_custo: 'CC001',
        departamento_solicitante: 'MARKETING',
        loja_id: 'loja-001',
        tipo_os: 'INTERNA',
      };

      const mockValidacao = {
        nivelRequerido: NivelAlcada.GERENTE_DEPARTAMENTO,
        aprovadorRequerido: 'GERENTE_MARKETING',
        valorEstimado: 1500,
        centroCusto: 'CC001',
        orcamentoDisponivel: 10000,
        podeAprovar: true,
        motivoBloqueio: undefined,
      };

      // Mock do PrismaService
      const mockPrismaService = {
        ordemServico: {
          findUnique: jest.fn().mockResolvedValue(mockOS),
        },
      };

      // Substituir o prisma service no controller
      (controller as any).aprovacaoAlcadaService = {
        ...service,
        prisma: mockPrismaService,
        validarAprovacaoAlcada: jest.fn().mockResolvedValue(mockValidacao),
      };

      const resultado = await controller.validarAprovacaoAlcada(
        'os-001',
        mockRequest,
      );

      expect(resultado).toEqual({
        success: true,
        data: {
          osId: 'os-001',
          valorEstimado: 1500,
          centroCusto: 'CC001',
          nivelRequerido: NivelAlcada.GERENTE_DEPARTAMENTO,
          aprovadorRequerido: 'GERENTE_MARKETING',
          orcamentoDisponivel: 10000,
          podeAprovar: true,
          motivoBloqueio: undefined,
        },
      });
    });

    it('deve lançar exceção quando OS não é encontrada', async () => {
      const mockPrismaService = {
        ordemServico: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      (controller as any).aprovacaoAlcadaService = {
        ...service,
        prisma: mockPrismaService,
      };

      await expect(
        controller.validarAprovacaoAlcada('os-001', mockRequest),
      ).rejects.toThrow(HttpException);
    });

    it('deve lançar exceção quando OS não é interna', async () => {
      const mockOS = {
        id: 'os-001',
        tipo_os: 'COMERCIAL',
      };

      const mockPrismaService = {
        ordemServico: {
          findUnique: jest.fn().mockResolvedValue(mockOS),
        },
      };

      (controller as any).aprovacaoAlcadaService = {
        ...service,
        prisma: mockPrismaService,
      };

      await expect(
        controller.validarAprovacaoAlcada('os-001', mockRequest),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('listarNiveisAlcada', () => {
    it('deve retornar níveis de alçada configurados', async () => {
      const resultado = await controller.listarNiveisAlcada();

      expect(resultado).toEqual({
        success: true,
        data: [
          {
            nivel: NivelAlcada.AUTOMATICA,
            descricao: 'Aprovação Automática',
            valorMinimo: 0,
            valorMaximo: 500,
            cargoAprovador: 'SISTEMA',
          },
          {
            nivel: NivelAlcada.GERENTE_DEPARTAMENTO,
            descricao: 'Gerente de Departamento',
            valorMinimo: 500,
            valorMaximo: 2000,
            cargoAprovador: 'GERENTE_DEPARTAMENTO',
          },
          {
            nivel: NivelAlcada.DIRETORIA,
            descricao: 'Diretoria',
            valorMinimo: 2000,
            cargoAprovador: 'DIRETORIA',
          },
        ],
      });
    });
  });
});
