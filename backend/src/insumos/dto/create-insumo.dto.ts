import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
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
  unidade_medida: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo_unitario: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  custo_lote?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade_lote?: number;

  @IsOptional()
  @IsString()
  codigo_interno?: string;
  
  @IsOptional()
  @IsNumber()
  @Min(0)
  estoque_minimo?: number;

  @IsOptional()
  @IsString()
  descricao_tecnica?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsEnum(LogicaConsumoInsumo)
  logica_consumo?: LogicaConsumoInsumo;

  @IsOptional()
  parametros_consumo?: any;
} 