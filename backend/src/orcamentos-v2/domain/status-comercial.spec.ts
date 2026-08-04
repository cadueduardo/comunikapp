import {
  mapearStatusComercialParaAprovacao,
  mapearStatusComercialParaLegado,
  mapearStatusLegadoParaComercial,
  montarAtualizacaoStatusDual,
  OrcamentoStatusComercial,
  OrcamentoStatusLegado,
} from './status-comercial';

describe('status-comercial (DV-14)', () => {
  describe('mapearStatusLegadoParaComercial', () => {
    it.each([
      ['rascunho', false, OrcamentoStatusComercial.RASCUNHO],
      ['pendente', false, OrcamentoStatusComercial.RASCUNHO],
      ['enviado', false, OrcamentoStatusComercial.ENVIADA],
      ['em_analise', false, OrcamentoStatusComercial.ENVIADA],
      ['negociando', false, OrcamentoStatusComercial.EM_NEGOCIACAO],
      ['aprovado', false, OrcamentoStatusComercial.ACEITA],
      ['aprovado', true, OrcamentoStatusComercial.PEDIDO_CONFIRMADO],
      ['rejeitado', false, OrcamentoStatusComercial.PERDIDA],
      ['em_execucao', false, OrcamentoStatusComercial.PEDIDO_CONFIRMADO],
      ['concluido', false, OrcamentoStatusComercial.PEDIDO_CONFIRMADO],
      ['cancelado', false, OrcamentoStatusComercial.CANCELADA],
      ['EXCLUIDO', false, OrcamentoStatusComercial.RASCUNHO],
      [null, false, OrcamentoStatusComercial.RASCUNHO],
    ] as const)(
      'mapeia %s (possuiOs=%s) → %s',
      (legado, possuiOs, esperado) => {
        expect(mapearStatusLegadoParaComercial(legado, possuiOs)).toBe(esperado);
      },
    );

    it('aceita valores já canônicos sem remapear para rascunho', () => {
      expect(
        mapearStatusLegadoParaComercial(
          OrcamentoStatusComercial.AGUARDANDO_ALCADA,
        ),
      ).toBe(OrcamentoStatusComercial.AGUARDANDO_ALCADA);
      expect(
        mapearStatusLegadoParaComercial(OrcamentoStatusComercial.EXPIRADA),
      ).toBe(OrcamentoStatusComercial.EXPIRADA);
    });
  });

  describe('mapearStatusComercialParaLegado', () => {
    it.each([
      [OrcamentoStatusComercial.RASCUNHO, OrcamentoStatusLegado.RASCUNHO],
      [
        OrcamentoStatusComercial.AGUARDANDO_ALCADA,
        OrcamentoStatusLegado.RASCUNHO,
      ],
      [OrcamentoStatusComercial.ENVIADA, OrcamentoStatusLegado.ENVIADO],
      [OrcamentoStatusComercial.EXPIRADA, OrcamentoStatusLegado.ENVIADO],
      [
        OrcamentoStatusComercial.EM_NEGOCIACAO,
        OrcamentoStatusLegado.NEGOCIANDO,
      ],
      [
        OrcamentoStatusComercial.REVISAO_SOLICITADA,
        OrcamentoStatusLegado.NEGOCIANDO,
      ],
      [OrcamentoStatusComercial.ACEITA, OrcamentoStatusLegado.APROVADO],
      [
        OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
        OrcamentoStatusLegado.APROVADO,
      ],
      [OrcamentoStatusComercial.PERDIDA, OrcamentoStatusLegado.REJEITADO],
      [OrcamentoStatusComercial.CANCELADA, OrcamentoStatusLegado.CANCELADO],
    ] as const)('%s → %s', (comercial, legado) => {
      expect(mapearStatusComercialParaLegado(comercial)).toBe(legado);
    });
  });

  describe('mapearStatusComercialParaAprovacao', () => {
    it('deriva status_aprovacao sem escrita independente', () => {
      expect(
        mapearStatusComercialParaAprovacao(OrcamentoStatusComercial.ENVIADA),
      ).toBe('PENDENTE');
      expect(
        mapearStatusComercialParaAprovacao(OrcamentoStatusComercial.ACEITA),
      ).toBe('APROVADO');
      expect(
        mapearStatusComercialParaAprovacao(
          OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
        ),
      ).toBe('APROVADO');
      expect(
        mapearStatusComercialParaAprovacao(OrcamentoStatusComercial.PERDIDA),
      ).toBe('REJEITADO');
      expect(
        mapearStatusComercialParaAprovacao(OrcamentoStatusComercial.CANCELADA),
      ).toBe('CANCELADO');
    });
  });

  describe('montarAtualizacaoStatusDual', () => {
    it('monta dual-write a partir do legado', () => {
      expect(montarAtualizacaoStatusDual('aprovado', false)).toEqual({
        status: 'aprovado',
        status_comercial: OrcamentoStatusComercial.ACEITA,
        status_aprovacao: 'APROVADO',
      });
      expect(montarAtualizacaoStatusDual('aprovado', true)).toEqual({
        status: 'aprovado',
        status_comercial: OrcamentoStatusComercial.PEDIDO_CONFIRMADO,
        status_aprovacao: 'APROVADO',
      });
      expect(montarAtualizacaoStatusDual('enviado')).toEqual({
        status: 'enviado',
        status_comercial: OrcamentoStatusComercial.ENVIADA,
        status_aprovacao: 'PENDENTE',
      });
    });
  });
});
