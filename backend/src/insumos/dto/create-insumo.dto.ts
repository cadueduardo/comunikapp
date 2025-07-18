import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsPositive,
} from 'class-validator';

export class CreateInsumoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;

  @IsString()
  @IsNotEmpty()
  fornecedorId: string;

  @IsString()
  @IsNotEmpty()
  unidade_compra: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  custo_unitario: number;

  // Novos campos conforme documentação
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantidade_compra: number;

  @IsString()
  @IsNotEmpty()
  unidade_uso: string;

  @IsNumber({ maxDecimalPlaces: 4 })
  @IsPositive()
  fator_conversao: number;

  // Campos de dimensões (opcional)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  largura?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  altura?: number;

  @IsOptional()
  @IsString()
  unidade_dimensao?: string;

  @IsOptional()
  @IsString()
  tipo_calculo?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @IsPositive()
  gramatura?: number;

  @IsOptional()
  @IsString()
  codigo_interno?: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  estoque_minimo?: number;

  @IsOptional()
  @IsString()
  descricao_tecnica?: string;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
} 