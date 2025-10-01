import { Test, TestingModule } from '@nestjs/testing';
import { OSDiretaInternaController } from '../os-direta-interna.controller';
import { OSService } from '../../services/os.service';
import { TipoOS } from '../../interfaces/os-direta-interna.interface';

describe('OSDiretaInternaController', () => {
  let controller: OSDiretaInternaController;
  let osService: OSService;

  const mockOSService = {
    criarOSComercial: jest.fn(),
    criarOSInterna: jest.fn(),
    listarOSPorTipo: jest.fn(),
    aprovarOSTecnica: jest.fn(),
    aprovarOSGerencial: jest.fn(),
    agendarInstalacao: jest.fn(),
    obterEstatisticasPorTipo: jest.fn(),
  };

  const mockRequest = {
    user: {
      id: 'user-001',
      loja_id: 'loja-001',
      nome: 'Usuário Teste'
    }
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OSDiretaInternaController],
      providers: [
        {
          provide: OSService,
          useValue: mockOSService,
        },
      ],
    }).compile();

    controller = module.get<OSDiretaInternaController>(OSDiretaInternaController);
    osService = module.get<OSService>(OSService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criarOSComercial', () => {
    const createOSDto = {
      tipo_os: TipoOS.COMERCIAL,
      cliente_id: 'cliente-001',
      nome_servico: 'Banner Teste',
      quantidade: 10,
      valor_orcado: 1000
    };

    const mockOSComercial = {
      id: 'os-001',
      numero: 'OS-2025-001',
      tipo_os: TipoOS.COMERCIAL,
      ...createOSDto
    };

    it('deve criar OS Comercial com sucesso', async () => {
      mockOSService.criarOSComercial.mockResolvedValue(mockOSComercial);

      const resultado = await controller.criarOSComercial(createOSDto, mockRequest);

      expect(mockOSService.criarOSComercial).toHaveBeenCalledWith(
        'loja-001',
        createOSDto,
        'user-001'
      );
      expect(resultado.numero).toBe('OS-2025-001');
    });
  });

  describe('criarOSInterna', () => {
    const createOSDto = {
      tipo_os: TipoOS.INTERNA,
      departamento_solicitante: 'TI',
      centro_custo: 'CC-001',
      nome_servico: 'Banner Interno',
      quantidade: 5
    };

    const mockOSInterna = {
      id: 'os-002',
      numero: 'OSI-2025-001',
      tipo_os: TipoOS.INTERNA,
      ...createOSDto
    };

    it('deve criar OS Interna com sucesso', async () => {
      mockOSService.criarOSInterna.mockResolvedValue(mockOSInterna);

      const resultado = await controller.criarOSInterna(createOSDto, mockRequest);

      expect(mockOSService.criarOSInterna).toHaveBeenCalledWith(
        'loja-001',
        createOSDto,
        'user-001'
      );
      expect(resultado.numero).toBe('OSI-2025-001');
    });
  });

  describe('listarOSComerciais', () => {
    const mockListaOS = {
      data: [
        { id: 'os-001', numero: 'OS-2025-001', tipo_os: TipoOS.COMERCIAL },
        { id: 'os-002', numero: 'OS-2025-002', tipo_os: TipoOS.COMERCIAL }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('deve listar OS comerciais com sucesso', async () => {
      mockOSService.listarOSPorTipo.mockResolvedValue(mockListaOS);

      const resultado = await controller.listarOSComerciais(mockRequest, '1', '10', 'FILA');

      expect(mockOSService.listarOSPorTipo).toHaveBeenCalledWith(
        'loja-001',
        TipoOS.COMERCIAL,
        1,
        10,
        'FILA'
      );
      expect(resultado.total).toBe(2);
      expect(resultado.data).toHaveLength(2);
    });

    it('deve usar valores padrão para paginação', async () => {
      mockOSService.listarOSPorTipo.mockResolvedValue(mockListaOS);

      await controller.listarOSComerciais(mockRequest);

      expect(mockOSService.listarOSPorTipo).toHaveBeenCalledWith(
        'loja-001',
        TipoOS.COMERCIAL,
        1,
        10,
        undefined
      );
    });
  });

  describe('listarOSInternas', () => {
    const mockListaOS = {
      data: [
        { id: 'os-001', numero: 'OSI-2025-001', tipo_os: TipoOS.INTERNA },
        { id: 'os-002', numero: 'OSI-2025-002', tipo_os: TipoOS.INTERNA }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('deve listar OS internas com sucesso', async () => {
      mockOSService.listarOSPorTipo.mockResolvedValue(mockListaOS);

      const resultado = await controller.listarOSInternas(mockRequest, '1', '10', 'FILA');

      expect(mockOSService.listarOSPorTipo).toHaveBeenCalledWith(
        'loja-001',
        TipoOS.INTERNA,
        1,
        10,
        'FILA'
      );
      expect(resultado.total).toBe(2);
      expect(resultado.data).toHaveLength(2);
    });
  });

  describe('aprovarOSTecnica', () => {
    const osId = 'os-001';
    const body = { aprovado: true, observacoes: 'Aprovado' };
    const mockOSAprovada = {
      id: osId,
      numero: 'OS-2025-001',
      aprovacao_tecnica_status: 'APROVADA'
    };

    it('deve aprovar OS técnica com sucesso', async () => {
      mockOSService.aprovarOSTecnica.mockResolvedValue(mockOSAprovada);

      const resultado = await controller.aprovarOSTecnica(osId, body, mockRequest);

      expect(mockOSService.aprovarOSTecnica).toHaveBeenCalledWith(
        osId,
        'user-001',
        true,
        'Aprovado'
      );
      expect(resultado.aprovacao_tecnica_status).toBe('APROVADA');
    });

    it('deve rejeitar OS técnica', async () => {
      const mockOSRejeitada = {
        id: osId,
        numero: 'OS-2025-001',
        aprovacao_tecnica_status: 'REJEITADA'
      };

      mockOSService.aprovarOSTecnica.mockResolvedValue(mockOSRejeitada);

      const bodyRejeicao = { aprovado: false, observacoes: 'Rejeitado' };
      const resultado = await controller.aprovarOSTecnica(osId, bodyRejeicao, mockRequest);

      expect(mockOSService.aprovarOSTecnica).toHaveBeenCalledWith(
        osId,
        'user-001',
        false,
        'Rejeitado'
      );
      expect(resultado.aprovacao_tecnica_status).toBe('REJEITADA');
    });
  });

  describe('aprovarOSGerencial', () => {
    const osId = 'os-002';
    const body = { aprovado: true, observacoes: 'Aprovado' };
    const mockOSAprovada = {
      id: osId,
      numero: 'OSI-2025-001',
      aprovacao_gerencial: 'APROVADA'
    };

    it('deve aprovar OS gerencial com sucesso', async () => {
      mockOSService.aprovarOSGerencial.mockResolvedValue(mockOSAprovada);

      const resultado = await controller.aprovarOSGerencial(osId, body, mockRequest);

      expect(mockOSService.aprovarOSGerencial).toHaveBeenCalledWith(
        osId,
        'user-001',
        true,
        'Aprovado'
      );
      expect(resultado.aprovacao_gerencial).toBe('APROVADA');
    });
  });

  describe('agendarInstalacao', () => {
    const osId = 'os-001';
    const body = { 
      dataInstalacao: '2025-10-15T10:00:00.000Z',
      observacoes: 'Instalação agendada'
    };
    const mockOSComInstalacao = {
      id: osId,
      numero: 'OS-2025-001',
      data_instalacao_agendada: new Date('2025-10-15T10:00:00.000Z')
    };

    it('deve agendar instalação com sucesso', async () => {
      mockOSService.agendarInstalacao.mockResolvedValue(mockOSComInstalacao);

      const resultado = await controller.agendarInstalacao(osId, body, mockRequest);

      expect(mockOSService.agendarInstalacao).toHaveBeenCalledWith(
        osId,
        new Date('2025-10-15T10:00:00.000Z'),
        'Instalação agendada',
        'user-001'
      );
      expect(resultado.data_instalacao_agendada).toEqual(new Date('2025-10-15T10:00:00.000Z'));
    });
  });

  describe('obterEstatisticasPorTipo', () => {
    const mockEstatisticas = {
      comercial: {
        total: 10,
        porStatus: { FILA: 5, PRODUCAO: 3, FINALIZADA: 2 }
      },
      interna: {
        total: 5,
        porStatus: { FILA: 2, PRODUCAO: 2, FINALIZADA: 1 }
      }
    };

    it('deve retornar estatísticas por tipo', async () => {
      mockOSService.obterEstatisticasPorTipo.mockResolvedValue(mockEstatisticas);

      const resultado = await controller.obterEstatisticasPorTipo(mockRequest, '2025');

      expect(mockOSService.obterEstatisticasPorTipo).toHaveBeenCalledWith('loja-001', 2025);
      expect(resultado.sucesso).toBe(true);
      expect(resultado.lojaId).toBe('loja-001');
      expect(resultado.ano).toBe(2025);
      expect(resultado.estatisticas.comercial.total).toBe(10);
      expect(resultado.estatisticas.interna.total).toBe(5);
    });

    it('deve usar ano atual se não especificado', async () => {
      mockOSService.obterEstatisticasPorTipo.mockResolvedValue(mockEstatisticas);

      await controller.obterEstatisticasPorTipo(mockRequest);

      expect(mockOSService.obterEstatisticasPorTipo).toHaveBeenCalledWith('loja-001', undefined);
    });
  });

  describe('listarOSPendentesAprovacaoTecnica', () => {
    const mockOSComerciais = {
      data: [
        { 
          id: 'os-001', 
          numero: 'OS-2025-001', 
          tipo_os: TipoOS.COMERCIAL,
          aprovacao_tecnica_status: 'PENDENTE'
        },
        { 
          id: 'os-002', 
          numero: 'OS-2025-002', 
          tipo_os: TipoOS.COMERCIAL,
          aprovacao_tecnica_status: null
        }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('deve listar OS pendentes de aprovação técnica', async () => {
      mockOSService.listarOSPorTipo.mockResolvedValue(mockOSComerciais);

      const resultado = await controller.listarOSPendentesAprovacaoTecnica(mockRequest, '1', '10');

      expect(mockOSService.listarOSPorTipo).toHaveBeenCalledWith(
        'loja-001',
        TipoOS.COMERCIAL,
        1,
        10,
        'FILA'
      );
      expect(resultado.total).toBe(2);
      expect(resultado.data).toHaveLength(2);
    });
  });

  describe('listarOSPendentesAprovacaoGerencial', () => {
    const mockOSInternas = {
      data: [
        { 
          id: 'os-001', 
          numero: 'OSI-2025-001', 
          tipo_os: TipoOS.INTERNA,
          aprovacao_gerencial: 'PENDENTE'
        },
        { 
          id: 'os-002', 
          numero: 'OSI-2025-002', 
          tipo_os: TipoOS.INTERNA,
          aprovacao_gerencial: null
        }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('deve listar OS pendentes de aprovação gerencial', async () => {
      mockOSService.listarOSPorTipo.mockResolvedValue(mockOSInternas);

      const resultado = await controller.listarOSPendentesAprovacaoGerencial(mockRequest, '1', '10');

      expect(mockOSService.listarOSPorTipo).toHaveBeenCalledWith(
        'loja-001',
        TipoOS.INTERNA,
        1,
        10,
        'FILA'
      );
      expect(resultado.total).toBe(2);
      expect(resultado.data).toHaveLength(2);
    });
  });

  describe('listarInstalacoesAgendadas', () => {
    const mockOSComInstalacao = {
      data: [
        { 
          id: 'os-001', 
          numero: 'OS-2025-001', 
          tipo_os: TipoOS.COMERCIAL,
          data_instalacao_agendada: new Date('2025-10-15')
        },
        { 
          id: 'os-002', 
          numero: 'OS-2025-002', 
          tipo_os: TipoOS.COMERCIAL,
          data_instalacao_agendada: new Date('2025-10-16')
        }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('deve listar instalações agendadas', async () => {
      mockOSService.listarOSPorTipo.mockResolvedValue(mockOSComInstalacao);

      const resultado = await controller.listarInstalacoesAgendadas(
        mockRequest, 
        '1', 
        '10',
        '2025-10-01',
        '2025-10-31'
      );

      expect(mockOSService.listarOSPorTipo).toHaveBeenCalledWith(
        'loja-001',
        TipoOS.COMERCIAL,
        1,
        10
      );
      expect(resultado.total).toBe(2);
      expect(resultado.data).toHaveLength(2);
    });

    it('deve filtrar por período', async () => {
      const osComInstalacaoFiltrada = {
        data: [
          { 
            id: 'os-001', 
            numero: 'OS-2025-001', 
            tipo_os: TipoOS.COMERCIAL,
            data_instalacao_agendada: new Date('2025-10-15')
          }
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };

      mockOSService.listarOSPorTipo.mockResolvedValue(osComInstalacaoFiltrada);

      const resultado = await controller.listarInstalacoesAgendadas(
        mockRequest, 
        '1', 
        '10',
        '2025-10-15',
        '2025-10-15'
      );

      expect(resultado.total).toBe(1);
      expect(resultado.data).toHaveLength(1);
    });
  });
});
