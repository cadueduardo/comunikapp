import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProdutoFinitoDto {
  @ApiProperty({ example: 'Display Acrílico A4' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @ApiPropertyOptional({ description: 'Breve descrição para preview e PDF (até 500 caracteres)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao_resumida?: string;

  @ApiPropertyOptional({ description: 'Especificações e detalhes completos do produto' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ example: 'DISP-A4-001' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  sku: string;

  @ApiPropertyOptional({ example: '7891234567890' })
  @IsOptional()
  @IsString()
  @MaxLength(13)
  ean?: string;

  @ApiPropertyOptional({ description: 'ID de categoria existente' })
  @IsOptional()
  @IsUUID()
  categoria_id?: string;

  @ApiPropertyOptional({
    description: 'Cria categoria inline quando categoria_id não informado',
    example: 'Displays',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  categoria_nome?: string;

  @ApiProperty({ example: 149.9 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_venda: number;

  @ApiPropertyOptional({ example: 129.9 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  preco_promocional?: number;

  @ApiPropertyOptional({ example: 0.45 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  peso_kg?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  largura_cm?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  altura_cm?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  profundidade_cm?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estoque_atual?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estoque_minimo?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
