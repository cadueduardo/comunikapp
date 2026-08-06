import {
  calcularHashMaterial,
  houveAlteracaoMaterial,
} from './versao-orcamento';

export type TipoMudanca = 'ADICIONADO' | 'REMOVIDO' | 'MODIFICADO';

export interface ItemDiff {
  campo: string;
  rotulo: string;
  valorAnterior: unknown;
  valorNovo: unknown;
  tipoMudanca: TipoMudanca;
}

export interface ProdutoDiff {
  produtoId?: string;
  nome: string;
  tipoMudanca: TipoMudanca;
  alteracoes: ItemDiff[];
}

export interface DiffVersaoOrcamento {
  houveAlteracaoMaterial: boolean;
  hashOrigem: string;
  hashDestino: string;
  resumo: {
    precoAnterior: number | null;
    precoNovo: number | null;
    diferencaPreco: number | null;
    produtosAdicionados: number;
    produtosRemovidos: number;
    produtosModificados: number;
  };
  alteracoesGerais: ItemDiff[];
  alteracoesProdutos: ProdutoDiff[];
}

const CAMPOS_SENSIVEIS_CUSTO = new Set([
  'custo_material',
  'custo_mao_obra',
  'custo_indireto',
  'custo_total',
  'custo_total_producao',
  'margem_lucro',
  'custos',
  'detalhamento_calculo',
  'custo_padrao',
  'custo_mao_obra_padrao',
  'custo_deslocamento_padrao',
  'terceirizacao_custo_unitario',
  'terceirizacao_custo_setup',
  'terceirizacao_custo_frete',
  'terceirizacao_custo_total',
  'instalacao_custo_mao_obra',
  'instalacao_custo_deslocamento',
]);

const MAPA_ROTULOS: Record<string, string> = {
  preco_final: 'Preço Final',
  validade_proposta: 'Validade da Proposta (texto)',
  validade_dias: 'Validade em Dias',
  prazo_entrega: 'Prazo de Entrega',
  condicao_pagamento_tipo: 'Condição de Pagamento',
  condicao_pagamento_entrada_pct: '% Entrada',
  condicao_pagamento_parcelas: 'Número de Parcelas',
  condicao_pagamento_descricao: 'Descrição de Pagamento',
  entrega_modalidade_id: 'Modalidade de Entrega',
  entrega_cep: 'CEP de Entrega',
  entrega_logradouro: 'Endereço de Entrega',
  quantidade: 'Quantidade',
  largura: 'Largura',
  altura: 'Altura',
  preco_unitario: 'Preço Unitário',
  preco_total: 'Preço Total Item',
  instalacao_necessaria: 'Instalação Necessária',
  instalacao_tipo_id: 'Tipo de Instalação',
};

/**
 * Remove recursivamente todos os campos de custo, margem de lucro e detalhes internos de cálculo.
 */
export function sanitizarObjetoSnapshot<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizarObjetoSnapshot(item)) as unknown as T;
  }

  if (typeof obj === 'object') {
    const limpo: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(obj as Record<string, unknown>)) {
      if (!CAMPOS_SENSIVEIS_CUSTO.has(chave)) {
        limpo[chave] = sanitizarObjetoSnapshot(valor);
      }
    }
    return limpo as T;
  }

  return obj;
}

function extrairEstado(snapshot: unknown): Record<string, unknown> {
  if (!snapshot || typeof snapshot !== 'object') {
    return {};
  }
  const s = snapshot as Record<string, unknown>;
  if (s.atual && typeof s.atual === 'object') {
    return s.atual as Record<string, unknown>;
  }
  return s;
}

function extrairProdutos(estado: Record<string, unknown>): Array<Record<string, unknown>> {
  const prods = estado.produtos;
  if (Array.isArray(prods)) {
    return prods.filter((p) => p && typeof p === 'object') as Array<Record<string, unknown>>;
  }
  return [];
}

/**
 * Compara dois snapshots de versão de orçamento e gera um diff legível e sanitizado.
 */
export function gerarDiffVersoes(
  snapshotOrigem: unknown,
  snapshotDestino: unknown,
  ePublico = true,
): DiffVersaoOrcamento {
  const origSanitizado = ePublico
    ? sanitizarObjetoSnapshot(snapshotOrigem)
    : snapshotOrigem;
  const destSanitizado = ePublico
    ? sanitizarObjetoSnapshot(snapshotDestino)
    : snapshotDestino;

  const estadoOrig = extrairEstado(origSanitizado);
  const estadoDest = extrairEstado(destSanitizado);

  const hashOrigem = calcularHashMaterial(origSanitizado);
  const hashDestino = calcularHashMaterial(destSanitizado);
  const materialDivergente = houveAlteracaoMaterial(origSanitizado, destSanitizado);

  const alteracoesGerais: ItemDiff[] = [];

  const camposParaComparar = [
    'preco_final',
    'validade_proposta',
    'validade_dias',
    'prazo_entrega',
    'condicao_pagamento_tipo',
    'condicao_pagamento_entrada_pct',
    'condicao_pagamento_parcelas',
    'condicao_pagamento_descricao',
    'entrega_modalidade_id',
    'entrega_cep',
    'entrega_logradouro',
    'instalacao_necessaria',
    'instalacao_tipo_id',
  ];

  for (const campo of camposParaComparar) {
    const valOrig = estadoOrig[campo];
    const valDest = estadoDest[campo];

    if (JSON.stringify(valOrig) !== JSON.stringify(valDest)) {
      let tipoMudanca: TipoMudanca = 'MODIFICADO';
      if (valOrig === undefined && valDest !== undefined) {
        tipoMudanca = 'ADICIONADO';
      } else if (valOrig !== undefined && valDest === undefined) {
        tipoMudanca = 'REMOVIDO';
      }

      alteracoesGerais.push({
        campo,
        rotulo: MAPA_ROTULOS[campo] ?? campo,
        valorAnterior: valOrig ?? null,
        valorNovo: valDest ?? null,
        tipoMudanca,
      });
    }
  }

  // Comparação de Produtos / Itens do Orçamento
  const prodsOrig = extrairProdutos(estadoOrig);
  const prodsDest = extrairProdutos(estadoDest);

  const mapaOrig = new Map<string, Record<string, unknown>>();
  for (const p of prodsOrig) {
    const id = String(p.id ?? p.nome ?? Math.random());
    mapaOrig.set(id, p);
  }

  const alteracoesProdutos: ProdutoDiff[] = [];
  let prodsAdicionados = 0;
  let prodsRemovidos = 0;
  let prodsModificados = 0;

  const processadosIds = new Set<string>();

  for (const pDest of prodsDest) {
    const id = String(pDest.id ?? pDest.nome ?? Math.random());
    processadosIds.add(id);

    const pOrig = mapaOrig.get(id);
    const nome = String(pDest.nome ?? pDest.nome_servico ?? 'Item sem nome');

    if (!pOrig) {
      prodsAdicionados++;
      alteracoesProdutos.push({
        produtoId: pDest.id ? String(pDest.id) : undefined,
        nome,
        tipoMudanca: 'ADICIONADO',
        alteracoes: [],
      });
    } else {
      // Produto alterado?
      const alteracoesItem: ItemDiff[] = [];
      const camposItem = [
        'nome',
        'quantidade',
        'largura',
        'altura',
        'preco_unitario',
        'preco_total',
        'instalacao_necessaria',
      ];

      for (const ci of camposItem) {
        if (JSON.stringify(pOrig[ci]) !== JSON.stringify(pDest[ci])) {
          alteracoesItem.push({
            campo: ci,
            rotulo: MAPA_ROTULOS[ci] ?? ci,
            valorAnterior: pOrig[ci] ?? null,
            valorNovo: pDest[ci] ?? null,
            tipoMudanca: 'MODIFICADO',
          });
        }
      }

      if (alteracoesItem.length > 0) {
        prodsModificados++;
        alteracoesProdutos.push({
          produtoId: String(id),
          nome,
          tipoMudanca: 'MODIFICADO',
          alteracoes: alteracoesItem,
        });
      }
    }
  }

  for (const [id, pOrig] of mapaOrig.entries()) {
    if (!processadosIds.has(id)) {
      prodsRemovidos++;
      const nome = String(pOrig.nome ?? pOrig.nome_servico ?? 'Item sem nome');
      alteracoesProdutos.push({
        produtoId: String(id),
        nome,
        tipoMudanca: 'REMOVIDO',
        alteracoes: [],
      });
    }
  }

  const precoAnterior = Number(estadoOrig.preco_final ?? estadoOrig.valor_total ?? 0) || null;
  const precoNovo = Number(estadoDest.preco_final ?? estadoDest.valor_total ?? 0) || null;
  const diferencaPreco =
    precoAnterior !== null && precoNovo !== null ? precoNovo - precoAnterior : null;

  return {
    houveAlteracaoMaterial: materialDivergente,
    hashOrigem,
    hashDestino,
    resumo: {
      precoAnterior,
      precoNovo,
      diferencaPreco,
      produtosAdicionados: prodsAdicionados,
      produtosRemovidos: prodsRemovidos,
      produtosModificados: prodsModificados,
    },
    alteracoesGerais,
    alteracoesProdutos,
  };
}
