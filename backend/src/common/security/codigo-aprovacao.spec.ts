import { createHash } from 'node:crypto';
import {
  CODIGO_APROVACAO_HASH_TAMANHO,
  CODIGO_APROVACAO_TAMANHO_MAXIMO,
  CODIGO_APROVACAO_VALIDADE_DIAS,
  calcularHashCodigoAprovacao,
  emitirCodigoAprovacao,
  formatoCodigoAprovacaoValido,
  hashesConferem,
} from './codigo-aprovacao';

describe('Gate 0S / HS-04 - código de aprovação', () => {
  describe('emitirCodigoAprovacao', () => {
    it('gera token com 256 bits de entropia em base64url', () => {
      const { codigo } = emitirCodigoAprovacao();

      // 32 bytes em base64url = 43 caracteres, sem padding.
      expect(codigo).toHaveLength(43);
      expect(codigo).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('não repete o código entre emissões', () => {
      const emitidos = new Set(
        Array.from({ length: 200 }, () => emitirCodigoAprovacao().codigo),
      );

      expect(emitidos.size).toBe(200);
    });

    it('devolve o hash SHA-256 do código, e não o código', () => {
      const { codigo, hash } = emitirCodigoAprovacao();

      expect(hash).toBe(createHash('sha256').update(codigo).digest('hex'));
      expect(hash).toHaveLength(CODIGO_APROVACAO_HASH_TAMANHO);
      expect(hash).not.toContain(codigo);
    });

    it('calcula a expiração em UTC, independente do instante local', () => {
      const agora = new Date('2026-07-31T12:00:00.000Z');
      const { expiraEm } = emitirCodigoAprovacao(agora);

      const esperado = new Date(
        agora.getTime() + CODIGO_APROVACAO_VALIDADE_DIAS * 24 * 60 * 60 * 1000,
      );

      expect(expiraEm.toISOString()).toBe(esperado.toISOString());
    });
  });

  describe('hashesConferem', () => {
    it('aceita o hash correspondente ao código emitido', () => {
      const { codigo, hash } = emitirCodigoAprovacao();

      expect(hashesConferem(calcularHashCodigoAprovacao(codigo), hash)).toBe(
        true,
      );
    });

    it('rejeita código diferente', () => {
      const { hash } = emitirCodigoAprovacao();
      const outro = emitirCodigoAprovacao().codigo;

      expect(hashesConferem(calcularHashCodigoAprovacao(outro), hash)).toBe(
        false,
      );
    });

    it('rejeita quando não há hash armazenado', () => {
      const hashInformado = calcularHashCodigoAprovacao('qualquer-coisa');

      expect(hashesConferem(hashInformado, null)).toBe(false);
      expect(hashesConferem(hashInformado, undefined)).toBe(false);
      expect(hashesConferem(hashInformado, '')).toBe(false);
    });

    it('rejeita hash armazenado corrompido, sem lançar', () => {
      const hashInformado = calcularHashCodigoAprovacao('qualquer-coisa');

      expect(hashesConferem(hashInformado, 'curto-demais')).toBe(false);
    });

    it('não aceita um hash de zeros como se fosse código válido', () => {
      // Protege o caminho em que a coluna estivesse preenchida com o mesmo
      // valor usado internamente para manter o custo da comparação.
      const zeros = '0'.repeat(CODIGO_APROVACAO_HASH_TAMANHO);

      expect(hashesConferem(zeros, zeros)).toBe(false);
    });
  });

  describe('formatoCodigoAprovacaoValido', () => {
    it('aceita o código emitido', () => {
      expect(formatoCodigoAprovacaoValido(emitirCodigoAprovacao().codigo)).toBe(
        true,
      );
    });

    it('rejeita vazio, tipo errado e payload gigante', () => {
      expect(formatoCodigoAprovacaoValido('')).toBe(false);
      expect(formatoCodigoAprovacaoValido(undefined)).toBe(false);
      expect(formatoCodigoAprovacaoValido(null)).toBe(false);
      expect(formatoCodigoAprovacaoValido(12345)).toBe(false);
      expect(formatoCodigoAprovacaoValido({ codigo: 'x' })).toBe(false);
      expect(
        formatoCodigoAprovacaoValido(
          'a'.repeat(CODIGO_APROVACAO_TAMANHO_MAXIMO + 1),
        ),
      ).toBe(false);
    });
  });
});
