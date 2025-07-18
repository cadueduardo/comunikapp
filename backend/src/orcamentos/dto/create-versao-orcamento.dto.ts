import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVersaoOrcamentoDto {
  @IsString()
  observacoes: string;

  @IsOptional()
  @IsString()
  alteracoes_detectadas?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  numero_versao?: number;
} 