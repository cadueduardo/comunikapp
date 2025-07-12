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
  
  // Custos Indiretos
  custo_indireto: number;
  
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
  
  // Detalhamento dos custos
  custos: DetalhamentoCustoDto;
  
  // Parâmetros utilizados no cálculo
  parametros: {
    custo_mao_obra_por_hora: number;
    custo_maquinaria_por_hora: number;
    custos_indiretos_por_hora: number;
    margem_lucro_percentual: number;
    impostos_percentual: number;
    total_horas_produtivas_mes: number;
  };
} 