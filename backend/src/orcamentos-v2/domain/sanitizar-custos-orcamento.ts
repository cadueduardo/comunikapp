/**
 * Purgador / Sanitizador de segredos de composição de custos e margem comercial.
 *
 * Garante que usuários sem a permissão `PRECO_CUSTO_VER` ou `PRECO_MARGEM_VER`
 * recebam os objetos sem detalhes sensíveis de custos internos, margem bruta ou fórmulas.
 */

const CAMPOS_CUSTO = new Set([
  'custo_material',
  'custo_mao_obra',
  'custo_indireto',
  'custo_total',
  'custo_total_producao',
  'custos',
  'detalhamento_calculo',
  'composicao_custos',
]);

const CAMPOS_MARGEM = new Set([
  'margem_lucro',
  'margem_percentual',
  'margem_bruta',
]);

export function sanitizarCustosEMargem<T>(
  dado: T,
  podeVerCustos: boolean,
  podeVerMargem: boolean,
): T {
  if (dado === null || dado === undefined || typeof dado !== 'object') {
    return dado;
  }

  if (Array.isArray(dado)) {
    return dado.map((item) =>
      sanitizarCustosEMargem(item, podeVerCustos, podeVerMargem),
    ) as unknown as T;
  }

  if (dado instanceof Date) {
    return dado;
  }

  const copia: Record<string, any> = {};

  for (const [chave, valor] of Object.entries(dado)) {
    if (!podeVerCustos && CAMPOS_CUSTO.has(chave)) {
      continue;
    }

    if (!podeVerMargem && CAMPOS_MARGEM.has(chave)) {
      continue;
    }

    copia[chave] = sanitizarCustosEMargem(valor, podeVerCustos, podeVerMargem);
  }

  return copia as T;
}
