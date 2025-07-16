import { IsString, IsOptional, IsNumber, IsDecimal } from 'class-validator';

export class CreateItemProdutoDto {
  @IsString()
  nome_servico: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsNumber()
  largura_produto?: number;

  @IsOptional()
  @IsNumber()
  altura_produto?: number;

  @IsOptional()
  @IsString()
  unidade_medida_produto?: string;

  @IsOptional()
  @IsNumber()
  area_produto?: number;

  @IsOptional()
  @IsNumber()
  ordem?: number;
} 