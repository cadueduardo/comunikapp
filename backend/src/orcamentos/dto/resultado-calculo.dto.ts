export class ItemOrcamentoCalculadoDto {
  insumo_id: string;
  nome_insumo: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  unidade_medida: string;
}

export class DetalhamentoCustoDto {
  // Custos Diretos
  custo_material: number;
  custo_mao_obra: number;
  custo_maquinaria: number;
  
  // Custos Indiretos
  custo_indireto: number;
  custos_indiretos_detalhados: Array<{
    nome: string;
    categoria: string;
    valor_rateado: number;
    percentual_rateio: number;
  }>;
  
  // Totais
  custo_total_producao: number;
  margem_lucro_percentual: number;
  margem_lucro_valor: number;
  subtotal_com_lucro: number;
  impostos_percentual: number;
  impostos_valor: number;
  preco_final: number;
}

export class ResultadoCalculoDto {
  nome_servico: string;
  descricao?: string;
  horas_producao: number;
  
  // Detalhamento dos materiais
  itens: ItemOrcamentoCalculadoDto[];
  
  // Detalhamento das máquinas
  maquinas: Array<{
    maquina_id: string;
    nome_maquina: string;
    tipo_maquina: string;
    horas_utilizadas: number;
    custo_por_hora: number;
    custo_total: number;
  }>;
  
  // Detalhamento das funções
  funcoes: Array<{
    funcao_id: string;
    nome_funcao: string;
    horas_trabalhadas: number;
    custo_por_hora: number;
    custo_total: number;
    maquina_vinculada?: string;
  }>;
  
  // Detalhamento dos custos
  custos: DetalhamentoCustoDto;
  
  // Parâmetros utilizados no cálculo
  parametros: {
    custo_maquinaria_por_hora: number;
    custos_indiretos_por_hora: number;
    margem_lucro_percentual: number;
    impostos_percentual: number;
    total_horas_produtivas_mes: number;
  };
} 