import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnotarSobraDto {
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacao?: string;
}

export class RegistrarSobraDto {
  @IsString()
  insumoId: string;

  @IsOptional()
  @IsString()
  estoqueId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  largura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  altura?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  area?: number;

  @IsOptional()
  @IsString()
  unidadeDimensao?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  observacao?: string;
}
