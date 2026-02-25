import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsHexColor,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateSetorProdutivoDto {
  @IsString()
  @Length(1, 100)
  nome: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descricao?: string;

  @IsOptional()
  @IsHexColor()
  @Transform(({ value }) => value || '#3B82F6')
  cor?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  @Transform(({ value }) => value ?? 0)
  ordem?: number;

  /** Horas produtivas mensais deste setor (para rateio de custos indiretos) */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  @Type(() => Number)
  horas_produtivas_mensais?: number;

  /** Percentual fixo dos custos gerais que este setor absorve (0-100). Se não informado, rateio proporcional às horas. */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentual_rateio_geral?: number;
}

export class UpdateSetorProdutivoDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nome?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  descricao?: string;

  @IsOptional()
  @IsHexColor()
  cor?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  ordem?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  @Type(() => Number)
  horas_produtivas_mensais?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  percentual_rateio_geral?: number;
}

export class SetorProdutivoQueryDto {
  @IsOptional()
  @IsString()
  lojaId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  ativo?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
