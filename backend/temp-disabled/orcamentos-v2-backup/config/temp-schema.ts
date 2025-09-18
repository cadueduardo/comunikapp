// ===== CONFIGURAÇÃO TEMPORÁRIA PARA ORÇAMENTOS V2 =====
// Este arquivo mapeia os modelos existentes do Prisma para as interfaces do orcamentos-v2
// até que o schema completo seja implementado

import { PrismaService } from '../../prisma/prisma.service';

// Mapeamento temporário para modelos que ainda não existem no schema
export const TEMP_SCHEMA_MAPPING = {
  // Modelos que existem no schema atual
  orcamento: 'orcamento',
  cliente: 'cliente',
  loja: 'loja',
  insumo: 'insumos',
  maquina: 'maquina',
  funcao: 'funcao',
  
  // Modelos que precisam ser criados (usando nomes temporários)
  produtoOrcamento: 'orcamento', // Temporariamente usando orcamento
  itemInsumo: 'itemorcamento', // Usando o modelo existente
  itemMaquina: 'maquinaorcamento', // Usando o modelo existente
  itemFuncao: 'funcaoorcamento', // Usando o modelo existente
  itemServicoManual: 'orcamento', // Temporariamente usando orcamento
  itemCustoIndireto: 'orcamento', // Temporariamente usando orcamento
  versaoOrcamento: 'orcamento', // Temporariamente usando orcamento
  aprovacaoOrcamento: 'orcamento', // Temporariamente usando orcamento
  linkPublico: 'orcamento', // Temporariamente usando orcamento
  acessoLink: 'orcamento', // Temporariamente usando orcamento
  mensagemChat: 'mensagemnegociacao', // Usando o modelo existente
  anexoOrcamento: 'orcamento', // Temporariamente usando orcamento
  historicoOrcamento: 'OrcamentoHistorico', // Usando o modelo existente
  orcamentoLog: 'OrcamentoLog', // Usando o modelo existente
  categoriaInsumo: 'Categoria', // Usando o modelo existente
  fornecedor: 'fornecedor', // Usando o modelo existente
  usuario: 'usuario', // Usando o modelo existente
  estoque: 'orcamento', // Temporariamente usando orcamento
};

// Extensão temporária do PrismaService para orcamentos-v2
export class TempPrismaService extends PrismaService {
  // Métodos temporários para modelos que ainda não existem
  
  // ProdutoOrcamento
  get produtoOrcamento() {
    return this.orcamento as any;
  }
  
  // ItemInsumo
  get itemInsumo() {
    return this.itemorcamento as any;
  }
  
  // ItemMaquina
  get itemMaquina() {
    return this.maquinaorcamento as any;
  }
  
  // ItemFuncao
  get itemFuncao() {
    return this.funcaoorcamento as any;
  }
  
  // ItemServicoManual
  get itemServicoManual() {
    return this.orcamento as any;
  }
  
  // ItemCustoIndireto
  get itemCustoIndireto() {
    return this.orcamento as any;
  }
  
  // VersaoOrcamento
  get versaoOrcamento() {
    return this.orcamento as any;
  }
  
  // AprovacaoOrcamento
  get aprovacaoOrcamento() {
    return this.orcamento as any;
  }
  
  // LinkPublico
  get linkPublico() {
    return this.orcamento as any;
  }
  
  // AcessoLink
  get acessoLink() {
    return this.orcamento as any;
  }
  
  // MensagemChat
  get mensagemChat() {
    return this.mensagemnegociacao as any;
  }
  
  // AnexoOrcamento
  get anexoOrcamento() {
    return this.orcamento as any;
  }
  
  // HistoricoOrcamento
  get historicoOrcamento() {
    return this.orcamento as any;
  }
  
  // CategoriaInsumo
  get categoriaInsumo() {
    return this.categoria as any;
  }
  
  // Estoque
  get estoque() {
    return this.orcamento as any;
  }
}

// Configurações temporárias para campos que ainda não existem
export const TEMP_FIELD_MAPPING = {
  // Campos que existem no modelo orcamento atual
  orcamento: {
    id: 'id',
    criado_em: 'criado_em',
    atualizado_em: 'atualizado_em',
    numero: 'numero',
    nome_servico: 'nome_servico',
    descricao: 'descricao',
    horas_producao: 'horas_producao',
    custo_material: 'custo_material',
    custo_mao_obra: 'custo_mao_obra',
    custo_indireto: 'custo_indireto',
    custo_total: 'custo_total',
    margem_lucro: 'margem_lucro',
    impostos: 'impostos',
    preco_final: 'preco_final',
    loja_id: 'loja_id',
    cliente_id: 'cliente_id',
    altura_produto: 'altura_produto',
    area_produto: 'area_produto',
    largura_produto: 'largura_produto',
    quantidade_produto: 'quantidade_produto',
    unidade_medida_produto: 'unidade_medida_produto',
    observacoes_cliente: 'observacoes_cliente',
    status_aprovacao: 'status_aprovacao',
    codigo_aprovacao: 'codigo_aprovacao',
    status: 'status',
    atendente: 'atendente',
    forma_pagamento: 'forma_pagamento',
    prazo_entrega: 'prazo_entrega',
    validade_proposta: 'validade_proposta',
  },
  
  // Campos que precisam ser adicionados (usando campos temporários)
  produtoOrcamento: {
    id: 'id',
    orcamento_id: 'id', // Temporariamente usando o próprio ID
    nome_servico: 'nome_servico',
    descricao: 'descricao',
    quantidade: 'quantidade_produto',
    largura: 'largura_produto',
    altura: 'altura_produto',
    area_produto: 'area_produto',
    unidade_medida: 'unidade_medida_produto',
    custo_total_producao: 'custo_total',
    preco_unitario: 'preco_final',
    preco_total: 'preco_final',
    horas_producao: 'horas_producao',
    custos_indiretos_rateados: 'custo_indireto',
    observacoes: 'observacoes_cliente',
    ordem: 'id', // Temporariamente usando ID
    ativo: 'status', // Temporariamente usando status
    criado_em: 'criado_em',
    atualizado_em: 'atualizado_em',
  },
  
  // Campos para itens (usando modelos existentes)
  itemInsumo: {
    id: 'id',
    produto_id: 'orcamento_id',
    insumo_id: 'insumo_id',
    quantidade: 'quantidade',
    custo_unitario: 'custo_unitario',
    custo_total: 'custo_total',
    unidade_consumo: 'unidade_uso',
    area_produto: 'area_produto',
    largura: 'largura_produto',
    altura: 'altura_produto',
    criado_em: 'criado_em',
  },
  
  itemMaquina: {
    id: 'id',
    produto_id: 'orcamento_id',
    maquina_id: 'maquina_id',
    horas_utilizadas: 'horas_utilizadas',
    custo_por_hora: 'custo_hora',
    custo_total: 'custo_total',
    observacoes: 'observacoes',
    criado_em: 'criado_em',
  },
  
  itemFuncao: {
    id: 'id',
    produto_id: 'orcamento_id',
    funcao_id: 'funcao_id',
    horas_trabalhadas: 'horas_trabalhadas',
    custo_por_hora: 'custo_hora',
    custo_total: 'custo_total',
    observacoes: 'observacoes',
    criado_em: 'criado_em',
  },
};

// Função para mapear campos temporariamente
export function mapTempFields(model: string, data: any): any {
  const mapping = TEMP_FIELD_MAPPING[model];
  if (!mapping) return data;
  
  const mapped = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (data[value] !== undefined) {
      mapped[key] = data[value];
    }
  }
  return mapped;
}

// Função para mapear campos de volta para o modelo existente
export function mapBackToExisting(model: string, data: any): any {
  const mapping = TEMP_FIELD_MAPPING[model];
  if (!mapping) return data;
  
  const mapped = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (data[key] !== undefined) {
      mapped[value] = data[key];
    }
  }
  return mapped;
}
