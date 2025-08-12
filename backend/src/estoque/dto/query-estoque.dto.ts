/**
 * DTOs para consultas e filtros de estoque
 * Performance otimizada com paginação (premissa)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryLocalizacoesDto {
  @ApiProperty({
    description: 'Filtrar por depósito',
    example: 'Depósito Central',
    required: false,
  })
  @IsOptional()
  @IsString()
  deposito?: string;

  @ApiProperty({
    description: 'Filtrar por status ativo',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  ativo?: boolean;

  @ApiProperty({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Página deve ser um número' })
  @Min(1, { message: 'Página deve ser maior que 0' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit deve ser um número' })
  @Min(1, { message: 'Limit deve ser maior que 0' })
  @Max(100, { message: 'Limit não pode ser maior que 100' })
  @Type(() => Number)
  limit?: number = 20;
}

export class QueryItensEstoqueDto {
  @ApiProperty({
    description: 'Filtrar por ID do insumo',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'ID do insumo deve ser um UUID válido' })
  insumoId?: string;

  @ApiProperty({
    description: 'Filtrar por ID da localização',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'ID da localização deve ser um UUID válido' })
  localizacaoId?: string;

  @ApiProperty({
    description: 'Mostrar apenas itens com estoque abaixo do mínimo',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  estoqueAbaixoMinimo?: boolean;

  @ApiProperty({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Página deve ser um número' })
  @Min(1, { message: 'Página deve ser maior que 0' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit deve ser um número' })
  @Min(1, { message: 'Limit deve ser maior que 0' })
  @Max(100, { message: 'Limit não pode ser maior que 100' })
  @Type(() => Number)
  limit?: number = 20;
}

export class QueryMovimentacoesDto {
  @ApiProperty({
    description: 'Filtrar por ID do item de estoque',
    example: '550e8400-e29b-41d4-a716-446655440002',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'ID do item deve ser um UUID válido' })
  estoqueId?: string;

  @ApiProperty({
    description: 'Filtrar por tipo de movimentação',
    example: 'ENTRADA',
    enum: ['ENTRADA', 'SAIDA', 'AJUSTE', 'INVENTARIO', 'TRANSFERENCIA'],
    required: false,
  })
  @IsOptional()
  @IsString()
  tipo?: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'INVENTARIO' | 'TRANSFERENCIA';

  @ApiProperty({
    description: 'Data inicial (ISO format)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  dataInicial?: string;

  @ApiProperty({
    description: 'Data final (ISO format)',
    example: '2025-01-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  dataFinal?: string;

  @ApiProperty({
    description: 'Número da página',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Página deve ser um número' })
  @Min(1, { message: 'Página deve ser maior que 0' })
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit deve ser um número' })
  @Min(1, { message: 'Limit deve ser maior que 0' })
  @Max(100, { message: 'Limit não pode ser maior que 100' })
  @Type(() => Number)
  limit?: number = 20;
}
