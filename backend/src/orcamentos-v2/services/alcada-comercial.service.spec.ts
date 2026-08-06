import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AlcadaComercialService } from './alcada-comercial.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VendasPermissionsService } from '../../vendas/permissions/vendas-permissions.service';
import { TransicaoComercialService } from './transicao-comercial.service';
import { OrcamentoStatusComercial } from '../domain/status-comercial';
import { EVENTOS_COMERCIAIS } from '../domain/eventos-comerciais';

describe('AlcadaComercialService (Incremento 7.1 / Fase 7)', () => {
  let service: AlcadaComercialService;
  let prismaMock: {
    orcamento: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
    };
  };
  let permissionsMock: {
    pode: jest.Mock;
    assertPode: jest.Mock;
  };
  let transicaoMock: {
    executar: jest.Mock;
  };

  beforeEach(async () => {
    prismaMock = {
      orcamento: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
    };

    permissionsMock = {
      pode: jest.fn().mockResolvedValue(false),
      assertPode: jest.fn().mockResolvedValue(true),
    };

    transicaoMock = {
      executar: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlcadaComercialService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: VendasPermissionsService, useValue: permissionsMock },
        { provide: TransicaoComercialService, useValue: transicaoMock },
      ],
    }).compile();

    service = module.get<AlcadaComercialService>(AlcadaComercialService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('1. desconto dentro do limite (<= 10%) não requer alçada comercial', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-1',
      loja_id: 'loja-A',
      ativo: true,
      preco_base: 100,
      preco_final: 95, // 5% de desconto
      status_comercial: OrcamentoStatusComercial.RASCUNHO,
    });

    const res = await service.validarEDefinirAlcada('orc-1', 'vendedor-1', 'loja-A', 10);

    expect(res.requerAlcada).toBe(false);
    expect(res.promovidoParaAlcada).toBe(false);
    expect(transicaoMock.executar).not.toHaveBeenCalled();
  });

  it('2. desconto acima da alçada (15%) por vendedor comum promove rascunho -> aguardando_alcada', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-2',
      loja_id: 'loja-A',
      ativo: true,
      preco_base: 100,
      preco_final: 85, // 15% de desconto
      status_comercial: OrcamentoStatusComercial.RASCUNHO,
    });

    permissionsMock.pode.mockResolvedValue(false); // Vendedor sem ALCADA_APROVAR

    const res = await service.validarEDefinirAlcada('orc-2', 'vendedor-1', 'loja-A', 10);

    expect(res.requerAlcada).toBe(true);
    expect(res.promovidoParaAlcada).toBe(true);
    expect(transicaoMock.executar).toHaveBeenCalledWith({
      orcamentoId: 'orc-2',
      lojaId: 'loja-A',
      origemStatus: OrcamentoStatusComercial.RASCUNHO,
      destinoStatus: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
      origemAcao: 'VENDEDOR',
      autor: 'vendedor-1',
      tipoAuditoria: 'solicitacao_alcada_comercial',
      descricao: expect.stringContaining('Desconto de 15.0% excede o limite'),
      evento: EVENTOS_COMERCIAIS.ALCADA_SOLICITADA,
    });
  });

  it('3. usuário com permissão ALCADA_APROVAR aprova desconto elevado sem cair em aguardando_alcada', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-3',
      loja_id: 'loja-A',
      ativo: true,
      preco_base: 100,
      preco_final: 80, // 20% de desconto
      status_comercial: OrcamentoStatusComercial.RASCUNHO,
    });

    permissionsMock.pode.mockResolvedValue(true); // Gestor / Admin com ALCADA_APROVAR

    const res = await service.validarEDefinirAlcada('orc-3', 'gestor-1', 'loja-A', 10);

    expect(res.requerAlcada).toBe(true);
    expect(res.promovidoParaAlcada).toBe(false);
    expect(transicaoMock.executar).not.toHaveBeenCalled();
  });

  it('4. gestor aprova alçada comercial pendente (aguardando_alcada -> enviada)', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-4',
      loja_id: 'loja-A',
      ativo: true,
      status_comercial: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
    });

    await service.decidirAlcada(
      'orc-4',
      'gestor-1',
      'loja-A',
      true,
      'Desconto comercial aprovado devido ao volume do cliente',
    );

    expect(permissionsMock.assertPode).toHaveBeenCalled();
    expect(transicaoMock.executar).toHaveBeenCalledWith({
      orcamentoId: 'orc-4',
      lojaId: 'loja-A',
      origemStatus: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
      destinoStatus: OrcamentoStatusComercial.ENVIADA,
      origemAcao: 'GESTOR',
      autor: 'gestor-1',
      tipoAuditoria: 'aprovacao_alcada_comercial',
      descricao: expect.stringContaining('Alçada comercial APROVADA pelo gestor'),
      evento: EVENTOS_COMERCIAIS.ALCADA_DECIDIDA,
    });
  });

  it('5. gestor rejeita alçada comercial com justificativa (aguardando_alcada -> perdida)', async () => {
    prismaMock.orcamento.findFirst.mockResolvedValue({
      id: 'orc-5',
      loja_id: 'loja-A',
      ativo: true,
      status_comercial: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
    });

    await service.decidirAlcada(
      'orc-5',
      'gestor-1',
      'loja-A',
      false,
      'Margem bruta insuficiente para a operação',
    );

    expect(transicaoMock.executar).toHaveBeenCalledWith({
      orcamentoId: 'orc-5',
      lojaId: 'loja-A',
      origemStatus: OrcamentoStatusComercial.AGUARDANDO_ALCADA,
      destinoStatus: OrcamentoStatusComercial.PERDIDA,
      origemAcao: 'GESTOR',
      autor: 'gestor-1',
      motivoPerda: 'Margem bruta insuficiente para a operação',
      tipoAuditoria: 'rejeicao_alcada_comercial',
      descricao: expect.stringContaining('Alçada comercial REJEITADA pelo gestor'),
      evento: EVENTOS_COMERCIAIS.ALCADA_DECIDIDA,
    });
  });

  it('6. exige justificativa válida para decisão de alçada', async () => {
    await expect(
      service.decidirAlcada('orc-6', 'gestor-1', 'loja-A', true, '  '),
    ).rejects.toThrow(BadRequestException);
  });

  it('7. expurga custos e margem quando o usuário não possui permissão RBAC de visualização', () => {
    const { sanitizarCustosEMargem } = require('../domain/sanitizar-custos-orcamento');

    const orcamentoCompleto = {
      id: 'orc-secret',
      preco_final: 500,
      custo_total: 350,
      custo_material: 200,
      margem_lucro: 30,
      itens: [
        { id: 'item-1', nome: 'Placa ACM', custo_total: 100, preco_final: 150 },
      ],
    };

    // Usuário sem ver custos nem margem
    const sanitizado = sanitizarCustosEMargem(orcamentoCompleto, false, false);

    expect(sanitizado.preco_final).toBe(500);
    expect(sanitizado.custo_total).toBeUndefined();
    expect(sanitizado.custo_material).toBeUndefined();
    expect(sanitizado.margem_lucro).toBeUndefined();
    expect(sanitizado.itens[0].custo_total).toBeUndefined();
    expect(sanitizado.itens[0].preco_final).toBe(150);
  });
});
