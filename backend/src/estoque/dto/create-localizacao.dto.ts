/**
 * DTO para criação de localização de estoque
 * Seguindo exatamente a estrutura do PBI v4
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive, Length, Matches, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateLocalizacaoDto {
  @ApiProperty({
    description: 'Código único da localização (formato flexível)',
    example: 'A1-01-B-02-03 ou DEP-001 ou SETOR-A-01',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: 'Código é obrigatório' })
  @Length(2, 50, { message: 'Código deve ter entre 2 e 50 caracteres' })
  @Matches(/^[A-Z0-9\-_\/\.]+$/, {
    message: 'Código deve conter apenas letras maiúsculas, números, hífens, underscores, barras e ponto',
  })
  codigo: string;

  @ApiProperty({
    description: 'Nome do depósito',
    example: 'Depósito Principal',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Depósito é obrigatório' })
  @Length(2, 100, { message: 'Depósito deve ter entre 2 e 100 caracteres' })
  deposito: string;

  @ApiProperty({
    description: 'Corredor (opcional)',
    example: 'A',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'Corredor deve ter entre 1 e 50 caracteres' })
  corredor?: string;

  @ApiProperty({
    description: 'Prateleira (opcional)',
    example: '01',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'Prateleira deve ter entre 1 e 50 caracteres' })
  prateleira?: string;

  @ApiProperty({
    description: 'Nível (opcional)',
    example: 'B',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'Nível deve ter entre 1 e 50 caracteres' })
  nivel?: string;

  @ApiProperty({
    description: 'Posição (opcional)',
    example: '02',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'Posição deve ter entre 1 e 50 caracteres' })
  posicao?: string;

  @ApiProperty({
    description: 'Descrição da localização (opcional)',
    example: 'Localização para materiais de acabamento',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  descricao?: string;

  @ApiProperty({
    description: 'Capacidade da localização (opcional)',
    example: 1000.50,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Capacidade deve ser um número' })
  @IsPositive({ message: 'Capacidade deve ser positiva' })
  capacidade?: number;

  @ApiProperty({
    description: 'Status ativo da localização',
    example: true,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo?: boolean = true;
}
