import {
  itemRequerFabricaPcp,
  itemTemInsumosProducao,
  computeStatusOSLiberacaoFromItens,
  resolverTipoItemOrcamento,
} from './os-liberacao-pcp.util';

describe('os-liberacao-pcp.util — fulfillment', () => {
  it('SOB_DEMANDA exige PCP mesmo com modo_fulfillment PICK legado', () => {
    expect(
      itemRequerFabricaPcp({
        tipo_item: 'SOB_DEMANDA',
        modo_fulfillment: 'PICK',
        personalizacao_modo: null,
        responsabilidade_arte: 'NAO_APLICAVEL',
      }),
    ).toBe(true);
  });

  it('PRODUTO_FINITO sem personalização vai para expedição', () => {
    expect(
      itemRequerFabricaPcp({
        tipo_item: 'PRODUTO_FINITO',
        modo_fulfillment: 'PICK',
        personalizacao_modo: null,
        responsabilidade_arte: 'NAO_APLICAVEL',
      }),
    ).toBe(false);
  });

  it('inferência por insumos de produção', () => {
    const insumos = JSON.stringify([{ insumo_id: 'abc', nome: 'Vinil' }]);
    expect(itemTemInsumosProducao(insumos)).toBe(true);
    expect(
      resolverTipoItemOrcamento({ insumos_necessarios: insumos }),
    ).toBe('SOB_DEMANDA');
  });

  it('OS-2026-023 — adesivo laminado (cenário real)', () => {
    expect(
      itemRequerFabricaPcp({
        tipo_item: 'SOB_DEMANDA',
        modo_fulfillment: 'PICK',
        responsabilidade_arte: 'CLIENTE_FORNECE',
      }),
    ).toBe(true);
  });

  it('OS-2026-023 — expositor cúpula (cenário real)', () => {
    expect(
      itemRequerFabricaPcp({
        tipo_item: 'PRODUTO_FINITO',
        modo_fulfillment: 'PICK',
        responsabilidade_arte: 'NAO_APLICAVEL',
      }),
    ).toBe(false);
  });

  it('status agregado ignora produto finito de expedição', () => {
    const agregado = computeStatusOSLiberacaoFromItens([
      {
        id: '1',
        produto_servico: 'Adesivo',
        tipo_item: 'SOB_DEMANDA',
        status_liberacao_pcp: 'LIBERADO',
      },
      {
        id: '2',
        produto_servico: 'Expositor',
        tipo_item: 'PRODUTO_FINITO',
        modo_fulfillment: 'PICK',
        status_liberacao_pcp: 'PENDENTE',
      },
    ]);
    expect(agregado).toBe('COMPLETO');
  });
});
