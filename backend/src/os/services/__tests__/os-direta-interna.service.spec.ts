import { Test, TestingModule } from '@nestjs/testing';
import { OSService } from '../os.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DocumentCodeService, TipoOS } from '../../../documentos/document-code.service';
import { ValidacaoEstoqueService } from '../../../orcamentos-v2/services/validacao-estoque.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TipoOS as TipoOSInterface } from '../../interfaces/os-direta-interna.interface';

describe('OSService - OS Direta/Interna', () => {
  let service: OSService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    ordemServico: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    cliente: {
      findUnique: jest.fn(),
    },
  };

  const mockDocumentCodeService = {
    gerarCodigoOSComercial: jest.fn(),
    gerarCodigoOSInterna: jest.fn(),
  };

  const mockValidacaoEstoqueService = {
    validarEstoqueOS: jest.fn(),
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
      ],
    }).compile();

    service = module.get<OSService>(OSService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Configurar mocks padrão
    mockPrismaService.cliente.findUnique.mockResolvedValue({
      id: 'cliente-001',
      nome: 'Cliente Teste',
      loja_id: 'loja-001'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('criarOSComercial', () => {
    const lojaId = 'loja-001';
    const usuarioId = 'user-001';
    const dadosComercial = {
      tipo_os: TipoOS.COMERCIAL,
      cliente_id: 'cliente-001',
      nome_servico: 'Banner Teste',
      quantidade: 10,
      valor_orcado: 1000
    };

    beforeEach(() => {
      mockDocumentCodeService.gerarCodigoOSComercial.mockResolvedValue('OS-2025-001');
      mockPrismaService.ordemServico.create.mockResolvedValue({
        id: 'os-001',
        numero: 'OS-2025-001',
        tipo_os: TipoOS.COMERCIAL,
        ...dadosComercial
      });
    });

    it('deve criar OS Comercial com sucesso', async () => {
      const resultado = await service.criarOSComercial(lojaId, dadosComercial as any, usuarioId);

      expect(mockDocumentCodeService.gerarCodigoOSComercial).toHaveBeenCalledWith(lojaId);
      expect(mockPrismaService.ordemServico.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo_os: TipoOS.COMERCIAL,
          numero: 'OS-2025-001',
          loja_id: lojaId,
          criado_por: usuarioId,
          versao: 1,
          materiais_disponivel: false,
          status: 'FILA',
          data_abertura: expect.any(Date)
        })
      });
      expect(resultado.numero).toBe('OS-2025-001');
    });

    it('deve garantir que tipo_os seja COMERCIAL', async () => {
      const dadosComercialForcado = { ...dadosComercial, tipo_os: TipoOS.INTERNA };
      
      await service.criarOSComercial(lojaId, dadosComercialForcado as any, usuarioId);

      expect(mockPrismaService.ordemServico.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo_os: TipoOS.COMERCIAL
        })
      });
    });
  });

  describe('criarOSInterna', () => {
    const lojaId = 'loja-001';
    const usuarioId = 'user-001';
    const dadosInterna = {
      tipo_os: TipoOS.INTERNA,
      departamento_solicitante: 'TI',
      centro_custo: 'CC-001',
      nome_servico: 'Banner Interno',
      quantidade: 5
    };

    beforeEach(() => {
      mockDocumentCodeService.gerarCodigoOSInterna.mockResolvedValue('OSI-2025-001');
      mockPrismaService.ordemServico.create.mockResolvedValue({
        id: 'os-002',
        numero: 'OSI-2025-001',
        tipo_os: TipoOS.INTERNA,
        ...dadosInterna
      });
    });

    it('deve criar OS Interna com sucesso', async () => {
      const resultado = await service.criarOSInterna(lojaId, dadosInterna as any, usuarioId);

      expect(mockDocumentCodeService.gerarCodigoOSInterna).toHaveBeenCalledWith(lojaId);
      expect(mockPrismaService.ordemServico.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo_os: TipoOS.INTERNA,
          numero: 'OSI-2025-001',
          loja_id: lojaId,
          criado_por: usuarioId,
          versao: 1,
          materiais_disponivel: false,
          status: 'FILA',
          data_abertura: expect.any(Date),
          aprovacao_gerencial: 'PENDENTE'
        })
      });
      expect(resultado.numero).toBe('OSI-2025-001');
    });

    it('deve garantir que tipo_os seja INTERNA', async () => {
      const dadosInternaForcado = { ...dadosInterna, tipo_os: TipoOS.COMERCIAL };
      
      await service.criarOSInterna(lojaId, dadosInternaForcado as any, usuarioId);

      expect(mockPrismaService.ordemServico.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tipo_os: TipoOS.INTERNA
        })
      });
    });
  });

  describe('aprovarOSTecnica', () => {
    const osId = 'os-001';
    const usuarioId = 'user-001';

    it('deve aprovar OS técnica com sucesso', async () => {
      const osComercial = {
        id: osId,
        numero: 'OS-2025-001',
        tipo_os: TipoOS.COMERCIAL,
        aprovacao_tecnica_status: 'PENDENTE'
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(osComercial);
      mockPrismaService.ordemServico.update.mockResolvedValue({
        ...osComercial,
        aprovacao_tecnica_status: 'APROVADA',
        aprovacao_tecnica_por: usuarioId,
        aprovacao_tecnica_em: expect.any(Date),
        versao: 2
      });

      const resultado = await service.aprovarOSTecnica(osId, usuarioId, true, 'Aprovado');

      expect(mockPrismaService.ordemServico.update).toHaveBeenCalledWith({
        where: { id: osId },
        data: expect.objectContaining({
          aprovacao_tecnica_status: 'APROVADA',
          aprovacao_tecnica_por: usuarioId,
          aprovacao_tecnica_obs: 'Aprovado',
          modificado_por: usuarioId,
          motivo_modificacao: 'Aprovação técnica aprovada',
          versao: { increment: 1 }
        })
      });
      expect(resultado.aprovacao_tecnica_status).toBe('APROVADA');
    });

    it('deve rejeitar OS técnica', async () => {
      const osComercial = {
        id: osId,
        numero: 'OS-2025-001',
        tipo_os: TipoOS.COMERCIAL,
        aprovacao_tecnica_status: 'PENDENTE'
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(osComercial);
      mockPrismaService.ordemServico.update.mockResolvedValue({
        ...osComercial,
        aprovacao_tecnica_status: 'REJEITADA'
      });

      const resultado = await service.aprovarOSTecnica(osId, usuarioId, false, 'Rejeitado');

      expect(resultado.aprovacao_tecnica_status).toBe('REJEITADA');
    });

    it('deve lançar erro se OS não for encontrada', async () => {
      mockPrismaService.ordemServico.findUnique.mockResolvedValue(null);

      await expect(service.aprovarOSTecnica(osId, usuarioId, true))
        .rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se OS não for comercial', async () => {
      const osInterna = {
        id: osId,
        numero: 'OSI-2025-001',
        tipo_os: TipoOS.INTERNA
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(osInterna);

      await expect(service.aprovarOSTecnica(osId, usuarioId, true))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('aprovarOSGerencial', () => {
    const osId = 'os-002';
    const usuarioId = 'user-001';

    it('deve aprovar OS gerencial com sucesso', async () => {
      const osInterna = {
        id: osId,
        numero: 'OSI-2025-001',
        tipo_os: TipoOS.INTERNA,
        aprovacao_gerencial: 'PENDENTE'
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(osInterna);
      mockPrismaService.ordemServico.update.mockResolvedValue({
        ...osInterna,
        aprovacao_gerencial: 'APROVADA',
        aprovacao_gerencial_por: usuarioId,
        aprovacao_gerencial_em: expect.any(Date),
        versao: 2
      });

      const resultado = await service.aprovarOSGerencial(osId, usuarioId, true, 'Aprovado');

      expect(mockPrismaService.ordemServico.update).toHaveBeenCalledWith({
        where: { id: osId },
        data: expect.objectContaining({
          aprovacao_gerencial: 'APROVADA',
          aprovacao_gerencial_por: usuarioId,
          aprovacao_gerencial_obs: 'Aprovado',
          modificado_por: usuarioId,
          motivo_modificacao: 'Aprovação gerencial aprovada',
          versao: { increment: 1 }
        })
      });
      expect(resultado.aprovacao_gerencial).toBe('APROVADA');
    });

    it('deve lançar erro se OS não for interna', async () => {
      const osComercial = {
        id: osId,
        numero: 'OS-2025-001',
        tipo_os: TipoOS.COMERCIAL
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(osComercial);

      await expect(service.aprovarOSGerencial(osId, usuarioId, true))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('agendarInstalacao', () => {
    const osId = 'os-001';
    const dataInstalacao = new Date('2025-10-15');
    const usuarioId = 'user-001';

    it('deve agendar instalação com sucesso', async () => {
      const osComercial = {
        id: osId,
        numero: 'OS-2025-001',
        tipo_os: TipoOS.COMERCIAL
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(osComercial);
      mockPrismaService.ordemServico.update.mockResolvedValue({
        ...osComercial,
        data_instalacao_agendada: dataInstalacao,
        observacoes_instalacao: 'Instalação agendada',
        versao: 2
      });

      const resultado = await service.agendarInstalacao(
        osId, 
        dataInstalacao, 
        'Instalação agendada', 
        usuarioId
      );

      expect(mockPrismaService.ordemServico.update).toHaveBeenCalledWith({
        where: { id: osId },
        data: expect.objectContaining({
          data_instalacao_agendada: dataInstalacao,
          observacoes_instalacao: 'Instalação agendada',
          modificado_por: usuarioId,
          motivo_modificacao: 'Agendamento de instalação',
          versao: { increment: 1 }
        })
      });
      expect(resultado.data_instalacao_agendada).toEqual(dataInstalacao);
    });

    it('deve lançar erro se OS não for comercial', async () => {
      const osInterna = {
        id: osId,
        numero: 'OSI-2025-001',
        tipo_os: TipoOS.INTERNA
      };

      mockPrismaService.ordemServico.findUnique.mockResolvedValue(osInterna);

      await expect(service.agendarInstalacao(osId, dataInstalacao, undefined, usuarioId))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('listarOSPorTipo', () => {
    const lojaId = 'loja-001';

    it('deve listar OS comerciais', async () => {
      const osComerciais = [
        { id: 'os-001', tipo_os: TipoOS.COMERCIAL, status: 'FILA' },
        { id: 'os-002', tipo_os: TipoOS.COMERCIAL, status: 'PRODUCAO' }
      ];

      mockPrismaService.ordemServico.findMany.mockResolvedValue(osComerciais);
      mockPrismaService.ordemServico.count.mockResolvedValue(2);

      const resultado = await service.listarOSPorTipo(lojaId, TipoOS.COMERCIAL, 1, 10);

      expect(mockPrismaService.ordemServico.findMany).toHaveBeenCalledWith({
        where: { loja_id: lojaId, tipo_os: TipoOS.COMERCIAL },
        skip: 0,
        take: 10,
        orderBy: { data_abertura: 'desc' },
        include: { cliente: true, orcamento: true, loja: true }
      });
      expect(resultado.total).toBe(2);
      expect(resultado.data).toHaveLength(2);
    });

    it('deve filtrar por status', async () => {
      mockPrismaService.ordemServico.findMany.mockResolvedValue([]);
      mockPrismaService.ordemServico.count.mockResolvedValue(0);

      await service.listarOSPorTipo(lojaId, TipoOS.COMERCIAL, 1, 10, 'FILA');

      expect(mockPrismaService.ordemServico.findMany).toHaveBeenCalledWith({
        where: { 
          loja_id: lojaId, 
          tipo_os: TipoOS.COMERCIAL,
          status: 'FILA'
        },
        skip: 0,
        take: 10,
        orderBy: { data_abertura: 'desc' },
        include: { cliente: true, orcamento: true, loja: true }
      });
    });
  });

  describe('obterEstatisticasPorTipo', () => {
    const lojaId = 'loja-001';

    it('deve retornar estatísticas por tipo', async () => {
      const osComercial = [
        { status: 'FILA' },
        { status: 'PRODUCAO' },
        { status: 'FILA' }
      ];
      const osInterna = [
        { status: 'FILA' },
        { status: 'PRODUCAO' }
      ];

      mockPrismaService.ordemServico.findMany
        .mockResolvedValueOnce(osComercial)
        .mockResolvedValueOnce(osInterna);

      const resultado = await service.obterEstatisticasPorTipo(lojaId, 2025);

      expect(resultado.comercial.total).toBe(3);
      expect(resultado.comercial.porStatus.FILA).toBe(2);
      expect(resultado.comercial.porStatus.PRODUCAO).toBe(1);
      expect(resultado.interna.total).toBe(2);
      expect(resultado.interna.porStatus.FILA).toBe(1);
      expect(resultado.interna.porStatus.PRODUCAO).toBe(1);
    });

    it('deve usar ano atual se não especificado', async () => {
      const anoAtual = new Date().getFullYear();
      mockPrismaService.ordemServico.findMany.mockResolvedValue([]);

      await service.obterEstatisticasPorTipo(lojaId);

      expect(mockPrismaService.ordemServico.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          data_abertura: expect.objectContaining({
            gte: new Date(anoAtual, 0, 1),
            lte: new Date(anoAtual, 11, 31, 23, 59, 59)
          })
        }),
        select: { status: true }
      });
    });
  });
});
