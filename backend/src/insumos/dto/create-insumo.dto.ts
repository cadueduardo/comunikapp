import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsPositive,
  IsEnum,
} from 'class-validator';
import { LogicaConsumoInsumo } from '@prisma/client';

export class CreateInsumoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;

  @IsString()
  @IsNotEmpty()
  fornecedorId: string;

  @IsString()
  @IsNotEmpty()
  unidade_compra: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  custo_unitario: number;

  // Novos campos conforme documentação
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantidade_compra: number;

  @IsString()
  @IsNotEmpty()
  unidade_uso: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  fator_conversao: number;

  // Campos de dimensões (opcional)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  largura?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  altura?: number;

  @IsOptional()
  @IsString()
  unidade_dimensao?: string;

  @IsOptional()
  @IsString()
  tipo_calculo?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @IsPositive()
  gramatura?: number;

  // Campos de lógica de consumo
  @IsOptional()
  @IsEnum(LogicaConsumoInsumo)
  logica_consumo?: LogicaConsumoInsumo;

  @IsOptional()
  @IsString()
  tipo_material_id?: string;

  @IsOptional()
  parametros_consumo?: any;

  @IsOptional()
  @IsString()
  codigo_interno?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  estoque_minimo?: number;

  @IsOptional()
  @IsBoolean()
  controlar_estoque?: boolean;

  @IsOptional()
  @IsString()
  estoque_localizacao_id?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  estoque_quantidade_inicial?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  estoque_maximo?: number;

  @IsOptional()
  @IsString()
  estoque_lote?: string;

  @IsOptional()
  @IsString()
  estoque_data_validade?: string;

  @IsOptional()
  @IsString()
  estoque_observacoes?: string;

  @IsOptional()
  @IsString()
  descricao_tecnica?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
