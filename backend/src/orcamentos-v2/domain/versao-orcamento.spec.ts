import {
  calcularHashMaterial,
  houveAlteracaoMaterial,
  montarSnapshotVersao,
} from './versao-orcamento';

describe('versao-orcamento (DV-15 / DV-02)', () => {
  it('calcula hash estável independente da ordem das chaves no objeto material', () => {
    const a = montarSnapshotVersao({
      atual: { preco_final: 100, cliente_id: 'c1' },
    });
    const b = montarSnapshotVersao({
      atual: { cliente_id: 'c1', preco_final: 100 },
    });
    expect(calcularHashMaterial(a)).toBe(calcularHashMaterial(b));
    expect(calcularHashMaterial(a)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('detecta alteração material em preço', () => {
    const antes = montarSnapshotVersao({ atual: { preco_final: 100 } });
    const depois = montarSnapshotVersao({ atual: { preco_final: 120 } });
    expect(houveAlteracaoMaterial(antes, depois)).toBe(true);
  });

  it('ignora campos não materiais no hash', () => {
    const a = montarSnapshotVersao({
      atual: { preco_final: 100, observacoes_internas: 'a' },
    });
    const b = montarSnapshotVersao({
      atual: { preco_final: 100, observacoes_internas: 'b' },
    });
    expect(houveAlteracaoMaterial(a, b)).toBe(false);
  });
});
