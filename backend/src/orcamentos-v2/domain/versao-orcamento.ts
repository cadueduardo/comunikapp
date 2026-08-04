import { createHash } from 'crypto';

/**
 * Snapshot canônico de uma VersaoOrcamento e hash material (DV-02 / DV-15).
 * O hash cobre apenas campos comerciais materiais — não metadados de auditoria.
 */

export type SnapshotVersaoOrcamento = {
  anterior?: unknown;
  mudancas?: unknown;
  atual?: unknown;
};

const CAMPOS_MATERIAIS = [
  'preco_final',
  'valor_total',
  'custo_total',
  'margem_lucro',
  'impostos',
  'produtos',
  'cliente_id',
  'condicao_pagamento_tipo',
  'condicao_pagamento_entrada_pct',
  'condicao_pagamento_parcelas',
  'validade_proposta',
  'validade_dias',
  'prazo_entrega',
  'entrega_modalidade_id',
  'entrega_valor_cobrado',
] as const;

function extrairCamposMateriais(fonte: unknown): Record<string, unknown> {
  if (!fonte || typeof fonte !== 'object') {
    return {};
  }
  const origem = fonte as Record<string, unknown>;
  const atual =
    origem.atual && typeof origem.atual === 'object'
      ? (origem.atual as Record<string, unknown>)
      : origem.mudancas && typeof origem.mudancas === 'object'
        ? (origem.mudancas as Record<string, unknown>)
        : origem;

  const material: Record<string, unknown> = {};
  for (const campo of CAMPOS_MATERIAIS) {
    if (atual[campo] !== undefined) {
      material[campo] = atual[campo];
    }
  }
  return material;
}

/** SHA-256 hex do JSON canônico dos campos materiais. */
export function calcularHashMaterial(snapshot: unknown): string {
  const material = extrairCamposMateriais(snapshot);
  const canonico = JSON.stringify(material, Object.keys(material).sort());
  return createHash('sha256').update(canonico).digest('hex');
}

/**
 * Compara dois snapshots: alteração material se o hash divergir.
 * Usado para invalidar aceite (DV-02) sem varrer o JSON completo.
 */
export function houveAlteracaoMaterial(
  snapshotA: unknown,
  snapshotB: unknown,
): boolean {
  return calcularHashMaterial(snapshotA) !== calcularHashMaterial(snapshotB);
}

export function montarSnapshotVersao(entrada: {
  anterior?: unknown;
  mudancas?: unknown;
  atual?: unknown;
}): SnapshotVersaoOrcamento {
  return {
    ...(entrada.anterior !== undefined ? { anterior: entrada.anterior } : {}),
    ...(entrada.mudancas !== undefined ? { mudancas: entrada.mudancas } : {}),
    ...(entrada.atual !== undefined ? { atual: entrada.atual } : {}),
  };
}
