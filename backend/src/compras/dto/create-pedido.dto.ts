import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PedidoItemDto } from './pedido-item.dto';

export class CreatePedidoDto {
  @IsString()
  @IsNotEmpty({ message: 'fornecedor_id é obrigatório' })
  fornecedor_id: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  moeda?: string;

  @IsOptional()
  @IsNumber({}, { message: 'desconto deve ser um número' })
  @Min(0, { message: 'desconto não pode ser negativo' })
  @Type(() => Number)
  desconto?: number;

  @IsOptional()
  @IsNumber({}, { message: 'frete deve ser um número' })
  @Min(0, { message: 'frete não pode ser negativo' })
  @Type(() => Number)
  frete?: number;

  @IsOptional()
  @IsDateString({}, { message: 'data_prevista deve ser uma data válida' })
  data_prevista?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  condicao_pagamento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  observacoes?: string;

  @IsArray({ message: 'itens deve ser uma lista' })
  @ArrayMinSize(1, { message: 'Informe ao menos um item no pedido' })
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  itens: PedidoItemDto[];
}
