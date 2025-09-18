import { IsString, IsOptional, IsNumber, IsEnum, IsBoolean, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LogicaConsumoInsumo } from '../interfaces';

export class CreateCatalogoInsumoDto {
  @ApiProperty({ description: 'Código único do insumo no catálogo' })
  @IsString()
  codigo_catalogo: string;

  @ApiProperty({ description: 'Nome do insumo' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ description: 'Descrição técnica do insumo' })
  @IsOptional()
  @IsString()
  descricao_tecnica?: string;

  @ApiPropertyOptional({ description: 'ID da categoria global' })
  @IsOptional()
  @IsString()
  categoria_global_id?: string;

  @ApiPropertyOptional({ description: 'Marca do insumo' })
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional({ description: 'Especificações técnicas em JSON' })
  @IsOptional()
  @IsObject()
  especificacoes?: Record<string, any>;

  @ApiProperty({ description: 'Unidade de compra (ex: bobina, caixa)' })
  @IsString()
  unidade_compra: string;

  @ApiProperty({ description: 'Unidade de uso (ex: metro, cm²)' })
  @IsString()
  unidade_uso: string;

  @ApiProperty({ description: 'Fator de conversão entre unidades' })
  @IsNumber()
  fator_conversao: number;

  @ApiPropertyOptional({ description: 'Largura do material' })
  @IsOptional()
  @IsNumber()
  largura?: number;

  @ApiPropertyOptional({ description: 'Altura do material' })
  @IsOptional()
  @IsNumber()
  altura?: number;

  @ApiPropertyOptional({ description: 'Gramatura do material' })
  @IsOptional()
  @IsNumber()
  gramatura?: number;

  @ApiPropertyOptional({ description: 'Unidade da dimensão' })
  @IsOptional()
  @IsString()
  unidade_dimensao?: string;

  @ApiPropertyOptional({ description: 'Tipo de cálculo para consumo' })
  @IsOptional()
  @IsString()
  tipo_calculo?: string;

  @ApiProperty({ 
    description: 'Lógica de consumo do insumo',
    enum: LogicaConsumoInsumo
  })
  @IsEnum(LogicaConsumoInsumo)
  logica_consumo: LogicaConsumoInsumo;

  @ApiPropertyOptional({ description: 'Disponibilidade do insumo' })
  @IsOptional()
  @IsBoolean()
  disponibilidade?: boolean;

  @ApiPropertyOptional({ description: 'Fonte de coleta dos dados' })
  @IsOptional()
  @IsString()
  fonte_coleta?: string;

  @ApiPropertyOptional({ description: 'Data de coleta dos dados' })
  @IsOptional()
  @IsDateString()
  data_coleta?: string;
}
