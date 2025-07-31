import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateItemProdutoDto {
  @IsString()
  insumo_id: string;

  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @IsNumber()
  @Min(0)
  custo_unitario: number;

  @IsNumber()
  @Min(0)
  custo_total: number;
}

export class CreateMaquinaProdutoDto {
  @IsString()
  maquina_id: string;

  @IsNumber()
  @Min(0)
  horas_utilizadas: number;

  @IsNumber()
  @Min(0)
  custo_total: number;
}

export class CreateFuncaoProdutoDto {
  @IsString()
  funcao_id: string;

  @IsNumber()
  @Min(0)
  horas_trabalhadas: number;

  @IsNumber()
  @Min(0)
  custo_total: number;
}

export class CreateProdutoDto {
  @IsString()
  @MaxLength(255)
  nome: string;

  @IsString()
  @MaxLength(100)
  categoria: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @IsString()
  @MaxLength(255)
  nome_servico: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descricao_produto?: string;

  @IsNumber()
  @Min(0)
  horas_producao: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  largura_produto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  altura_produto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  area_produto?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unidade_medida_produto?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidade_padrao?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemProdutoDto)
  itens: CreateItemProdutoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMaquinaProdutoDto)
  maquinas?: CreateMaquinaProdutoDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFuncaoProdutoDto)
  funcoes?: CreateFuncaoProdutoDto[];
} 