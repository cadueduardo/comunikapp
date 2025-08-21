import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class BuscarInsumosDto {
  @ApiPropertyOptional({ description: 'Nome do insumo para busca' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'ID da categoria para filtrar' })
  @IsOptional()
  @IsString()
  categoria_id?: string;

  @ApiPropertyOptional({ description: 'Marca para filtrar' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional({ description: 'Filtrar por insumos ativos' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Número da página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Itens por página', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Campo para ordenação', default: 'nome' })
  @IsOptional()
  @IsString()
  orderBy?: string = 'nome';

  @ApiPropertyOptional({ description: 'Direção da ordenação', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({ description: 'Filtrar por disponibilidade' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  disponibilidade?: boolean;
}
