export class ItemOrcamentoCalculadoDto {
  insumo_id: string;
  nome_insumo: string;
  quantidade: number;
  custo_unitario: number;
  custo_total: number;
  unidade_medida: string;
  // Campos de medidas
  largura?: number;
  altura?: number;
  unidade_medida_item?: string; // Unidade das medidas (mm, cm, m, etc.)
  area_calculada?: number; // Área em m² calculada automaticamente
}

export class MaquinaCalculadaDto {
  maquina_id: string;
  nome_maquina: string;
  tipo_maquina: string;
  horas_utilizadas: number;
  custo_por_hora: number;
  custo_total: number;
}

export class FuncaoCalculadaDto {
  funcao_id: string;
  nome_funcao: string;
  horas_trabalhadas: number;
  custo_por_hora: number;
  custo_total: number;
  maquina_vinculada?: string;
}

export class CustoIndiretoCalculadoDto {
  custo_indireto_id: string;
  nome: string;
  categoria: string;
  valor_mensal: number;
  regra_rateio: string;
  valor_rateado: number;
  percentual_rateio: number;
}

export class DetalhamentoCustoDto {
  // Custos Diretos
  custo_material: number;
  custo_mao_obra: number;
  custo_maquinaria: number;
  
  // Custos Indiretos
  custo_indireto: number;
  custos_indiretos_detalhados: CustoIndiretoCalculadoDto[];
  
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
  horas_producao_total: number;
  
  // Detalhamento dos materiais
  itens: ItemOrcamentoCalculadoDto[];
  
  // Detalhamento das máquinas
  maquinas: MaquinaCalculadaDto[];
  
  // Detalhamento das funções
  funcoes: FuncaoCalculadaDto[];
  
  // Detalhamento dos custos
  custos: DetalhamentoCustoDto;
  
  // Parâmetros utilizados no cálculo
  parametros: {
    margem_lucro_percentual: number;
    impostos_percentual: number;
    total_horas_produtivas_mes: number;
  };

  // Informações de simulação (se aplicável)
  simulacao?: {
    modo_simulacao: boolean;
    cenarios_comparacao?: any[];
  };
} 