import { randomUUID } from 'crypto';
import { existsSync } from 'fs';
import { readdir, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  FulfillmentPadrao,
  ModoFulfillmentItem,
  ModoPersonalizacao,
} from '@prisma/client';
import { ArteProducaoService } from '../producao/arte-producao.service';
import { EstampaArteMestraService } from '../estampas/estampa-arte-mestra.service';
import { VdpPdfMergeProvider } from '../producao/vdp-pdf-merge.provider';
import { OSService } from '../../os/services/os.service';
import {
  clonarJsonSnapshot,
  resolverPropagacaoPersonalizacaoItemOS,
} from '../../os/utils/item-os-personalizacao.util';

/**
 * Teste de integração estrutural do fluxo Catálogo → Orçamento → OS → Arte VDP.
 * Não depende de banco real: valida montagem de itens e geração de PDF em disco temporário.
 */
describe('Catalogo — fluxo ponta a ponta (integração estrutural)', () => {
  const lojaId = 'loja-catalogo-e2e';
  const itemOsId = 'item-os-e2e-001';
  let uploadsDir: string;
  let arteService: ArteProducaoService;

  const valoresVdpOriginais = [
    { nome_colaborador: 'Ana Silva', departamento: 'RH' },
    { nome_colaborador: 'Bruno Costa', departamento: 'TI' },
    { nome_colaborador: 'Carla Souza', departamento: 'Vendas' },
  ];

  const orcamentoFixture = {
    id: 'orc-e2e-001',
    numero: 'ORC-E2E-001',
    loja_id: lojaId,
    produtos: [
      {
        id: 'prod-orc-e2e-001',
        nome_servico: 'Caneca Corporativa 350ml',
        quantidade: 3,
        tipo_item: 'PRODUTO_FINITO',
        produto_finito: {
          personalizavel: true,
          fulfillment_padrao: FulfillmentPadrao.HIBRIDO,
          loja_id: lojaId,
        },
        personalizacao: {
          modo: ModoPersonalizacao.ESTAMPA,
          estampa_id: 'estampa-e2e-001',
          processo_id: 'processo-e2e-001',
          valores_campos: valoresVdpOriginais,
          grade_distribuicao: null,
        },
      },
    ],
  };

  beforeEach(() => {
    uploadsDir = join(tmpdir(), `catalogo-e2e-${randomUUID()}`);
    process.env.COMUNIKAPP_UPLOADS_DIR = uploadsDir;
  });

  afterEach(async () => {
    delete process.env.COMUNIKAPP_UPLOADS_DIR;
    if (uploadsDir && existsSync(uploadsDir)) {
      await rm(uploadsDir, { recursive: true, force: true });
    }
  });

  function criarOsServiceMinimo(): OSService {
    return new OSService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  }

  it('propaga personalização do orçamento para ItemOS com fulfillment industrial', () => {
    const osService = criarOsServiceMinimo();
    const itens = (
      osService as unknown as {
        montarItensOSDoOrcamento: (o: unknown, l: string) => unknown[];
      }
    ).montarItensOSDoOrcamento(orcamentoFixture, lojaId);

    expect(itens).toHaveLength(1);
    const item = itens[0] as Record<string, unknown>;

    expect(item.modo_fulfillment).toBe(ModoFulfillmentItem.HIBRIDO);
    expect(item.personalizacao_modo).toBe(ModoPersonalizacao.ESTAMPA);
    expect(item.estampa_id).toBe('estampa-e2e-001');
    expect(item.valores_personalizacao).toEqual(valoresVdpOriginais);

    const snapshot = item.valores_personalizacao as typeof valoresVdpOriginais;
    expect(snapshot).not.toBe(valoresVdpOriginais);
    expect(clonarJsonSnapshot(valoresVdpOriginais)).toEqual(
      valoresVdpOriginais,
    );
  });

  it('gera PDF de arte de produção no storage isolado do tenant', async () => {
    const prismaMock = {
      itemOS: {
        findFirst: jest.fn().mockResolvedValue({
          id: itemOsId,
          os_id: 'os-e2e-001',
          produto_servico: 'Caneca Corporativa 350ml',
          quantidade: 3,
          modo_fulfillment: ModoFulfillmentItem.HIBRIDO,
          personalizacao_modo: ModoPersonalizacao.IMPRINT_LIVRE,
          valores_personalizacao: valoresVdpOriginais,
          estampa: null,
          os: { id: 'os-e2e-001', loja_id: lojaId, numero: 'OS-E2E-001' },
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      ordemServicoLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-1' }),
      },
    };

    const estampaArteMock = {
      obterConteudoArteMestra: jest.fn(),
    } as unknown as EstampaArteMestraService;

    arteService = new ArteProducaoService(
      prismaMock as never,
      estampaArteMock,
      new VdpPdfMergeProvider(),
    );

    const url = await arteService.gerarArteProducaoItemOS(itemOsId, lojaId);

    expect(url).toMatch(/^\/catalogo\/producao\/arquivo\//);
    expect(prismaMock.itemOS.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: itemOsId, os: { loja_id: lojaId } },
        data: expect.objectContaining({ arte_producao_url: url }),
      }),
    );

    const lojaDir = join(uploadsDir, lojaId, 'producao');
    const arquivos = await readdir(lojaDir);
    const pdf = arquivos.find((f) => f.endsWith('.pdf'));
    expect(pdf).toBeDefined();

    const conteudo = await readFile(join(lojaDir, pdf), { encoding: null });
    expect(conteudo.subarray(0, 4).toString()).toBe('%PDF');

    const metaFile = arquivos.find((f) => f.endsWith('.json'));
    expect(metaFile).toBeDefined();
    const meta = JSON.parse(await readFile(join(lojaDir, metaFile), 'utf8'));
    expect(meta.loja_id).toBe(lojaId);
    expect(meta.item_os_id).toBe(itemOsId);
    expect(meta.lote_tamanho).toBe(3);
  });

  it('valida motor de roteamento MAKE para fulfillment PRODUCAO', () => {
    const resultado = resolverPropagacaoPersonalizacaoItemOS({
      tipoItem: 'PRODUTO_FINITO',
      produtoFinito: {
        personalizavel: true,
        fulfillment_padrao: FulfillmentPadrao.PRODUCAO,
        loja_id: lojaId,
      },
      personalizacao: {
        modo: ModoPersonalizacao.ESTAMPA,
        estampa_id: 'estampa-1',
        valores_campos: { nome_colaborador: 'Teste' },
      },
    });

    expect(resultado.modo_fulfillment).toBe(ModoFulfillmentItem.MAKE);
    expect(resultado.snapshot_auditoria?.imutavel).toBe(true);
  });
});
