import {
  isItemAguardandoConfiguracao,
  isProdutoPrateleiraItem,
} from '../schemas/orcamento.schema';
import { ARTE_PRODUTO_DEFAULTS } from '@/components/orcamentos-v2/arte-produto.helpers';

const itemConfiguradoParaModelo = (item: Record<string, unknown>): boolean => {
  if (isProdutoPrateleiraItem(item as { tipo_item?: string })) {
    return Boolean(String(item.produto_finito_id || '').trim());
  }
  return !isItemAguardandoConfiguracao(
    item as {
      tipo_item?: string;
      nome_servico?: string;
      materiais?: Array<{ insumo_id?: string }>;
    },
  );
};

export const serializarItensModeloOrcamento = (
  itens: Array<Record<string, unknown>> | undefined,
): Array<Record<string, unknown>> => {
  if (!Array.isArray(itens)) {
    return [];
  }

  return itens.filter(itemConfiguradoParaModelo).map((item) => ({
    tipo_item: item.tipo_item || 'SOB_DEMANDA',
    produto_finito_id: item.produto_finito_id || '',
    sku_snapshot: item.sku_snapshot || '',
    preco_unitario_snapshot: item.preco_unitario_snapshot || '',
    estoque_catalogo: Number(item.estoque_catalogo ?? 0),
    imagem_snapshot_url: item.imagem_snapshot_url || '',
    nome_servico: item.nome_servico || '',
    descricao: item.descricao || '',
    descricao_detalhada: item.descricao_detalhada || '',
    quantidade_produto: item.quantidade_produto || '1',
    largura_produto: item.largura_produto || '',
    altura_produto: item.altura_produto || '',
    profundidade_produto: item.profundidade_produto || '',
    tem_profundidade: Boolean(item.tem_profundidade),
    unidade_medida_produto: item.unidade_medida_produto || 'un',
    area_produto: item.area_produto || '',
    perimetro_produto: item.perimetro_produto || '',
    geometria_origem: item.geometria_origem || 'MANUAL',
    arquivo_geometria_url: item.arquivo_geometria_url || '',
    unidade_geometria: item.unidade_geometria || 'mm',
    materiais: Array.isArray(item.materiais) ? item.materiais : [],
    maquinas: Array.isArray(item.maquinas) ? item.maquinas : [],
    funcoes: Array.isArray(item.funcoes) ? item.funcoes : [],
    servicos: Array.isArray(item.servicos) ? item.servicos : [],
    responsabilidade_arte:
      item.responsabilidade_arte || ARTE_PRODUTO_DEFAULTS.responsabilidade_arte,
    politica_cobranca_arte:
      item.politica_cobranca_arte || ARTE_PRODUTO_DEFAULTS.politica_cobranca_arte,
    finalidade_anexo: item.finalidade_anexo || '',
    complexidade_arte: item.complexidade_arte || '',
    instalacao_necessaria: Boolean(item.instalacao_necessaria),
    instalacao_tipo_id: item.instalacao_tipo_id || '',
    instalacao_regra_cobranca: item.instalacao_regra_cobranca || 'FIXO',
    instalacao_valor_unitario: item.instalacao_valor_unitario || '',
    instalacao_usar_endereco_entrega: item.instalacao_usar_endereco_entrega !== false,
    instalacao_endereco_snapshot: item.instalacao_endereco_snapshot || '',
    instalacao_cep: item.instalacao_cep || '',
    instalacao_logradouro: item.instalacao_logradouro || '',
    instalacao_numero: item.instalacao_numero || '',
    instalacao_complemento: item.instalacao_complemento || '',
    instalacao_bairro: item.instalacao_bairro || '',
    instalacao_cidade: item.instalacao_cidade || '',
    instalacao_estado: item.instalacao_estado || '',
    instalacao_preco_cobrado: item.instalacao_preco_cobrado || '',
    instalacao_custo_mao_obra: item.instalacao_custo_mao_obra || '',
    instalacao_custo_deslocamento: item.instalacao_custo_deslocamento || '',
    instalacao_tempo_estimado_min: item.instalacao_tempo_estimado_min || '',
    instalacao_quantidade_pessoas: item.instalacao_quantidade_pessoas || '',
    instalacao_observacoes: item.instalacao_observacoes || '',
  }));
};

const itemModeloVazio = () => ({
  nome_servico: '',
  descricao: '',
  descricao_detalhada: '',
  quantidade_produto: '1',
  largura_produto: '',
  altura_produto: '',
  profundidade_produto: '',
  tem_profundidade: false,
  unidade_medida_produto: 'un',
  area_produto: '',
  perimetro_produto: '',
  geometria_origem: 'MANUAL' as const,
  arquivo_geometria_url: '',
  unidade_geometria: 'mm' as const,
  materiais: [{ insumo_id: '', quantidade: '1', material_do_cliente: false }],
  maquinas: [{ maquina_id: '', horas_utilizadas: '1' }],
  funcoes: [{ funcao_id: '', horas_trabalhadas: '1' }],
  servicos: [{ servico_id: '', horas_trabalhadas: '1' }],
  ...ARTE_PRODUTO_DEFAULTS,
  instalacao_necessaria: false,
  instalacao_tipo_id: '',
  instalacao_regra_cobranca: 'FIXO',
  instalacao_valor_unitario: '',
  instalacao_usar_endereco_entrega: true,
  instalacao_endereco_snapshot: '',
  instalacao_cep: '',
  instalacao_logradouro: '',
  instalacao_numero: '',
  instalacao_complemento: '',
  instalacao_bairro: '',
  instalacao_cidade: '',
  instalacao_estado: '',
  instalacao_preco_cobrado: '',
  instalacao_custo_mao_obra: '',
  instalacao_custo_deslocamento: '',
  instalacao_tempo_estimado_min: '',
  instalacao_quantidade_pessoas: '',
  instalacao_observacoes: '',
  tipo_item: 'SOB_DEMANDA',
  produto_finito_id: '',
  sku_snapshot: '',
  preco_unitario_snapshot: '',
  estoque_catalogo: 0,
  imagem_snapshot_url: '',
});

export const deserializarItensModeloOrcamento = (
  itens: Array<Record<string, unknown>> | undefined,
): Array<Record<string, unknown>> => {
  if (!Array.isArray(itens) || itens.length === 0) {
    return [];
  }

  return itens.map((item) => {
    const base = itemModeloVazio();
    const isPrateleira = isProdutoPrateleiraItem(item as { tipo_item?: string });

    return {
      ...base,
      ...item,
      tipo_item: item.tipo_item || 'SOB_DEMANDA',
      materiais: isPrateleira
        ? []
        : Array.isArray(item.materiais) && item.materiais.length > 0
          ? item.materiais
          : base.materiais,
      maquinas: isPrateleira
        ? []
        : Array.isArray(item.maquinas) && item.maquinas.length > 0
          ? item.maquinas
          : base.maquinas,
      funcoes: isPrateleira
        ? []
        : Array.isArray(item.funcoes) && item.funcoes.length > 0
          ? item.funcoes
          : base.funcoes,
      servicos: isPrateleira
        ? []
        : Array.isArray(item.servicos) && item.servicos.length > 0
          ? item.servicos
          : base.servicos,
    };
  });
};

export const encontrarIndiceReferenciaModelo = (
  itens: Array<{ tipo_item?: string; nome_servico?: string; materiais?: Array<{ insumo_id?: string }>; produto_finito_id?: string }>,
): number => {
  const indiceCustom = itens.findIndex(
    (item) =>
      !isProdutoPrateleiraItem(item) && !isItemAguardandoConfiguracao(item),
  );
  if (indiceCustom >= 0) {
    return indiceCustom;
  }

  const indicePrateleira = itens.findIndex(
    (item) =>
      isProdutoPrateleiraItem(item) && Boolean(item.produto_finito_id?.trim()),
  );
  return indicePrateleira >= 0 ? indicePrateleira : 0;
};

export const itensProntosParaModelo = (
  itens: Array<Record<string, unknown>> | undefined,
): boolean => serializarItensModeloOrcamento(itens).length > 0;
