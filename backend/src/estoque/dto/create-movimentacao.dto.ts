/**
 * DTO para criação de movimentação de estoque
 * Logs completos e rastreáveis (premissa)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsUUID, IsIn, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovimentacaoDto {
  @ApiProperty({
    description: 'ID do item de estoque',
    example: 'item-1754619458361',
  })
  @IsString()
  @IsNotEmpty({ message: 'ID do item é obrigatório' })
  estoqueId: string;

  @ApiProperty({
    description: 'Tipo de movimentação',
    example: 'ENTRADA',
    enum: ['ENTRADA', 'SAIDA', 'AJUSTE', 'INVENTARIO', 'TRANSFERENCIA'],
  })
  @IsString()
  @IsNotEmpty({ message: 'Tipo de movimentação é obrigatório' })
  @IsIn(['ENTRADA', 'SAIDA', 'AJUSTE', 'INVENTARIO', 'TRANSFERENCIA'], {
    message: 'Tipo deve ser: ENTRADA, SAIDA, AJUSTE, INVENTARIO ou TRANSFERENCIA',
  })
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'INVENTARIO' | 'TRANSFERENCIA';

  @ApiProperty({
    description: 'Quantidade da movimentação',
    example: 50.5,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'Quantidade deve ser um número' })
  @IsPositive({ message: 'Quantidade deve ser positiva' })
  @Type(() => Number)
  quantidade: number;

  @ApiProperty({
    description: 'Referência do documento (NF, OS, etc.)',
    example: 'NF-001234',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100, { message: 'Referência do documento deve ter até 100 caracteres' })
  documentoRef?: string;

  @ApiProperty({
    description: 'ID do orçamento relacionado (se aplicável)',
    example: '550e8400-e29b-41d4-a716-446655440003',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsUUID(4, { message: 'ID do orçamento deve ser um UUID válido' })
  orcamentoId?: string;

  @ApiProperty({
    description: 'Observações sobre a movimentação',
    example: 'Entrada de mercadoria conforme NF 001234',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500, { message: 'Observações devem ter até 500 caracteres' })
  observacoes?: string;
}
