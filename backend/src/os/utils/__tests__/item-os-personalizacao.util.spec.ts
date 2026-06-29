import {
  FulfillmentPadrao,
  ModoFulfillmentItem,
  ModoPersonalizacao,
} from '@prisma/client';
import {
  clonarJsonSnapshot,
  resolverModoFulfillmentItem,
  resolverPropagacaoPersonalizacaoItemOS,
} from '../item-os-personalizacao.util';

describe('item-os-personalizacao.util', () => {
  const produtoPersonalizavel = {
    personalizavel: true,
    fulfillment_padrao: FulfillmentPadrao.PRODUCAO,
    loja_id: 'loja-1',
  };

  describe('resolverModoFulfillmentItem', () => {
    it('retorna PICK para produto finito sem personalização', () => {
      expect(
        resolverModoFulfillmentItem({
          tipoItem: 'PRODUTO_FINITO',
          produtoFinito: { ...produtoPersonalizavel, personalizavel: false },
          personalizacao: null,
        }),
      ).toBe(ModoFulfillmentItem.PICK);
    });

    it('retorna PICK quando modo de personalização é NENHUM', () => {
      expect(
        resolverModoFulfillmentItem({
          tipoItem: 'PRODUTO_FINITO',
          produtoFinito: produtoPersonalizavel,
          personalizacao: { modo: ModoPersonalizacao.NENHUM },
        }),
      ).toBe(ModoFulfillmentItem.PICK);
    });

    it('retorna MAKE para ESTAMPA com fulfillment PRODUCAO', () => {
      expect(
        resolverModoFulfillmentItem({
          tipoItem: 'PRODUTO_FINITO',
          produtoFinito: produtoPersonalizavel,
          personalizacao: { modo: ModoPersonalizacao.ESTAMPA },
        }),
      ).toBe(ModoFulfillmentItem.MAKE);
    });

    it('retorna HIBRIDO para IMPRINT_LIVRE com fulfillment HIBRIDO', () => {
      expect(
        resolverModoFulfillmentItem({
          tipoItem: 'PRODUTO_FINITO',
          produtoFinito: {
            ...produtoPersonalizavel,
            fulfillment_padrao: FulfillmentPadrao.HIBRIDO,
          },
          personalizacao: { modo: ModoPersonalizacao.IMPRINT_LIVRE },
        }),
      ).toBe(ModoFulfillmentItem.HIBRIDO);
    });

    it('retorna HIBRIDO para personalização ativa com fulfillment ESTOQUE', () => {
      expect(
        resolverModoFulfillmentItem({
          tipoItem: 'PRODUTO_FINITO',
          produtoFinito: {
            ...produtoPersonalizavel,
            fulfillment_padrao: FulfillmentPadrao.ESTOQUE,
          },
          personalizacao: { modo: ModoPersonalizacao.ESTAMPA },
        }),
      ).toBe(ModoFulfillmentItem.HIBRIDO);
    });

    it('mantém PICK para item SOB_DEMANDA', () => {
      expect(
        resolverModoFulfillmentItem({
          tipoItem: 'SOB_DEMANDA',
          produtoFinito: null,
          personalizacao: null,
        }),
      ).toBe(ModoFulfillmentItem.PICK);
    });
  });

  describe('resolverPropagacaoPersonalizacaoItemOS', () => {
    it('copia snapshots JSON de valores e grade', () => {
      const valores = [{ nome: 'Ana' }, { nome: 'Bruno' }];
      const grade = [{ atributos: { tamanho: 'M' }, quantidade: 2 }];

      const resultado = resolverPropagacaoPersonalizacaoItemOS({
        tipoItem: 'PRODUTO_FINITO',
        produtoFinito: produtoPersonalizavel,
        personalizacao: {
          modo: ModoPersonalizacao.ESTAMPA,
          estampa_id: 'estampa-1',
          processo_id: 'proc-1',
          valores_campos: valores,
          grade_distribuicao: grade,
        },
      });

      expect(resultado.personalizacao_modo).toBe(ModoPersonalizacao.ESTAMPA);
      expect(resultado.estampa_id).toBe('estampa-1');
      expect(resultado.valores_personalizacao).toEqual(valores);
      expect(resultado.valores_personalizacao).not.toBe(valores);
      expect(resultado.grade_distribuicao).toEqual(grade);
      expect(resultado.snapshot_auditoria?.imutavel).toBe(true);
    });
  });

  describe('clonarJsonSnapshot', () => {
    it('retorna null para valores ausentes', () => {
      expect(clonarJsonSnapshot(null)).toBeNull();
      expect(clonarJsonSnapshot(undefined)).toBeNull();
    });
  });
});
