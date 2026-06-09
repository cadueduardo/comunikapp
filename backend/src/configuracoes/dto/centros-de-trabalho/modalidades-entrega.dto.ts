import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

const emptyToUndefined = ({ value }: { value: unknown }) =>
  value === '' || value === null ? undefined : value;

export class CreateModalidadeEntregaDto {
  @IsString()
  @Length(1, 100)
  nome: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  exige_endereco?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  exige_valor?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  valor_padrao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  custo_padrao?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  prazo_padrao_dias?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? false)
  permite_retirada?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacoes_padrao?: string;
}

export class UpdateModalidadeEntregaDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nome?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  exige_endereco?: boolean;

  @IsOptional()
  @IsBoolean()
  exige_valor?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  valor_padrao?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  custo_padrao?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(365)
  @Type(() => Number)
  @Transform(emptyToUndefined)
  prazo_padrao_dias?: number;

  @IsOptional()
  @IsBoolean()
  permite_retirada?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacoes_padrao?: string;
}
