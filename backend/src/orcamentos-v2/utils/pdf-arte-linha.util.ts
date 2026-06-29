import {
  OrigemItemServicoManual,
  PoliticaCobrancaArte,
} from '../../modules/arte-aprovacao/constants/arte.enums';

export const DESCRICAO_LINHA_ARTE_PDF = 'Criação de arte';

export interface LinhaArtePdf {
  descricao: string;
  horas: number | null;
  custo_hora: number | null;
  preco_unitario: number;
  preco_total: number;
}

export interface PrecosPdfProduto {
  preco_unitario: number;
  preco_total: number;
  linha_arte: LinhaArtePdf | null;
}

const numeroSeguro = (valor: unknown): number => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const arredondarMoeda = (valor: number): number =>
  Math.round(Math.max(0, valor) * 100) / 100;

/**
 * Separa o preço comercial do produto em linha de produção + linha de arte (PDF).
 * A linha de arte usa o valor listado no sistema (horas × custo/hora), não rateio proporcional.
 */
export function resolverPrecosPdfComArte(
  produto: {
    quantidade?: unknown;
    arte_custo_calculado?: unknown;
    arte_horas_calculadas?: unknown;
    politica_cobranca_arte?: string;
    servicos_manuais?: Array<{
      origem?: string;
      exibir_no_pdf?: boolean;
      descricao?: string | null;
      custo_total?: unknown;
      custo_hora?: unknown;
      tempo_horas?: unknown;
    }>;
  },
  precoTotalComercial: number,
): PrecosPdfProduto {
  const quantidade = Math.max(1, numeroSeguro(produto.quantidade));
  const precoTotal = arredondarMoeda(precoTotalComercial);

  const servicos = produto.servicos_manuais ?? [];
  const linhaArte = servicos.find(
    (s) => s.origem === OrigemItemServicoManual.ARTE_AUTOMATICA,
  );

  const politica = produto.politica_cobranca_arte ?? '';
  const exibirNoPdf =
    linhaArte != null
      ? Boolean(linhaArte.exibir_no_pdf)
      : politica === PoliticaCobrancaArte.COBRADA_A_PARTE;

  if (!exibirNoPdf) {
    return {
      preco_unitario: arredondarMoeda(precoTotal / quantidade),
      preco_total: precoTotal,
      linha_arte: null,
    };
  }

  const horasRaw =
    numeroSeguro(linhaArte?.tempo_horas) ||
    numeroSeguro(produto.arte_horas_calculadas);
  const horas = horasRaw > 0 ? horasRaw : null;
  const custoHora = numeroSeguro(linhaArte?.custo_hora);

  let arteValorListado =
    horas != null && custoHora > 0
      ? arredondarMoeda(horas * custoHora)
      : arredondarMoeda(
          numeroSeguro(linhaArte?.custo_total) ||
            numeroSeguro(produto.arte_custo_calculado),
        );

  if (arteValorListado <= 0) {
    return {
      preco_unitario: arredondarMoeda(precoTotal / quantidade),
      preco_total: precoTotal,
      linha_arte: null,
    };
  }

  const artePrecoPdf = arredondarMoeda(Math.min(arteValorListado, precoTotal));
  const produtoPreco = arredondarMoeda(precoTotal - artePrecoPdf);

  return {
    preco_unitario: arredondarMoeda(produtoPreco / quantidade),
    preco_total: produtoPreco,
    linha_arte: {
      descricao: DESCRICAO_LINHA_ARTE_PDF,
      horas,
      custo_hora: custoHora > 0 ? custoHora : null,
      preco_unitario: artePrecoPdf,
      preco_total: artePrecoPdf,
    },
  };
}
