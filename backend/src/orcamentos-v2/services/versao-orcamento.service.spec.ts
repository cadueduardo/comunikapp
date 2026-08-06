import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VersaoOrcamentoService } from './versao-orcamento.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calcularHashMaterial,
  houveAlteracaoMaterial,
} from '../domain/versao-orcamento';
import { gerarDiffVersoes, sanitizarObjetoSnapshot } from '../domain/diff-versao-orcamento';

describe('VersaoOrcamentoService & Diff (Incremento 6.4)', () => {
  let service: VersaoOrcamentoService;
  let prismaMock: {
    orcamento: { findFirst: jest.Mock; updateMany: jest.Mock };
    versaoOrcamento: { findFirst: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prismaMock = {
      orcamento: {
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      versaoOrcamento: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VersaoOrcamentoService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<VersaoOrcamentoService>(VersaoOrcamentoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. snapshot anterior permanece byte a byte imutável ao congelar nova versão', async () => {
    const snapshotV1 = {
      atual: {
        id: 'orc-1',
        preco_final: 1000,
        custo_total: 600,
        margem_lucro: 400,
        produtos: [{ nome: 'Banner' }],
      },
    };

    const hashV1 = calcularHashMaterial(snapshotV1);
    const snapOriginalStringified = JSON.stringify(snapshotV1);

    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      loja_id: 'loja-A',
      preco_final: 1500,
      custo_total: 800,
      margem_lucro: 700,
      produtos: [{ nome: 'Banner XL' }],
    });

    prismaMock.versaoOrcamento.findFirst.mockResolvedValue({
      id: 'v1-id',
      versao: 1,
      numero: 1,
      hash_material: hashV1,
      snapshot: snapshotV1,
    });

    prismaMock.versaoOrcamento.create.mockResolvedValue({
      id: 'v2-id',
      versao: 2,
      numero: 2,
      hash_material: 'novo-hash',
    });

    const res = await service.congelarVersaoNoEnvio('orc-1', 'loja-A', 'user-1');

    expect(res.versao).toBe(2);
    // Garante que o snapshot da v1 continuou idêntico sem ser alterado
    expect(JSON.stringify(snapshotV1)).toBe(snapOriginalStringified);
    expect(prismaMock.versaoOrcamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          versao: 2,
          orcamento: { connect: { id: 'orc-1' } },
        }),
      }),
    );
  });

  it('2. atualização produz snapshot completo e imutável', async () => {
    const mockOrcamento = {
      id: 'orc-1',
      loja_id: 'loja-A',
      preco_final: 2000,
      validade_proposta: '15 dias',
      validade_dias: 15,
      produtos: [{ id: 'p1', nome: 'Adesivo' }],
      cliente: { nome: 'Cliente Teste' },
    };

    prismaMock.orcamento.findFirst.mockResolvedValue(mockOrcamento);
    prismaMock.versaoOrcamento.findFirst.mockResolvedValue(null);
    prismaMock.versaoOrcamento.create.mockResolvedValue({
      id: 'v1-id',
      versao: 1,
      numero: 1,
    });

    const res = await service.congelarVersaoNoEnvio('orc-1', 'loja-A', 'user-1');

    expect(res.versao).toBe(1);
    expect(prismaMock.versaoOrcamento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          snapshot: expect.objectContaining({
            atual: expect.objectContaining({
              id: 'orc-1',
              preco_final: 2000,
              produtos: [{ id: 'p1', nome: 'Adesivo' }],
            }),
          }),
        }),
      }),
    );
  });

  it('3. hashes materiais são estáveis para conteúdos comerciais equivalentes', () => {
    const snapA = {
      atual: {
        preco_final: 500,
        validade_dias: 10,
        prazo_entrega: '5 dias',
      },
    };

    const snapB = {
      atual: {
        prazo_entrega: '5 dias',
        preco_final: 500,
        validade_dias: 10,
      },
    };

    const hashA = calcularHashMaterial(snapA);
    const hashB = calcularHashMaterial(snapB);

    expect(hashA).toBe(hashB);
    expect(houveAlteracaoMaterial(snapA, snapB)).toBe(false);
  });

  it('4. aceite de versão antiga ou pertencente a outro orçamento/tenant é negado', async () => {
    // Orçamento atual apontando para versao-enviada-v2
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      loja_id: 'loja-A',
      versao_enviada_id: 'versao-enviada-v2',
    });

    // Tentativa de aceitar versao-antiga-v1
    await expect(
      service.validarVersaoParaAceite('orc-1', 'loja-A', 'versao-antiga-v1'),
    ).rejects.toThrow(BadRequestException);

    // Tentativa de aceitar versão de outra loja
    prismaMock.versaoOrcamento.findFirst.mockResolvedValue(null);
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      loja_id: 'loja-A',
      versao_enviada_id: 'versao-outra-loja',
    });

    await expect(
      service.validarVersaoParaAceite('orc-1', 'loja-A', 'versao-outra-loja'),
    ).rejects.toThrow(BadRequestException);
  });

  it('5. diff não expõe custo/margem e representa todas as alterações de preço, escopo e prazos', () => {
    const snapV1 = {
      atual: {
        preco_final: 1000,
        custo_total: 600,
        custo_material: 400,
        margem_lucro: 400,
        prazo_entrega: '10 dias',
        produtos: [{ id: 'p1', nome: 'Faixa G', quantidade: 1, preco_final: 1000 }],
      },
    };

    const snapV2 = {
      atual: {
        preco_final: 1500,
        custo_total: 900,
        custo_material: 600,
        margem_lucro: 600,
        prazo_entrega: '5 dias',
        produtos: [
          { id: 'p1', nome: 'Faixa G', quantidade: 2, preco_final: 1500 },
          { id: 'p2', nome: 'Lona extra', quantidade: 1, preco_final: 200 },
        ],
      },
    };

    const diff = gerarDiffVersoes(snapV1, snapV2, true);

    expect(diff.houveAlteracaoMaterial).toBe(true);
    expect(diff.resumo.precoAnterior).toBe(1000);
    expect(diff.resumo.precoNovo).toBe(1500);
    expect(diff.resumo.diferencaPreco).toBe(500);
    expect(diff.resumo.produtosAdicionados).toBe(1);

    // Nenhuma chave de custo ou margem pode estar presente no diff sanitizado
    const diffStr = JSON.stringify(diff);
    expect(diffStr).not.toContain('custo_total');
    expect(diffStr).not.toContain('custo_material');
    expect(diffStr).not.toContain('margem_lucro');
  });

  it('6. sanitizarObjetoSnapshot purga recursivamente campos sensíveis', () => {
    const bruto = {
      preco_final: 1000,
      custo_total: 700,
      margem_lucro: 300,
      detalhamento_calculo: { segredo: 123 },
      produtos: [
        {
          nome: 'Totem',
          custo_material: 200,
          preco_total: 1000,
        },
      ],
    };

    const limpo = sanitizarObjetoSnapshot(bruto);

    expect(limpo).toEqual({
      preco_final: 1000,
      produtos: [
        {
          nome: 'Totem',
          preco_total: 1000,
        },
      ],
    });
  });

  it('7. obterVersaoSanitizada impõe filtro estrito de multi-tenancy', async () => {
    prismaMock.versaoOrcamento.findFirst.mockResolvedValue(null);

    await expect(
      service.obterVersaoSanitizada('versao-1', 'orc-1', 'loja-A', true),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.versaoOrcamento.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'versao-1',
        orcamento_id: 'orc-1',
        orcamento: { loja_id: 'loja-A' },
      },
    });
  });
});
