/**
 * DTOs para Regras de Validação
 */

import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CondicaoRegraDto {
  @ApiProperty({ description: 'Campo a ser validado' })
  @IsString()
  campo: string;

  @ApiProperty({ 
    description: 'Operador de comparação',
    enum: ['equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'contains', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null']
  })
  @IsEnum(['equals', 'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal', 'contains', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null'])
  operador: string;

  @ApiProperty({ description: 'Valor para comparação' })
  valor: any;

  @ApiPropertyOptional({ description: 'Mensagem de erro' })
  @IsOptional()
  @IsString()
  mensagem_erro?: string;

  @ApiPropertyOptional({ description: 'Mensagem de alerta' })
  @IsOptional()
  @IsString()
  mensagem_alerta?: string;

  @ApiPropertyOptional({ description: 'Expressão para cálculos complexos' })
  @IsOptional()
  @IsString()
  expressao?: string;
}

export class AcaoRegraDto {
  @ApiProperty({ 
    description: 'Tipo de ação',
    enum: ['bloquear', 'notificar', 'aprovar', 'corrigir', 'alertar']
  })
  @IsEnum(['bloquear', 'notificar', 'aprovar', 'corrigir', 'alertar'])
  tipo: string;

  @ApiPropertyOptional({ description: 'Status da OS após ação' })
  @IsOptional()
  @IsString()
  status_os?: string;

  @ApiPropertyOptional({ description: 'Perfis para notificar' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificar?: string[];

  @ApiPropertyOptional({ description: 'Parâmetros adicionais' })
  @IsOptional()
  @IsObject()
  parametros?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Delay em segundos' })
  @IsOptional()
  @IsNumber()
  delay?: number;
}

export class CreateRegraValidacaoDto {
  @ApiProperty({ description: 'Nome da regra' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ description: 'Descrição da regra' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ 
    description: 'Tipo da regra',
    enum: ['VALIDACAO', 'ALERTA', 'CORRECAO', 'APROVACAO']
  })
  @IsEnum(['VALIDACAO', 'ALERTA', 'CORRECAO', 'APROVACAO'])
  tipo: string;

  @ApiProperty({ 
    description: 'Categoria da regra',
    enum: ['ESTOQUE', 'ARTE', 'DADOS', 'PRAZO', 'FINANCEIRO', 'TECNICO', 'COMERCIAL']
  })
  @IsEnum(['ESTOQUE', 'ARTE', 'DADOS', 'PRAZO', 'FINANCEIRO', 'TECNICO', 'COMERCIAL'])
  categoria: string;

  @ApiPropertyOptional({ description: 'Regra ativa', default: true })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Prioridade da regra', default: 1 })
  @IsOptional()
  @IsNumber()
  prioridade?: number;

  @ApiPropertyOptional({ description: 'ID da loja (null para regras globais)' })
  @IsOptional()
  @IsString()
  loja_id?: string;

  @ApiProperty({ description: 'Condições da regra' })
  @ValidateNested()
  @Type(() => CondicaoRegraDto)
  condicoes: CondicaoRegraDto;

  @ApiProperty({ description: 'Ações da regra' })
  @ValidateNested()
  @Type(() => AcaoRegraDto)
  acoes: AcaoRegraDto;
}

export class UpdateRegraValidacaoDto {
  @ApiPropertyOptional({ description: 'Nome da regra' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Descrição da regra' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ 
    description: 'Tipo da regra',
    enum: ['VALIDACAO', 'ALERTA', 'CORRECAO', 'APROVACAO']
  })
  @IsOptional()
  @IsEnum(['VALIDACAO', 'ALERTA', 'CORRECAO', 'APROVACAO'])
  tipo?: string;

  @ApiPropertyOptional({ 
    description: 'Categoria da regra',
    enum: ['ESTOQUE', 'ARTE', 'DADOS', 'PRAZO', 'FINANCEIRO', 'TECNICO', 'COMERCIAL']
  })
  @IsOptional()
  @IsEnum(['ESTOQUE', 'ARTE', 'DADOS', 'PRAZO', 'FINANCEIRO', 'TECNICO', 'COMERCIAL'])
  categoria?: string;

  @ApiPropertyOptional({ description: 'Regra ativa' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Prioridade da regra' })
  @IsOptional()
  @IsNumber()
  prioridade?: number;

  @ApiPropertyOptional({ description: 'ID da loja' })
  @IsOptional()
  @IsString()
  loja_id?: string;

  @ApiPropertyOptional({ description: 'Condições da regra' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CondicaoRegraDto)
  condicoes?: CondicaoRegraDto;

  @ApiPropertyOptional({ description: 'Ações da regra' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcaoRegraDto)
  acoes?: AcaoRegraDto;
}

export class ListarRegrasDto {
  @ApiPropertyOptional({ description: 'ID da loja' })
  @IsOptional()
  @IsString()
  loja_id?: string;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  categoria?: string;

  @ApiPropertyOptional({ description: 'Apenas ativas' })
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @ApiPropertyOptional({ description: 'Termo de busca' })
  @IsOptional()
  @IsString()
  busca?: string;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite por página', default: 10 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;
}

export class ExecutarValidacaoDto {
  @ApiProperty({ description: 'ID da OS' })
  @IsString()
  os_id: string;

  @ApiPropertyOptional({ description: 'IDs específicos de regras' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regra_ids?: string[];

  @ApiPropertyOptional({ description: 'Modo teste (não aplica ações)', default: false })
  @IsOptional()
  @IsBoolean()
  modo_teste?: boolean = false;
}

export class TestarRegraDto {
  @ApiProperty({ description: 'Dados da OS para teste' })
  @IsObject()
  dados_os: Record<string, any>;

  @ApiPropertyOptional({ description: 'Modo teste', default: true })
  @IsOptional()
  @IsBoolean()
  modo_teste?: boolean = true;
}




