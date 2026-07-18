/**
 * Fonte única da verdade para cálculo de orçamento V2 (preview + persistência).
 */
import { truncarDescricaoResumida } from '@/components/produtos-finitos/descricao-produto-finito.helpers';
import { calcularProdutosPreview } from './preview-calculo.helpers';
import { Insumo, Maquina, Funcao, ServicoManual } from '../types/common.types';

export type TipoMargemLucro = 'markup' | 'margem_por_dentro';

export interface PreviewOrcamentoDatasets {
  insumos: Insumo[];
  maquinas: Maquina[];
  funcoes: Funcao[];
  servicos: ServicoManual[];
  custosIndiretos?: unknown[];
}

export interface PreviewOrcamentoLojaDefaults {
  margem_lucro_padrao?: number | string | null;
  impostos_padrao?: number | string | null;
  tipo_margem_lucro?: string | null;
}

export interface MontarPreviewOrcamentoOptions {
  datasets: PreviewOrcamentoDatasets;
  loja?: PreviewOrcamentoLojaDefaults | null;
  comissaoPadrao?: number;
  /** Snapshot dos itens ao carregar rascunho — preenche produtos com accordion fechado. */
  itensProdutoCarregados?: unknown[];
}

const CAMPO_VAZIO = (valor: unknown): boolean =>
  valor === undefined || valor === null || valor === '';

const arrayRecursoTemDados = (arr: unknown): boolean => {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.some((item) => {
    const registro = item as Record<string, unknown>;
    return Boolean(
      registro?.insumo_id || registro?.maquina_id || registro?.funcao_id || registro?.servico_id,
    );
  });
};

const CAMPOS_ESCALARES_MERGE = [
  'nome_servico',
  'descricao',
  'quantidade_produto',
  'largura_produto',
  'altura_produto',
  'profundidade_produto',
  'area_produto',
  'perimetro_produto',
  'unidade_medida_produto',
  'tipo_item',
  'produto_finito_id',
  'preco_unitario_snapshot',
  'preco_custo_snapshot',
  'personalizacao_ativa',
  'personalizacao_modo',
  'personalizacao_estampa_id',
  'personalizacao_processo_id',
] as const;

const mergeItemProdutoPreview = (
  carregado: Record<string, unknown> | undefined,
  formulario: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const base = { ...(carregado ?? {}) };
  const atual = { ...(formulario ?? {}) };
  const merged: Record<string, unknown> = { ...base, ...atual };

  for (const key of ['materiais', 'maquinas', 'funcoes', 'servicos'] as const) {
    if (!arrayRecursoTemDados(atual[key]) && arrayRecursoTemDados(base[key])) {
      merged[key] = base[key];
    }
  }

  for (const key of CAMPOS_ESCALARES_MERGE) {
    if (CAMPO_VAZIO(atual[key]) && !CAMPO_VAZIO(base[key])) {
      merged[key] = base[key];
    }
  }

  if (base.catalogo_regras && !atual.catalogo_regras) {
    merged.catalogo_regras = base.catalogo_regras;
  }

  return merged;
};

/** Mescla itens do formulário com snapshot carregado (accordion fechado não registra campos no RHF). */
export function mergeItensProdutoParaPreview(
  carregados: unknown[] | undefined,
  doFormulario: unknown[] | undefined,
): unknown[] {
  const base = carregados ?? [];
  const atual = doFormulario ?? [];
  const len = Math.max(base.length, atual.length);
  if (len === 0) return [];
  return Array.from({ length: len }, (_, index) =>
    mergeItemProdutoPreview(
      base[index] as Record<string, unknown> | undefined,
      atual[index] as Record<string, unknown> | undefined,
    ),
  );
}

export interface PreviewOrcamentoProduto {
  id: string;
  nome_servico: string;
  descricao: string;
  quantidade: number;
  tipo_item?: 'SOB_DEMANDA' | 'PRODUTO_FINITO';
  dimensoes: Record<string, unknown>;
  materiais: unknown[];
  maquinas: unknown[];
  funcoes: unknown[];
  servicos: unknown[];
  custo_total_producao: number;
  horas_producao: number;
  custos_indiretos_rateados: number;
  preco_unitario?: number;
  preco_total?: number;
  preco_custo_unitario?: number;
  custo_informado?: boolean;
  preco_venda_total?: number | string;
  preco_venda_unitario?: number | string;
  margem_lucro_produto?: number;
  margem_bruta_percentual?: number;
  impostos_produto?: number;
  comissao_produto?: number;
  instalacao_necessaria?: boolean;
  instalacao_regra_cobranca?: string;
  instalacao_valor_unitario?: number;
  instalacao_preco_cobrado?: number;
  instalacao_custo_mao_obra?: number;
  instalacao_custo_deslocamento?: number;
  instalacao_tempo_estimado_min?: number;
  instalacao_quantidade_pessoas?: number;
  instalacao_usar_endereco_entrega?: boolean;
  instalacao_cep?: string;
  instalacao_logradouro?: string;
  instalacao_numero?: string;
  instalacao_bairro?: string;
  instalacao_cidade?: string;
  instalacao_estado?: string;
}

export interface PreviewOrcamentoResult {
  resumo: {
    total_produtos: number;
    total_custo_material: number;
    total_custo_maquinaria: number;
    total_custo_mao_obra: number;
    total_custo_indireto: number;
    total_custo_producao: number;
    /** Custo de catálogo dos produtos finitos (informativo; não entra na fórmula de markup). */
    total_custo_prateleira?: number;
    /** Custo total para gestão (produção + prateleira). Não altera o preço ao cliente. */
    total_custo_gerencial?: number;
    total_margem_lucro: number;
    total_impostos: number;
    preco_final: number;
    preco_final_calculado?: number;
    valor_final_manual?: number;
    preco_final_manual?: boolean;
    preco_abaixo_custo?: boolean;
    margem_planejada_valor?: number;
    margem_manual_valor?: number;
    margem_manual_percentual?: number;
    margem_consumida_valor?: number;
    margem_consumida_percentual?: number;
    tempo_total_producao: number;
    margem_lucro_percentual: number;
    impostos_percentual: number;
    comissao_percentual: number;
    comissao_total: number;
  };
  produtos: PreviewOrcamentoProduto[];
  entrega?: {
    modalidade_id?: string;
    usar_endereco_cliente: boolean;
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    prazo_dias?: number;
    valor_cobrado: number;
    custo_estimado: number;
  };
  custosIndiretos: Array<{
    id: string;
    nome: string;
    categoria?: string | null;
    valor_mensal: number;
    valor_rateado?: number;
    percentual_rateio?: number;
  }>;
  custosIndiretosResumo?: {
    totalMensal: number;
    custoPorHora: number;
    totalRateado: number;
    itens: unknown[];
  };
  totais: {
    materiais: number;
    maquinas: number;
    funcoes: number;
    servicos: number;
    indiretos: number;
    horas: number;
  };
  metadata: {
    timestamp_calculo: Date;
    versao_motor: string;
    tempo_execucao_ms: number;
    estagios_executados: string[];
  };
}

const roundMoney = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

export const parseNumeroPreview = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9,.-]/g, '');
    const normalizedText =
      cleaned.includes(',') && cleaned.includes('.')
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(',', '.');
    const normalized = Number(normalizedText);
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }
  return 0;
};

const parsePercentual = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.'));
    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }
  return fallback;
};

const parseInteiroOpcional = (value: unknown): number | undefined => {
  const parsed = parseNumeroPreview(value);
  return parsed > 0 ? Math.trunc(parsed) : undefined;
};

const parseTextoOpcional = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

const sanitizeDescricao = (descricao: unknown, fallback: string): string => {
  if (typeof descricao !== 'string') {
    return fallback.trim();
  }
  const normalized = descricao
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > 0 ? truncarDescricaoResumida(normalized) : fallback.trim();
};

export const resolverTipoMargemLucroOrcamento = (
  formData: Record<string, unknown>,
  loja?: PreviewOrcamentoLojaDefaults | null,
): TipoMargemLucro => {
  const raw = formData?.tipo_margem_lucro;
  if (raw === 'markup' || raw === 'margem_por_dentro') {
    return raw;
  }
  return loja?.tipo_margem_lucro === 'markup' ? 'markup' : 'margem_por_dentro';
};

/**
 * Calcula preview completo do orçamento — usado pelo sidebar e pelo save.
 */
export function montarPreviewOrcamento(
  formData: Record<string, unknown>,
  options: MontarPreviewOrcamentoOptions,
): PreviewOrcamentoResult | null {
  const itensFormularioRaw = Array.isArray(formData?.itens_produto) ? formData.itens_produto : [];
  const itensFormulario =
    options.itensProdutoCarregados && options.itensProdutoCarregados.length > 0
      ? mergeItensProdutoParaPreview(options.itensProdutoCarregados, itensFormularioRaw)
      : itensFormularioRaw;
  if (itensFormulario.length === 0) {
    return null;
  }

  const { datasets, loja, comissaoPadrao = 5 } = options;
  const { insumos, maquinas, funcoes, servicos, custosIndiretos = [] } = datasets;

  const custosIndiretosPercentual = parsePercentual(formData?.custos_indiretos_percentual, 15);
  const margemPercentual = parsePercentual(
    formData?.margem_lucro_customizada,
    parsePercentual(loja?.margem_lucro_padrao, 30),
  );
  const impostosPercentual = parsePercentual(
    formData?.impostos_customizados,
    parsePercentual(loja?.impostos_padrao, 18),
  );
  const comissaoPercentual = parsePercentual(formData?.comissao_percentual, comissaoPadrao);
  const tipoMargemLucro = resolverTipoMargemLucroOrcamento(formData, loja);

  const previewCalculado = calcularProdutosPreview(
    itensFormulario,
    { insumos, maquinas, funcoes, servicos, custosIndiretos },
    custosIndiretosPercentual,
    margemPercentual,
    impostosPercentual,
    comissaoPercentual,
    tipoMargemLucro,
  );

  const produtosPreview = previewCalculado.produtos;
  if (produtosPreview.length === 0) {
    return null;
  }

  const totais = previewCalculado.totais;
  const resumoIndiretos = previewCalculado.custosIndiretosResumo ?? {
    totalMensal: totais.indiretos,
    custoPorHora: 0,
    totalRateado: totais.indiretos,
    itens: [],
  };

  const produtosNormalizados = produtosPreview.map((produto, index) => {
    const itemFormulario = itensFormulario[index] as Record<string, unknown> | undefined;
    const fallbackDescricao =
      itemFormulario?.descricao && typeof itemFormulario.descricao === 'string'
        ? itemFormulario.descricao.trim()
        : `Descrição do produto ${index + 1}`;
    return {
      ...produto,
      descricao: sanitizeDescricao(produto.descricao, fallbackDescricao),
      instalacao_necessaria: Boolean(itemFormulario?.instalacao_necessaria),
      instalacao_regra_cobranca:
        parseTextoOpcional(itemFormulario?.instalacao_regra_cobranca) || 'FIXO',
      instalacao_valor_unitario: parseNumeroPreview(itemFormulario?.instalacao_valor_unitario),
      instalacao_preco_cobrado: parseNumeroPreview(itemFormulario?.instalacao_preco_cobrado),
      instalacao_custo_mao_obra: parseNumeroPreview(itemFormulario?.instalacao_custo_mao_obra),
      instalacao_custo_deslocamento: parseNumeroPreview(
        itemFormulario?.instalacao_custo_deslocamento,
      ),
      instalacao_tempo_estimado_min: parseInteiroOpcional(
        itemFormulario?.instalacao_tempo_estimado_min,
      ),
      instalacao_quantidade_pessoas: parseInteiroOpcional(
        itemFormulario?.instalacao_quantidade_pessoas,
      ),
      instalacao_usar_endereco_entrega: itemFormulario?.instalacao_usar_endereco_entrega !== false,
      instalacao_cep: parseTextoOpcional(itemFormulario?.instalacao_cep),
      instalacao_logradouro: parseTextoOpcional(itemFormulario?.instalacao_logradouro),
      instalacao_numero: parseTextoOpcional(itemFormulario?.instalacao_numero),
      instalacao_bairro: parseTextoOpcional(itemFormulario?.instalacao_bairro),
      instalacao_cidade: parseTextoOpcional(itemFormulario?.instalacao_cidade),
      instalacao_estado: parseTextoOpcional(itemFormulario?.instalacao_estado),
    };
  });

  const totalCustoInstalacao = produtosNormalizados.reduce(
    (total, produto) =>
      produto.instalacao_necessaria
        ? total +
          (produto.instalacao_custo_mao_obra ?? 0) +
          (produto.instalacao_custo_deslocamento ?? 0)
        : total,
    0,
  );
  const totalPrecoInstalacao = produtosNormalizados.reduce(
    (total, produto) =>
      produto.instalacao_necessaria
        ? total + (produto.instalacao_preco_cobrado ?? 0)
        : total,
    0,
  );

  const entrega = {
    modalidade_id: parseTextoOpcional(formData?.entrega_modalidade_id),
    usar_endereco_cliente: formData?.entrega_usar_endereco_cliente !== false,
    cep: parseTextoOpcional(formData?.entrega_cep),
    logradouro: parseTextoOpcional(formData?.entrega_logradouro),
    numero: parseTextoOpcional(formData?.entrega_numero),
    bairro: parseTextoOpcional(formData?.entrega_bairro),
    cidade: parseTextoOpcional(formData?.entrega_cidade),
    estado: parseTextoOpcional(formData?.entrega_estado),
    prazo_dias: parseInteiroOpcional(formData?.entrega_prazo_dias),
    valor_cobrado: parseNumeroPreview(formData?.entrega_valor_cobrado),
    custo_estimado: parseNumeroPreview(formData?.entrega_custo_estimado),
  };

  const temEntrega =
    Boolean(entrega.modalidade_id) ||
    entrega.valor_cobrado > 0 ||
    entrega.custo_estimado > 0 ||
    entrega.usar_endereco_cliente === false;

  const totalPrecoPrateleira = roundMoney(
    produtosPreview
      .filter((produto) => produto.tipo_item === 'PRODUTO_FINITO')
      .reduce((total, produto) => total + (Number(produto.preco_total) || 0), 0),
  );

  const custoPrateleiraNoMaterial = roundMoney(
    produtosPreview
      .filter((produto) => produto.tipo_item === 'PRODUTO_FINITO')
      .reduce(
        (total, produto) => total + (Number(produto.custo_total_producao) || 0),
        0,
      ),
  );

  const totalCustoMaterial = totais.materiais;
  const totalCustoMaquinaria = totais.maquinas;
  const totalCustoServicos = totais.servicos;
  const totalCustoFuncoes = totais.funcoes;
  const totalCustoIndireto = resumoIndiretos.totalRateado ?? totais.indiretos;
  const totalHoras = totais.horas;

  const totalCustoProducaoBase =
    totalCustoMaterial +
    totalCustoMaquinaria +
    totalCustoFuncoes +
    totalCustoServicos +
    totalCustoIndireto -
    custoPrateleiraNoMaterial;

  // Custo usado na fórmula de preço do sob demanda (sem prateleira).
  const totalCustoProducao =
    totalCustoProducaoBase + totalCustoInstalacao + entrega.custo_estimado;
  // Custo gerencial: inclui custo de catálogo do produto finito (não onera o preço ao cliente).
  const totalCustoGerencial = roundMoney(
    totalCustoProducao + custoPrateleiraNoMaterial,
  );

  const percentualMargemDecimal = margemPercentual / 100;
  const percentualImpostosDecimal = impostosPercentual / 100;
  const percentualComissaoDecimal = comissaoPercentual / 100;

  let precoFinal: number;
  let divisor: number;
  if (tipoMargemLucro === 'markup') {
    divisor = 1 - percentualImpostosDecimal - percentualComissaoDecimal;
    precoFinal =
      divisor > 0
        ? (totalCustoProducaoBase * (1 + percentualMargemDecimal)) / divisor
        : totalCustoProducaoBase * (1 + percentualMargemDecimal);
  } else {
    divisor =
      1 - percentualImpostosDecimal - percentualComissaoDecimal - percentualMargemDecimal;
    precoFinal = divisor > 0 ? totalCustoProducaoBase / divisor : totalCustoProducaoBase;
  }

  const precoFinalCalculado = roundMoney(
    precoFinal + totalPrecoInstalacao + entrega.valor_cobrado + totalPrecoPrateleira,
  );
  precoFinal = precoFinalCalculado;

  const valorFinalManualTexto =
    typeof formData?.valor_final_manual === 'string'
      ? formData.valor_final_manual.trim()
      : formData?.valor_final_manual != null
        ? String(formData.valor_final_manual).trim()
        : '';
  const temValorFinalManual = valorFinalManualTexto.length > 0;
  const valorFinalManual = roundMoney(parseNumeroPreview(valorFinalManualTexto));
  if (temValorFinalManual) {
    precoFinal = valorFinalManual;
  }

  const precoFinalPersistido = parseNumeroPreview(formData?.preco_final_persistido);
  if (
    precoFinalPersistido > 0 &&
    !temValorFinalManual &&
    Math.abs(precoFinal - precoFinalPersistido) > 0.05
  ) {
    precoFinal = precoFinalPersistido;
  }

  const margemPlanejadaValor = roundMoney(precoFinalCalculado - totalCustoGerencial);
  const margemManualValor = temValorFinalManual
    ? roundMoney(valorFinalManual - totalCustoGerencial)
    : undefined;
  const margemManualPercentual =
    temValorFinalManual && valorFinalManual > 0 && margemManualValor !== undefined
      ? roundMoney((margemManualValor / valorFinalManual) * 100)
      : undefined;
  const margemConsumidaValor = temValorFinalManual
    ? roundMoney(precoFinalCalculado - valorFinalManual)
    : undefined;
  const margemConsumidaPercentual =
    temValorFinalManual && margemConsumidaValor !== undefined && margemPlanejadaValor > 0
      ? roundMoney((margemConsumidaValor / margemPlanejadaValor) * 100)
      : undefined;

  const totalImpostos = roundMoney(precoFinal * percentualImpostosDecimal);
  const comissaoTotal = roundMoney(precoFinal * percentualComissaoDecimal);
  const totalMargemLucro = roundMoney(precoFinal * percentualMargemDecimal);

  const produtosComPrecos = produtosNormalizados.map((produto) => {
    if (produto.tipo_item === 'PRODUTO_FINITO') {
      const precoVendaTotal = roundMoney(Number(produto.preco_total) || 0);
      const precoVendaUnitario = roundMoney(precoVendaTotal / Math.max(produto.quantidade, 1));
      const custoTotal = roundMoney(Number(produto.custo_total_producao) || 0);
      const custoUnitario = roundMoney(custoTotal / Math.max(produto.quantidade, 1));
      const custoInformado = custoTotal > 0;
      const margemBruta = custoInformado
        ? roundMoney(precoVendaTotal - custoTotal)
        : 0;
      const margemBrutaPercentual =
        custoInformado && precoVendaTotal > 0
          ? roundMoney((margemBruta / precoVendaTotal) * 100)
          : 0;
      return {
        ...produto,
        preco_venda_unitario: precoVendaUnitario,
        preco_venda_total: precoVendaTotal,
        preco_custo_unitario: custoUnitario,
        custo_informado: custoInformado,
        margem_lucro_produto: margemBruta,
        margem_bruta_percentual: margemBrutaPercentual,
        impostos_produto: 0,
        comissao_produto: 0,
      };
    }

    const custoBaseProduto = produto.custo_total_producao;
    const precoVendaProduto =
      tipoMargemLucro === 'markup'
        ? divisor > 0
          ? (custoBaseProduto * (1 + percentualMargemDecimal)) / divisor
          : custoBaseProduto * (1 + percentualMargemDecimal)
        : divisor > 0
          ? custoBaseProduto / divisor
          : custoBaseProduto;
    const precoVendaArredondado = roundMoney(precoVendaProduto);
    const margemLucroProduto = roundMoney(precoVendaArredondado * percentualMargemDecimal);
    const impostosProduto = roundMoney(precoVendaArredondado * percentualImpostosDecimal);
    const comissaoProduto = roundMoney(precoVendaArredondado * percentualComissaoDecimal);

    return {
      ...produto,
      preco_venda_unitario: roundMoney(precoVendaArredondado / Math.max(produto.quantidade, 1)),
      preco_venda_total: precoVendaArredondado,
      margem_lucro_produto: margemLucroProduto,
      impostos_produto: impostosProduto,
      comissao_produto: comissaoProduto,
    };
  });

  return {
    resumo: {
      total_produtos: produtosNormalizados.length,
      total_custo_material: totalCustoMaterial,
      total_custo_maquinaria: totalCustoMaquinaria,
      total_custo_mao_obra: totalCustoFuncoes + totalCustoServicos,
      total_custo_indireto: totalCustoIndireto,
      total_custo_producao: totalCustoProducao,
      total_custo_prateleira: custoPrateleiraNoMaterial,
      total_custo_gerencial: totalCustoGerencial,
      total_margem_lucro: totalMargemLucro,
      total_impostos: totalImpostos,
      preco_final: precoFinal,
      preco_final_calculado: temValorFinalManual ? precoFinalCalculado : undefined,
      valor_final_manual: temValorFinalManual ? valorFinalManual : undefined,
      preco_final_manual: temValorFinalManual,
      preco_abaixo_custo: temValorFinalManual && valorFinalManual < totalCustoGerencial,
      margem_planejada_valor: temValorFinalManual ? margemPlanejadaValor : undefined,
      margem_manual_valor: margemManualValor,
      margem_manual_percentual: margemManualPercentual,
      margem_consumida_valor: margemConsumidaValor,
      margem_consumida_percentual: margemConsumidaPercentual,
      tempo_total_producao: totalHoras,
      margem_lucro_percentual: margemPercentual,
      impostos_percentual: impostosPercentual,
      comissao_percentual: comissaoPercentual,
      comissao_total: comissaoTotal,
    },
    produtos: produtosComPrecos,
    entrega: temEntrega ? entrega : undefined,
    custosIndiretos: resumoIndiretos.itens.map((custo: any) => ({
      id: custo.id,
      nome: custo.nome,
      categoria: custo.categoria,
      valor_mensal: custo.valor_mensal,
      valor_rateado: custo.valor_rateado,
      percentual_rateio: custo.percentual_rateio,
    })),
    custosIndiretosResumo: resumoIndiretos,
    totais,
    metadata: {
      timestamp_calculo: new Date(),
      versao_motor: 'preview-unificado-v1',
      tempo_execucao_ms: 0,
      estagios_executados: [
        'validacao',
        'materiais',
        'maquinas',
        'funcoes',
        'custos_indiretos',
        'margem_lucro',
        'impostos',
      ],
    },
  };
}
