/**
 * Testes das validações de transição (estoque/arte) via reflexão dos métodos privados.
 * Cobre o contrato P1-3 sem subir o NestModule completo.
 */
import { OSService } from '../os.service';
import {
  isArteOkParaPcp,
  produtoRequerArte,
} from '../../utils/os-liberacao-pcp.util';

describe('OSService validações P1-3 (estoque/arte)', () => {
  const prisma = {
    ordemServico: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    itemOS: {
      findMany: jest.fn(),
    },
    insumo: {
      findMany: jest.fn(),
    },
  };

  const validacaoEstoqueService = {
    validarProdutoEstoque: jest.fn(),
  };

  let service: OSService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OSService(
      prisma as any,
      {} as any, // documentCodeService
      validacaoEstoqueService as any,
      {} as any, // alcadasOrcamentoService
      {} as any, // eventosAutomaticosService
      {} as any, // osApprovalPermissionsService
      {} as any, // osValidacoesService
      {} as any, // workflowAssignmentService
      {} as any, // expedicaoCriacaoService
      {} as any, // itemOSInstalacaoCriacaoService
      {} as any, // arteProducaoService
      {} as any, // pcpBloqueioSinalService
    );
  });

  describe('validarArteAnexada', () => {
    const call = (osId: string) =>
      (service as any).validarArteAnexada(osId) as Promise<boolean>;

    it('retorna true quando nenhum item exige arte', async () => {
      prisma.itemOS.findMany.mockResolvedValue([
        {
          responsabilidade_arte: 'NAO_APLICA',
          status_arte: 'NAO_APLICA',
          produto_servico: 'Banner',
        },
      ]);
      await expect(call('os-1')).resolves.toBe(true);
    });

    it('retorna false quando item exige arte e status não está ok', async () => {
      prisma.itemOS.findMany.mockResolvedValue([
        {
          responsabilidade_arte: 'EMPRESA_CRIA',
          status_arte: 'EM_CRIACAO',
          produto_servico: 'Fachada',
        },
      ]);
      expect(
        produtoRequerArte('EMPRESA_CRIA', 'EM_CRIACAO'),
      ).toBe(true);
      expect(isArteOkParaPcp('EMPRESA_CRIA', 'EM_CRIACAO')).toBe(false);
      await expect(call('os-1')).resolves.toBe(false);
    });

    it('retorna true quando arte aprovada', async () => {
      prisma.itemOS.findMany.mockResolvedValue([
        {
          responsabilidade_arte: 'EMPRESA_CRIA',
          status_arte: 'APROVADA',
          produto_servico: 'Fachada',
        },
      ]);
      await expect(call('os-1')).resolves.toBe(true);
    });
  });

  describe('validarEstoqueDisponivel', () => {
    const call = (osId: string) =>
      (service as any).validarEstoqueDisponivel(osId) as Promise<boolean>;

    it('retorna true sem insumos controlados', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue({
        id: 'os-1',
        loja_id: 'loja-1',
        nome_servico: 'Serviço',
        quantidade: 1,
        insumos_calculados: JSON.stringify([
          { insumo_id: 'ins-1', quantidade_necessaria: 2, unidade: 'un' },
        ]),
        orcamento_id: null,
        parametros_tecnicos: null,
      });
      prisma.insumo.findMany.mockResolvedValue([]);
      prisma.ordemServico.update.mockResolvedValue({});

      await expect(call('os-1')).resolves.toBe(true);
      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 'os-1' },
        data: { materiais_disponivel: true },
      });
    });

    it('retorna false quando ValidacaoEstoqueService gera alertas', async () => {
      prisma.ordemServico.findUnique.mockResolvedValue({
        id: 'os-1',
        loja_id: 'loja-1',
        nome_servico: 'Serviço',
        quantidade: 1,
        insumos_calculados: JSON.stringify([
          { insumo_id: 'ins-1', quantidade_necessaria: 10, unidade: 'm' },
        ]),
        orcamento_id: null,
        parametros_tecnicos: null,
      });
      prisma.insumo.findMany.mockResolvedValue([{ id: 'ins-1' }]);
      validacaoEstoqueService.validarProdutoEstoque.mockResolvedValue({
        alertas: ['Estoque insuficiente'],
        recomendacoes: [],
        estoque_disponivel: [],
      });
      prisma.ordemServico.update.mockResolvedValue({});

      await expect(call('os-1')).resolves.toBe(false);
      expect(prisma.ordemServico.update).toHaveBeenCalledWith({
        where: { id: 'os-1' },
        data: { materiais_disponivel: false },
      });
    });
  });
});
