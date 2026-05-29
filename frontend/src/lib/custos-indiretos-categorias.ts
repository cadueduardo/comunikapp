/** Categorias sugeridas para custos indiretos (fixos mensais da operação). */
export const CATEGORIAS_CUSTO_INDIRETO_PADRAO = [
  'Locação e imóvel',
  'Utilidades',
  'Telecomunicações',
  'Pessoal e encargos',
  'Benefícios e RH',
  'Depreciação e equipamentos',
  'Manutenção e facilities',
  'Impostos e taxas',
  'Seguros',
  'Serviços terceirizados',
  'Software e tecnologia',
  'Marketing e comercial',
  'Transporte e logística',
  'Materiais de consumo indireto',
  'Financeiro',
  'Outros',
] as const;

/** Rótulos amigáveis para valores legados (ex.: seed). */
const ROTULOS_LEGADO: Record<string, string> = {
  LOCACAO: 'Locação e imóvel',
  SERVICOS: 'Utilidades',
};

export type CategoriaCustoIndiretoOption = {
  label: string;
  value: string;
};

function chaveUnica(nome: string): string {
  return nome.trim().toLowerCase();
}

function rotuloCategoria(valor: string): string {
  const chave = valor.trim().toUpperCase();
  return ROTULOS_LEGADO[chave] ?? valor.trim();
}

/**
 * Monta opções do combo: padrões + já usados na loja (+ valor atual ao editar).
 */
export function buildCategoriaCustoIndiretoOptions(
  existentes: string[],
  valorAtual?: string,
): CategoriaCustoIndiretoOption[] {
  const vistos = new Set<string>();
  const opcoes: CategoriaCustoIndiretoOption[] = [];

  const incluir = (valorBruto: string) => {
    const valor = valorBruto.trim();
    if (!valor) return;
    const chave = chaveUnica(valor);
    if (vistos.has(chave)) return;
    vistos.add(chave);
    opcoes.push({ value: valor, label: rotuloCategoria(valor) });
  };

  for (const padrao of CATEGORIAS_CUSTO_INDIRETO_PADRAO) {
    incluir(padrao);
  }
  for (const existente of existentes) {
    incluir(existente);
  }
  if (valorAtual) {
    incluir(valorAtual);
  }

  return opcoes.sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
  );
}
