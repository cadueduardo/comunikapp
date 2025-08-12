/**
 * DTO para criação de item de estoque
 * Integração nativa com módulo de insumos (premissa)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, Min, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemEstoqueDto {
  @ApiProperty({
    description: 'ID do insumo (integração com módulo de insumos)',
    example: 'clh1234567890',
    format: 'cuid',
  })
  @IsString()
  @IsNotEmpty({ message: 'ID do insumo é obrigatório' })
  insumoId: string;

  @ApiProperty({
    description: 'ID da localização onde o item será armazenado',
    example: 'clh1234567891',
    format: 'cuid',
  })
  @IsString()
  @IsNotEmpty({ message: 'ID da localização é obrigatório' })
  localizacaoId: string;

  @ApiProperty({
    description: 'Código interno do item',
    example: 'ITEM-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  codigo?: string;

  @ApiProperty({
    description: 'Nome do item em estoque',
    example: 'Papel Couche 90g',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome do item é obrigatório' })
  nome: string;

  @ApiProperty({
    description: 'Descrição detalhada do item',
    example: 'Papel couche 90g, tamanho A4, cor branca',
    required: false,
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({
    description: 'Quantidade inicial em estoque',
    example: 100.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Quantidade atual deve ser um número' })
  @Min(0, { message: 'Quantidade atual não pode ser negativa' })
  @Type(() => Number)
  quantidadeAtual: number;

  @ApiProperty({
    description: 'Quantidade reservada em estoque',
    example: 10.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Quantidade reservada deve ser um número' })
  @Min(0, { message: 'Quantidade reservada não pode ser negativa' })
  @Type(() => Number)
  quantidadeReservada: number;

  @ApiProperty({
    description: 'Unidade de medida do item',
    example: 'kg',
  })
  @IsString()
  @IsNotEmpty({ message: 'Unidade de medida é obrigatória' })
  unidadeMedida: string;

  @ApiProperty({
    description: 'Preço unitário do item',
    example: 25.50,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Preço unitário deve ser um número' })
  @Min(0, { message: 'Preço unitário não pode ser negativo' })
  @Type(() => Number)
  precoUnitario: number;

  @ApiProperty({
    description: 'Estoque mínimo para alertas',
    example: 10.0,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Estoque mínimo deve ser um número' })
  @Min(0, { message: 'Estoque mínimo não pode ser negativo' })
  @Type(() => Number)
  estoqueMinimo: number;

  @ApiProperty({
    description: 'Estoque máximo permitido (opcional)',
    example: 1000.0,
    minimum: 0.01,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Estoque máximo deve ser um número' })
  @IsPositive({ message: 'Estoque máximo deve ser positivo' })
  @Type(() => Number)
  estoqueMaximo?: number;

  @ApiProperty({
    description: 'Código de barras do produto',
    example: '7891234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @ApiProperty({
    description: 'Número do lote',
    example: 'LOTE-2024-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  lote?: string;

  @ApiProperty({
    description: 'Data de validade do produto',
    example: '2024-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de validade deve ser uma data válida' })
  dataValidade?: string;

  @ApiProperty({
    description: 'ID do fornecedor',
    example: 'clh1234567892',
    required: false,
  })
  @IsOptional()
  @IsString()
  fornecedorId?: string;

  @ApiProperty({
    description: 'Observações adicionais sobre o item',
    example: 'Produto sensível à umidade',
    required: false,
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({
    description: 'Status ativo do item',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
