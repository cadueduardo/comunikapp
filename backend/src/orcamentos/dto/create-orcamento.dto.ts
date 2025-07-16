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

export class CreateItemProdutoOrcamentoDto {
  @IsString()
  nome_servico: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  // Medidas do produto
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  largura_produto?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  altura_produto?: number;

  @IsString()
  @IsOptional()
  unidade_medida_produto?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  area_produto?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemOrcamentoDto)
  itens: CreateItemOrcamentoDto[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  ordem?: number;
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemProdutoOrcamentoDto)
  itens_produto: CreateItemProdutoOrcamentoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaquinaOrcamentoDto)
  maquinas: CreateMaquinaOrcamentoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFuncaoOrcamentoDto)
  funcoes: CreateFuncaoOrcamentoDto[];

  @IsString()
  @IsOptional()
  cliente_id?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  margem_lucro_customizada?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  impostos_customizados?: number;

  @IsString()
  @IsOptional()
  condicoes_comerciais?: string;
} 