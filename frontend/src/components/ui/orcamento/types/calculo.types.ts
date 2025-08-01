// Tipos específicos para cálculos de orçamento

export interface CalculoResultado {
  horas_producao: number;
  custos: {
    custo_material: number;
    custo_mao_obra: number;
    custo_maquinaria: number;
    custo_indireto: number;
    custos_indiretos_detalhados: Array<{
      nome: string;
      categoria: string;
      valor_rateado: number;
      percentual_rateio: number;
    }>;
    custo_total_producao: number;
    margem_lucro_percentual: number;
    margem_lucro_valor: number;
    subtotal_com_lucro: number;
    impostos_percentual: number;
    impostos_valor: number;
    preco_final: number;
  };
  itens: Array<{
    insumo_id: string;
    nome_insumo: string;
    quantidade: number;
    custo_unitario: number;
    custo_total: number;
    unidade_medida: string;
  }>;
  maquinas: Array<{
    maquina_id: string;
    nome_maquina: string;
    tipo_maquina: string;
    horas_utilizadas: number;
    custo_por_hora: number;
    custo_total: number;
  }>;
  funcoes: Array<{
    funcao_id: string;
    nome_funcao: string;
    horas_trabalhadas: number;
    custo_por_hora: number;
    custo_total: number;
    maquina_vinculada?: string;
  }>;
} 