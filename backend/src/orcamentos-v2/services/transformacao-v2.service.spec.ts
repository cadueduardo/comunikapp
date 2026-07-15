import { TransformacaoV2Service } from './transformacao-v2.service';

describe('TransformacaoV2Service', () => {
  let service: TransformacaoV2Service;

  beforeEach(() => {
    service = new TransformacaoV2Service();
  });

  it('prepara rascunho com dois produtos sem repassar campos derivados ao Prisma', () => {
    const resultado = service.prepararDadosCriacao(
      {
        titulo: 'Rascunho com dois produtos',
        preco_final: 250,
        valor_final_manual: 250,
        preco_final_manual: true,
        alerta_preco_abaixo_custo: false,
        configuracoes: {
          tipo_margem_lucro: 'markup',
          valor_final_manual: 250,
        },
        produtos: [
          { nome: 'Produto 1', quantidade: 2 },
          { nome: 'Produto 2', quantidade: 1.5 },
        ],
      },
      'loja-1',
      'usuario-1',
    );

    expect(resultado.produtos.create).toHaveLength(2);
    expect(resultado.produtos.create[0].quantidade).toBe(2);
    expect(resultado.produtos.create[1].quantidade).toBe(1.5);
    expect(resultado.valor_final_manual).toBeUndefined();
    expect(resultado.preco_final_manual).toBeUndefined();
    expect(resultado.alerta_preco_abaixo_custo).toBeUndefined();
    expect(JSON.parse(resultado.configuracao_calculo)).toMatchObject({
      tipo_margem_lucro: 'markup',
      valor_final_manual: 250,
    });
  });

  it('restaura o valor final manual salvo na configuracao do orcamento', () => {
    const resultado = service.transformarParaInterface({
      id: 'orcamento-1',
      configuracao_calculo: JSON.stringify({ valor_final_manual: 250 }),
      produtos: [],
    });

    expect(resultado.valor_final_manual).toBe(250);
    expect(resultado.configuracoes).toMatchObject({
      valor_final_manual: 250,
    });
  });

  it('prepara update com entrega e cliente usando relacionamentos do Prisma', () => {
    const resultado = service.prepararDadosAtualizacao(
      {
        titulo: 'Rascunho reaberto',
        cliente_id: 'cliente-1',
        entrega_usar_endereco_cliente: true,
        entrega_valor_cobrado: 0,
        entrega_custo_estimado: 0,
      },
      {
        id: 'orcamento-1',
        loja_id: 'loja-1',
        produtos: [],
        configuracoes: {},
      } as any,
    );

    expect(resultado.cliente).toEqual({ connect: { id: 'cliente-1' } });
    expect(resultado.entrega_modalidade).toEqual({ disconnect: true });
    expect(resultado.entrega_modalidade_id).toBeUndefined();
    expect(resultado.entrega_valor_cobrado).toBe(0);
    expect(resultado.entrega_custo_estimado).toBe(0);
  });

  it('persiste e restaura a condicao de pagamento estruturada', () => {
    const condicaoPagamento = {
      condicao_pagamento_tipo: 'PARCELADO',
      condicao_pagamento_entrada_pct: 30,
      condicao_pagamento_parcelas: 3,
      condicao_pagamento_descricao: 'Entrada e três parcelas',
    };

    const criacao = service.prepararDadosCriacao(
      {
        titulo: 'Orçamento parcelado',
        produtos: [],
        ...condicaoPagamento,
      },
      'loja-1',
      'usuario-1',
    );
    const atualizacao = service.prepararDadosAtualizacao(condicaoPagamento, {
      id: 'orcamento-1',
      loja_id: 'loja-1',
      produtos: [],
      configuracoes: {},
    } as any);
    const interfaceOrcamento = service.transformarParaInterface({
      id: 'orcamento-1',
      produtos: [],
      ...condicaoPagamento,
    });

    expect(criacao).toMatchObject(condicaoPagamento);
    expect(atualizacao).toMatchObject(condicaoPagamento);
    expect(interfaceOrcamento).toMatchObject(condicaoPagamento);
  });

  it('recalcula o custo terceirizado no backend e ignora o total do cliente', () => {
    const resultado = service.prepararDadosCriacao(
      {
        titulo: 'Orçamento terceirizado',
        produtos: [
          {
            nome: 'Estrutura metálica',
            quantidade: 3,
            modo_fulfillment: 'OUTSOURCE',
            fornecedor_terceirizado_id: 'fornecedor-1',
            terceirizacao_custo_unitario: 125.5,
            terceirizacao_custo_setup: 30,
            terceirizacao_custo_frete: 18.5,
            terceirizacao_custo_total: 1,
          },
        ],
      },
      'loja-1',
      'usuario-1',
    );

    expect(resultado.produtos.create[0]).toMatchObject({
      fornecedor_terceirizado_id: 'fornecedor-1',
      terceirizacao_custo_unitario: 125.5,
      terceirizacao_custo_setup: 30,
      terceirizacao_custo_frete: 18.5,
      terceirizacao_custo_total: 425,
    });
  });

  it('preserva o preço fechado e a quantidade cotada no round-trip', () => {
    const resultado = service.prepararDadosCriacao(
      {
        titulo: 'Orçamento com cotação fechada',
        produtos: [
          {
            nome: 'Lote de banners',
            quantidade: 25,
            modo_fulfillment: 'OUTSOURCE',
            fornecedor_terceirizado_id: 'fornecedor-1',
            terceirizacao_modelo_custo: 'PRECO_FECHADO',
            terceirizacao_quantidade_cotada: 25,
            terceirizacao_custo_unitario: 999,
            terceirizacao_custo_setup: 999,
            terceirizacao_custo_frete: 999,
            terceirizacao_custo_total: 1000,
          },
        ],
      },
      'loja-1',
      'usuario-1',
    );

    expect(resultado.produtos.create[0]).toMatchObject({
      terceirizacao_modelo_custo: 'PRECO_FECHADO',
      terceirizacao_quantidade_cotada: 25,
      terceirizacao_custo_unitario: null,
      terceirizacao_custo_setup: null,
      terceirizacao_custo_frete: null,
      terceirizacao_custo_total: 1000,
    });

    const interfaceOrcamento = service.transformarParaInterface({
      id: 'orcamento-1',
      produtos: [resultado.produtos.create[0]],
    });
    expect(interfaceOrcamento.produtos[0]).toMatchObject({
      terceirizacao_modelo_custo: 'PRECO_FECHADO',
      terceirizacao_quantidade_cotada: 25,
      terceirizacao_custo_total: 1000,
    });
  });

  it('limpa os dados de terceirizacao ao voltar para producao interna', () => {
    const resultado = service.prepararDadosCriacao(
      {
        titulo: 'Orçamento interno',
        produtos: [
          {
            nome: 'Fachada',
            quantidade: 1,
            modo_fulfillment: 'MAKE',
            fornecedor_terceirizado_id: 'fornecedor-antigo',
            terceirizacao_custo_unitario: 100,
            terceirizacao_custo_total: 100,
          },
        ],
      },
      'loja-1',
      'usuario-1',
    );

    expect(resultado.produtos.create[0]).toMatchObject({
      modo_fulfillment: 'MAKE',
      fornecedor_terceirizado_id: null,
      terceirizacao_custo_unitario: null,
      terceirizacao_custo_total: null,
    });
  });
});
