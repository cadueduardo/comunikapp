/**
 * Estimativa de tempo de produção para uma máquina, baseada na geometria
 * do produto (área ou perímetro) + cadastros da máquina.
 * Ver docs/fase-0-home-operacional/04-campos-geometria.md
 */

export type ModoProducaoMaquina = 'M2_H' | 'ML_H' | 'MANUAL';

export interface EntradaEstimativaMaquina {
  maquina_id: string;
  /** Quantidade de peças do produto. */
  quantidade: number;
  /** Área em m² de uma peça. Necessária quando modo = M2_H. */
  area_m2?: number;
  /** Perímetro em milímetros de uma peça. Necessário quando modo = ML_H. */
  perimetro_mm?: number;
}

export interface DetalhamentoEstimativa {
  modo_producao: ModoProducaoMaquina;
  velocidade_usada: number | null;
  unidade_velocidade: 'm2/h' | 'm/h' | null;
  setup_horas: number;
  eficiencia_percent: number | null;
  tempo_bruto_horas: number;
  tempo_com_eficiencia_horas: number;
  tempo_total_horas: number;
  mensagens: string[];
}

export interface ResultadoEstimativaMaquina {
  maquina_id: string;
  maquina_nome: string;
  estimativa_possivel: boolean;
  tempo_horas: number;
  detalhamento: DetalhamentoEstimativa;
}
