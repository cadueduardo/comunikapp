import { Test, TestingModule } from '@nestjs/testing';
import { AprovacaoAlcadaService, NivelAlcada } from '../aprovacao-alcada.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { StatusAprovacao } from '../../interfaces/os-direta-interna.interface';

describe('AprovacaoAlcadaService', () => {
  let service: AprovacaoAlcadaService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    ordemServico: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AprovacaoAlcadaService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AprovacaoAlcadaService>(AprovacaoAlcadaService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('determinarNivelAlcada', () => {
    it('deve retornar AUTOMATICA para valores até R$ 500', () => {
      expect(service.determinarNivelAlcada(0)).toBe(NivelAlcada.AUTOMATICA);
      expect(service.determinarNivelAlcada(250)).toBe(NivelAlcada.AUTOMATICA);
      expect(service.determinarNivelAlcada(500)).toBe(NivelAlcada.AUTOMATICA);
    });

    it('deve retornar GERENTE_DEPARTAMENTO para valores entre R$ 500 e R$ 2000', () => {
      expect(service.determinarNivelAlcada(501)).toBe(NivelAlcada.GERENTE_DEPARTAMENTO);
      expect(service.determinarNivelAlcada(1500)).toBe(NivelAlcada.GERENTE_DEPARTAMENTO);
      expect(service.determinarNivelAlcada(2000)).toBe(NivelAlcada.GERENTE_DEPARTAMENTO);
    });

    it('deve retornar DIRETORIA para valores acima de R$ 2000', () => {
      expect(service.determinarNivelAlcada(2001)).toBe(NivelAlcada.DIRETORIA);
      expect(service.determinarNivelAlcada(5000)).toBe(NivelAlcada.DIRETORIA);
      expect(service.determinarNivelAlcada(10000)).toBe(NivelAlcada.DIRETORIA);
    });
  });

  describe('validarAprovacaoAlcada', () => {
    it('deve validar aprovação com sucesso para valor baixo', async () => {
      const resultado = await service.validarAprovacaoAlcada(
        300,
        'CC001',
        'MARKETING',
        'loja-001',
      );

      expect(resultado.nivelRequerido).toBe(NivelAlcada.AUTOMATICA);
      expect(resultado.aprovadorRequerido).toBe('SISTEMA');
      expect(resultado.valorEstimado).toBe(300);
      expect(resultado.centroCusto).toBe('CC001');
      expect(resultado.podeAprovar).toBe(true);
    });

    it('deve validar aprovação com sucesso para valor médio', async () => {
      const resultado = await service.validarAprovacaoAlcada(
        1500,
        'CC002',
        'PRODUCAO',
        'loja-001',
      );

      expect(resultado.nivelRequerido).toBe(NivelAlcada.GERENTE_DEPARTAMENTO);
      expect(resultado.aprovadorRequerido).toBe('GERENTE_PRODUCAO');
      expect(resultado.valorEstimado).toBe(1500);
      expect(resultado.centroCusto).toBe('CC002');
      expect(resultado.podeAprovar).toBe(true);
    });

    it('deve validar aprovação com sucesso para valor alto', async () => {
      const resultado = await service.validarAprovacaoAlcada(
        5000,
        'CC003',
        'VENDAS',
        'loja-001',
      );

      expect(resultado.nivelRequerido).toBe(NivelAlcada.DIRETORIA);
      expect(resultado.aprovadorRequerido).toBe('DIRETORIA');
      expect(resultado.valorEstimado).toBe(5000);
      expect(resultado.centroCusto).toBe('CC003');
      expect(resultado.podeAprovar).toBe(true);
    });

    it('deve bloquear aprovação quando orçamento insuficiente', async () => {
      // Mock para retornar orçamento insuficiente
      jest.spyOn(service as any, 'verificarOrcamentoDisponivel').mockResolvedValue(100);

      const resultado = await service.validarAprovacaoAlcada(
        5000,
        'CC003',
        'VENDAS',
        'loja-001',
      );

      expect(resultado.podeAprovar).toBe(false);
      expect(resultado.motivoBloqueio).toContain('Orçamento insuficiente');
    });
  });

  describe('aprovarOSInterna', () => {
    const mockOS = {
      id: 'os-001',
      tipo_os: 'INTERNA',
      valor_estimado: 1500,
      centro_custo: 'CC001',
      departamento_solicitante: 'MARKETING',
      loja_id: 'loja-001',
      cliente: null,
    };

    beforeEach(() => {
      mockPrismaService.ordemServico.findUnique.mockResolvedValue(mockOS);
      mockPrismaService.ordemServico.update.mockResolvedValue({ ...mockOS, status: 'APROVADA_ORCAMENTARIA' });
    });

    it('deve aprovar OS interna com sucesso', async () => {
      await service.aprovarOSInterna('os-001', 'user-001', 'GERENTE_MARKETING', 'Aprovado');

      expect(mockPrismaService.ordemServico.findUnique).toHaveBeenCalledWith({
        where: { id: 'os-001' },
        include: { cliente: true },
      });

      expect(mockPrismaService.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 'os-001' },
        data: {
          aprovacao_gerencial: StatusAprovacao.APROVADA,
          aprovacao_gerencial_por: 'user-001',
          aprovacao_gerencial_em: expect.any(Date),
          aprovacao_gerencial_obs: 'Aprovado',
          status: 'APROVADA_ORCAMENTARIA',
          modificado_por: 'user-001',
          motivo_modificacao: 'Aprovação por alçada',
          versao: { increment: 1 },
        },
      });
    });

    it('deve rejeitar OS que não é interna', async () => {
      mockPrismaService.ordemServico.findUnique.mockResolvedValue({
        ...mockOS,
        tipo_os: 'COMERCIAL',
      });

      await expect(
        service.aprovarOSInterna('os-001', 'user-001', 'GERENTE_MARKETING', 'Aprovado'),
      ).rejects.toThrow('Aprovação por alçada só é válida para OS Interna');
    });

    it('deve rejeitar OS não encontrada', async () => {
      mockPrismaService.ordemServico.findUnique.mockResolvedValue(null);

      await expect(
        service.aprovarOSInterna('os-001', 'user-001', 'GERENTE_MARKETING', 'Aprovado'),
      ).rejects.toThrow('OS não encontrada');
    });
  });

  describe('rejeitarOSInterna', () => {
    const mockOS = {
      id: 'os-001',
      tipo_os: 'INTERNA',
      valor_estimado: 1500,
      centro_custo: 'CC001',
      departamento_solicitante: 'MARKETING',
      loja_id: 'loja-001',
    };

    beforeEach(() => {
      mockPrismaService.ordemServico.findUnique.mockResolvedValue(mockOS);
      mockPrismaService.ordemServico.update.mockResolvedValue({ ...mockOS, status: 'REJEITADA_ORCAMENTARIA' });
    });

    it('deve rejeitar OS interna com sucesso', async () => {
      await service.rejeitarOSInterna('os-001', 'user-001', 'Orçamento insuficiente');

      expect(mockPrismaService.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 'os-001' },
        data: {
          aprovacao_gerencial: StatusAprovacao.REJEITADA,
          aprovacao_gerencial_por: 'user-001',
          aprovacao_gerencial_em: expect.any(Date),
          aprovacao_gerencial_obs: 'Orçamento insuficiente',
          status: 'REJEITADA_ORCAMENTARIA',
          modificado_por: 'user-001',
          motivo_modificacao: 'Rejeição por alçada',
          versao: { increment: 1 },
        },
      });
    });
  });

  describe('listarOSPendentesAprovacao', () => {
    const mockOSPendentes = [
      {
        id: 'os-001',
        tipo_os: 'INTERNA',
        valor_orcado: 1500,
        centro_custo: 'CC001',
        departamento_solicitante: 'MARKETING',
        status: 'AGUARDANDO_APROVACAO_ORCAMENTARIA',
        aprovacao_gerencial: StatusAprovacao.PENDENTE,
        cliente: null,
      },
      {
        id: 'os-002',
        tipo_os: 'INTERNA',
        valor_orcado: 300,
        centro_custo: 'CC002',
        departamento_solicitante: 'PRODUCAO',
        status: 'AGUARDANDO_APROVACAO_ORCAMENTARIA',
        aprovacao_gerencial: StatusAprovacao.PENDENTE,
        cliente: null,
      },
    ];

    beforeEach(() => {
      mockPrismaService.ordemServico.findMany.mockResolvedValue(mockOSPendentes);
      mockPrismaService.ordemServico.count.mockResolvedValue(2);
    });

    it('deve listar OS pendentes de aprovação', async () => {
      const resultado = await service.listarOSPendentesAprovacao(
        'loja-001',
        'GERENTE_MARKETING',
        1,
        10,
      );

      expect(resultado.data).toHaveLength(2);
      expect(resultado.total).toBe(2);
      expect(resultado.page).toBe(1);
      expect(resultado.limit).toBe(10);
    });

    it('deve filtrar OS por alçada do aprovador', async () => {
      // Mock para retornar apenas OS que o usuário pode aprovar
      const mockOSPendentesFiltradas = [
        {
          id: 'os-002',
          tipo_os: 'INTERNA',
          valor_orcado: 300,
          centro_custo: 'CC002',
          departamento_solicitante: 'PRODUCAO',
          status: 'AGUARDANDO_APROVACAO_ORCAMENTARIA',
          aprovacao_gerencial: StatusAprovacao.PENDENTE,
          cliente: null,
        },
      ];

      mockPrismaService.ordemServico.findMany.mockResolvedValue(mockOSPendentesFiltradas);
      mockPrismaService.ordemServico.count.mockResolvedValue(1);

      const resultado = await service.listarOSPendentesAprovacao(
        'loja-001',
        'USUARIO', // Cargo sem permissão para aprovar OS de R$ 1500
        1,
        10,
      );

      // Deve retornar apenas a OS de R$ 300 (aprovação automática)
      expect(resultado.data).toHaveLength(1);
      expect(resultado.data[0].id).toBe('os-002');
    });
  });

  describe('obterEstatisticasAprovacao', () => {
    const mockEstatisticas = [
      {
        aprovacao_gerencial: StatusAprovacao.APROVADA,
        _count: { id: 5 },
        _sum: { valor_orcado: 7500 },
      },
      {
        aprovacao_gerencial: StatusAprovacao.REJEITADA,
        _count: { id: 2 },
        _sum: { valor_orcado: 3000 },
      },
      {
        aprovacao_gerencial: StatusAprovacao.PENDENTE,
        _count: { id: 3 },
        _sum: { valor_orcado: 4500 },
      },
    ];

    beforeEach(() => {
      // Mock para a nova implementação com findMany
      const mockOSInternas = [
        { aprovacao_gerencial: StatusAprovacao.APROVADA, valor_orcado: 1500 },
        { aprovacao_gerencial: StatusAprovacao.APROVADA, valor_orcado: 2000 },
        { aprovacao_gerencial: StatusAprovacao.REJEITADA, valor_orcado: 1000 },
        { aprovacao_gerencial: StatusAprovacao.PENDENTE, valor_orcado: 500 },
      ];
      mockPrismaService.ordemServico.findMany.mockResolvedValue(mockOSInternas);
    });

    it('deve obter estatísticas de aprovação', async () => {
      const resultado = await service.obterEstatisticasAprovacao('loja-001');

      expect(resultado).toHaveLength(3);
      expect(resultado).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            status: StatusAprovacao.APROVADA,
            quantidade: 2,
            valorTotal: 3500,
          }),
          expect.objectContaining({
            status: StatusAprovacao.REJEITADA,
            quantidade: 1,
            valorTotal: 1000,
          }),
          expect.objectContaining({
            status: StatusAprovacao.PENDENTE,
            quantidade: 1,
            valorTotal: 500,
          }),
        ])
      );
    });

    it('deve obter estatísticas com período específico', async () => {
      const dataInicio = new Date('2025-01-01');
      const dataFim = new Date('2025-01-31');

      await service.obterEstatisticasAprovacao('loja-001', dataInicio, dataFim);

      expect(mockPrismaService.ordemServico.findMany).toHaveBeenCalledWith({
        where: {
          loja_id: 'loja-001',
          tipo_os: 'INTERNA',
          criado_em: {
            gte: dataInicio,
            lte: dataFim,
          },
        },
        select: {
          aprovacao_gerencial: true,
          valor_orcado: true,
        },
      });
    });
  });
});
