import { Test, TestingModule } from '@nestjs/testing';
import { TipoOcorrencia } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InstalacaoSplitFiscalService } from './instalacao-split-fiscal.service';
import { tipoFaturamentoOcorrencia } from '../utils/split-fiscal.util';

describe('InstalacaoSplitFiscalService', () => {
  let service: InstalacaoSplitFiscalService;

  const prismaMock = {
    ordemServico: { findFirst: jest.fn() },
    produtoOrcamento: { findMany: jest.fn() },
    ocorrenciaInstalacao: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstalacaoSplitFiscalService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(InstalacaoSplitFiscalService);
  });

  it('classifica material extra como PRODUTO e visita como SERVICO', () => {
    expect(tipoFaturamentoOcorrencia(TipoOcorrencia.MATERIAL_EXTRA)).toBe(
      'PRODUTO',
    );
    expect(tipoFaturamentoOcorrencia(TipoOcorrencia.VISITA_IMPRODUTIVA)).toBe(
      'SERVICO',
    );
  });

  it('segrega totais de NF-e e NFS-e', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      id: 'os-1',
      orcamento_id: 'orc-1',
    });
    prismaMock.produtoOrcamento.findMany.mockResolvedValue([
      {
        nome_servico: 'Totem',
        nome: null,
        preco_total: 10000,
        instalacao_preco_cobrado: 2000,
        insumos: [{ preco_total: 6000 }],
        servicos_manuais: [{ custo_total: 1000 }],
        maquinas: [],
        funcoes: [],
      },
    ]);
    prismaMock.ocorrenciaInstalacao.findMany.mockResolvedValue([
      {
        tipo: TipoOcorrencia.VISITA_IMPRODUTIVA,
        descricao: 'Portaria barrada',
        preco_cliente: 300,
      },
    ]);

    const split = await service.calcularSplitFiscalOs('os-1', 'loja-1');

    expect(split.total_nfs).toBeGreaterThan(0);
    expect(split.instrucao_nfe).toContain('NF-e');
    expect(split.instrucao_nfs).toContain('NFS-e');
    expect(split.total_geral).toBe(split.total_nfe + split.total_nfs);
  });
});
