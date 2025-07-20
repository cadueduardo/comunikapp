import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemOrcamentoDto {
  @IsString()
  insumo_id: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  quantidade: number;
}

export class CreateMaquinaOrcamentoDto {
  @IsString()
  maquina_id: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  horas_utilizadas: number;
}

export class CreateFuncaoOrcamentoDto {
  @IsString()
  funcao_id: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  horas_trabalhadas: number;
}

export class CreateOrcamentoDto {
  @IsString()
  nome_servico: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @Type(() => Number)
  horas_producao: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemOrcamentoDto)
  itens: CreateItemOrcamentoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaquinaOrcamentoDto)
  @IsOptional()
  maquinas?: CreateMaquinaOrcamentoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFuncaoOrcamentoDto)
  @IsOptional()
  funcoes?: CreateFuncaoOrcamentoDto[];

  @IsString()
  @IsOptional()
  cliente_id?: string;

  @IsString()
  @IsOptional()
  condicoes_comerciais?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  margem_lucro_customizada?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  impostos_customizados?: number;

  // Dimensões do produto
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  largura_produto?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  altura_produto?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  area_produto?: number;

  @IsString()
  @IsOptional()
  unidade_medida_produto?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  quantidade_produto?: number;
} 