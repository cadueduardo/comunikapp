import {
  normalizarRegistrosVdp,
  resolverAncorasComChaves,
  sanitizarTextoVdp,
} from '../vdp-valores.util';

describe('vdp-valores.util', () => {
  describe('sanitizarTextoVdp', () => {
    it('bloqueia células com prefixo de fórmula', () => {
      expect(() => sanitizarTextoVdp('=CMD')).toThrow();
      expect(() => sanitizarTextoVdp('+123')).toThrow();
    });

    it('aceita texto comum', () => {
      expect(sanitizarTextoVdp('Maria Silva')).toBe('Maria Silva');
    });
  });

  describe('normalizarRegistrosVdp', () => {
    it('converte objeto único em array de um registro', () => {
      const regs = normalizarRegistrosVdp({ nome: 'Ana' }, 1);
      expect(regs).toEqual([{ nome: 'Ana' }]);
    });

    it('valida tamanho do lote contra quantidade', () => {
      expect(() =>
        normalizarRegistrosVdp([{ nome: 'A' }, { nome: 'B' }], 3),
      ).toThrow();
    });
  });

  describe('resolverAncorasComChaves', () => {
    it('mapeia campoDefId para chave do conjunto', () => {
      const ancoras = resolverAncorasComChaves(
        [{ campoDefId: 'c1', x: 0.1, y: 0.2, width: 0.3, height: 0.1 }],
        [{ id: 'c1', chave: 'nome_colaborador' }],
      );
      expect(ancoras[0].chave).toBe('nome_colaborador');
    });
  });
});
