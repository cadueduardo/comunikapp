import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

// Lista de tipos de máquinas válidos
const TIPOS_MAQUINAS_VALIDOS = [
  // Impressão Digital
  'PLOTTER_GRANDE_FORMATO', 'IMPRESSORA_UV', 'IMPRESSORA_LATEX', 'IMPRESSORA_SOLVENTE',
  'IMPRESSORA_ECO_SOLVENTE', 'IMPRESSORA_DTG', 'IMPRESSORA_SUBLIMACAO', 'IMPRESSORA_TERMICA',
  
  // Corte e Acabamento
  'PLOTTER_CORTE', 'ROUTER_CNC', 'LASER_CO2', 'LASER_FIBRA', 'CORTE_VINIL', 'CORTE_PAPEL',
  'CORTE_TECIDO', 'DOBRADEIRA', 'VINCO', 'REFRIGO',
  
  // Acabamento e Laminagem
  'LAMINADORA', 'LAMINADORA_FRIA', 'LAMINADORA_QUENTE', 'ACABAMENTO', 'VINCO_DOBRA', 'CORTE_ANGULO',
  
  // Impressão Offset e Flexografia
  'OFFSET_PLANA', 'OFFSET_ROTATIVA', 'FLEXOGRAFIA', 'SERIGRAFIA', 'TAMPOGRAFIA',
  
  // Acabamento Especializado
  'FOIL_STAMPING', 'RELEVO', 'PERFURACAO', 'COSIDURA', 'ESPIRAL', 'WIRE_O', 'ANEL',
  
  // Encadernação
  'ENCADERNADORA', 'GRAMPEADORA', 'COLADEIRA', 'COSTURA',
  
  // Acabamento de Superfície
  'VERNIZ', 'VERNIZ_UV', 'VERNIZ_LOCALIZADO', 'EMBOSSING', 'DEBOSSING',
  
  // Equipamentos Auxiliares
  'SECADORA', 'CURADORA_UV', 'LAMINADOR', 'CORTE_PRECISAO', 'FURADEIRA', 'POLIDORA',
  
  // Equipamentos de Produção
  'MONTADORA', 'EMBALADORA', 'ETIQUETADORA', 'SELADORA', 'ENFARDADEIRA',
  
  // Equipamentos de Qualidade
  'ESPECTROFOTOMETRO', 'DENSITOMETRO', 'LUPAS', 'MICROMETRO',
  
  // Equipamentos de Suporte
  'COMPRESSOR', 'GERADOR', 'AR_CONDICIONADO', 'VENTILACAO', 'EXAUSTAO',
  
  // Outros
  'OUTROS'
] as const;

const STATUS_VALIDOS = ['ATIVA', 'MANUTENCAO', 'INATIVA'] as const;

export class CreateMaquinaDto {
  @IsString()
  nome: string;

  @IsString()
  @IsIn(TIPOS_MAQUINAS_VALIDOS)
  tipo: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    return value;
  })
  @IsNumber()
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
} 