import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FuncaoTipoCalculo {
  ACOMPANHA_MAQUINA = 'ACOMPANHA_MAQUINA',
  POR_M2 = 'POR_M2',
  POR_UNIDADE = 'POR_UNIDADE',
  MANUAL = 'MANUAL',
}

export class CreateFuncaoDto {
  @IsString()
  nome: string;

  @IsNumber()
  @Type(() => Number)
  custo_hora: number;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  maquina_id?: string;

  // Novos campos do Centro de Trabalho
  @IsOptional()
  @IsEnum(FuncaoTipoCalculo)
  tipo_calculo?: FuncaoTipoCalculo;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fator_acompanhamento?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  horas_por_m2?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  horas_por_unidade?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  eficiencia_percent?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  setup_min?: number;

  /** Setor produtivo ao qual a função pertence (para rateio de custos indiretos) */
  @IsOptional()
  @IsString()
  setor_id?: string;
}
