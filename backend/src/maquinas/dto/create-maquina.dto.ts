import {
  IsBoolean,
  IsInt,
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Lista de tipos de máquinas válidos
const TIPOS_MAQUINAS_VALIDOS = [
  // Impressão Digital
  'PLOTTER_GRANDE_FORMATO',
  'IMPRESSORA_UV',
  'IMPRESSORA_LATEX',
  'IMPRESSORA_SOLVENTE',
  'IMPRESSORA_ECO_SOLVENTE',
  'IMPRESSORA_DTG',
  'IMPRESSORA_SUBLIMACAO',
  'IMPRESSORA_TERMICA',

  // Corte e Acabamento
  'PLOTTER_CORTE',
  'ROUTER_CNC',
  'LASER_CO2',
  'LASER_FIBRA',
  'CORTE_VINIL',
  'CORTE_PAPEL',
  'CORTE_TECIDO',
  'DOBRADEIRA',
  'VINCO',
  'REFRIGO',

  // Acabamento e Laminagem
  'LAMINADORA',
  'LAMINADORA_FRIA',
  'LAMINADORA_QUENTE',
  'ACABAMENTO',
  'VINCO_DOBRA',
  'CORTE_ANGULO',

  // Impressão Offset e Flexografia
  'OFFSET_PLANA',
  'OFFSET_ROTATIVA',
  'FLEXOGRAFIA',
  'SERIGRAFIA',
  'TAMPOGRAFIA',

  // Acabamento Especializado
  'FOIL_STAMPING',
  'RELEVO',
  'PERFURACAO',
  'COSIDURA',
  'ESPIRAL',
  'WIRE_O',
  'ANEL',

  // Encadernação
  'ENCADERNADORA',
  'GRAMPEADORA',
  'COLADEIRA',
  'COSTURA',

  // Acabamento de Superfície
  'VERNIZ',
  'VERNIZ_UV',
  'VERNIZ_LOCALIZADO',
  'EMBOSSING',
  'DEBOSSING',

  // Equipamentos Auxiliares
  'SECADORA',
  'CURADORA_UV',
  'LAMINADOR',
  'CORTE_PRECISAO',
  'FURADEIRA',
  'POLIDORA',

  // Equipamentos de Produção
  'MONTADORA',
  'EMBALADORA',
  'ETIQUETADORA',
  'SELADORA',
  'ENFARDADEIRA',

  // Equipamentos de Qualidade
  'ESPECTROFOTOMETRO',
  'DENSITOMETRO',
  'LUPAS',
  'MICROMETRO',

  // Equipamentos de Suporte
  'COMPRESSOR',
  'GERADOR',
  'AR_CONDICIONADO',
  'VENTILACAO',
  'EXAUSTAO',

  // Outros
  'OUTROS',
] as const;

const STATUS_VALIDOS = ['ATIVA', 'MANUTENCAO', 'INATIVA'] as const;

export class CreateMaquinaDto {
  @IsString()
  nome: string;

  @IsString()
  @IsIn(TIPOS_MAQUINAS_VALIDOS, {
    message: `Tipo deve ser um dos valores válidos: ${TIPOS_MAQUINAS_VALIDOS.join(', ')}`,
  })
  tipo: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    return value;
  })
  @IsNumber(
    {},
    {
      message: 'Custo por hora deve ser um número válido',
    },
  )
  custo_hora: number;

  @IsString()
  @IsIn(STATUS_VALIDOS)
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  capacidade?: string;

  @IsString()
  @IsOptional()
  observacoes?: string;

  @IsOptional()
  @IsNumber()
  setup_min?: number;

  @IsOptional()
  @IsNumber()
  velocidade_m2_h?: number;

  /**
   * Velocidade em metros lineares por hora.
   * Usada quando modo_producao = ML_H (router CNC, plotter de corte, laser de corte).
   * Fase 2 - Home operacional.
   */
  @IsOptional()
  @IsNumber()
  velocidade_ml_h?: number;

  @IsOptional()
  @IsNumber()
  eficiencia_percent?: number;

  @IsOptional()
  @IsBoolean()
  usar_no_pcp?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  horas_disponiveis_dia?: number;

  @IsOptional()
  dias_produtivos?: Record<string, unknown> | string;

  @IsOptional()
  @IsBoolean()
  permite_agendamento_simultaneo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  tempo_minimo_entre_servicos_min?: number;

  @IsOptional()
  @IsBoolean()
  considerar_eficiencia_na_capacidade?: boolean;

  @IsOptional()
  @IsIn(['M2_H', 'ML_H', 'MANUAL'])
  modo_producao?: 'M2_H' | 'ML_H' | 'MANUAL';

  /** Setor produtivo ao qual a máquina pertence (para rateio de custos indiretos) */
  @IsOptional()
  @IsString()
  setor_id?: string;
}
